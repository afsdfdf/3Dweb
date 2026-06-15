/**
 * Live UI + functional audit against the deployed site.
 *
 * Run from a session/environment that has network egress to the site
 * (Network access = Custom with *.thornstavern.com, or Full):
 *
 *   pnpm install   # if node_modules is missing
 *   AUDIT_BASE_URL=https://www.thornstavern.com \
 *   AUDIT_EMAIL=<account-email> \
 *   AUDIT_PASSWORD=<account-password> \
 *   node scripts/live-ui-audit.mjs
 *
 * What it does (deterministic — no AI), in BOTH guest and authenticated states:
 *   1. UI pass: loads every route across 4 viewports, screenshots, and records
 *      HTTP status, console/page errors, failed requests, horizontal overflow,
 *      and any post-navigation redirect.
 *   2. Functional API probes: calls the real endpoints and records status/body so
 *      auth, RBAC, billing, social, model and notification features are verified.
 *      Read-only by default. Side-effectful checks (checkout sessions, charged
 *      downloads, favorite toggles) only run when AUDIT_MUTATIONS=1.
 *
 * Credentials are read from AUDIT_EMAIL/AUDIT_PASSWORD only; none are embedded
 * in source. If they are unset the auth pass is skipped (guest state only).
 *
 * Output (tmp/live-audit): <state>-<viewport>-<route>.png, report.json, report.md.
 * Falls back to the sandbox chromium under /opt/pw-browsers.
 *
 * Env knobs: AUDIT_STATES=guest,auth  AUDIT_VIEWPORTS=mobile-390,...
 *            AUDIT_EMAIL=<email>  AUDIT_PASSWORD=<password>
 *            AUDIT_MUTATIONS=1 (opt into side-effectful probes)
 *            AUDIT_CHROMIUM_PATH=/path/to/chrome
 */

import { mkdir, writeFile } from 'node:fs/promises'
import { existsSync, readdirSync } from 'node:fs'
import path from 'node:path'

import { chromium } from 'playwright'

const BASE = (process.env.AUDIT_BASE_URL || 'https://www.thornstavern.com').replace(/\/$/, '')
const API = `${BASE}/api`
const EMAIL = process.env.AUDIT_EMAIL || ''
const PASSWORD = process.env.AUDIT_PASSWORD || ''
const OUT = process.env.AUDIT_OUTPUT_DIR || path.join(process.cwd(), 'tmp', 'live-audit')
const MUTATE = process.env.AUDIT_MUTATIONS === '1'

const allRoutes = [
  ['home', '/'],
  ['pricing', '/pricing'],
  ['showcase', '/showcase'],
  ['assets', '/assets'],
  ['workbench', '/workbench'],
  ['blog', '/blog'],
  ['about', '/about'],
  ['contact', '/contact'],
  ['solutions', '/solutions'],
  ['developers', '/developers'],
  ['cart', '/cart'],
  ['checkout', '/checkout'],
  ['refund-policy', '/refund-policy'],
  ['account', '/account'],
]

const allViewports = [
  ['desktop-1920', 1920, 1080],
  ['laptop-1366', 1366, 768],
  ['tablet-820', 820, 1180],
  ['mobile-390', 390, 844],
]

const states = (process.env.AUDIT_STATES || 'guest,auth').split(',').map((s) => s.trim()).filter(Boolean)
const viewports = process.env.AUDIT_VIEWPORTS
  ? allViewports.filter((v) => process.env.AUDIT_VIEWPORTS.split(',').map((s) => s.trim()).includes(v[0]))
  : allViewports

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36'
const MUTATION_HEADERS = { origin: BASE, referer: `${BASE}/` }

function resolveExecutablePath() {
  if (process.env.AUDIT_CHROMIUM_PATH) return process.env.AUDIT_CHROMIUM_PATH
  const root = '/opt/pw-browsers'
  if (!existsSync(root)) return undefined
  const dir = readdirSync(root).find((name) => name.startsWith('chromium-') && !name.includes('headless'))
  if (!dir) return undefined
  const candidate = path.join(root, dir, 'chrome-linux', 'chrome')
  return existsSync(candidate) ? candidate : undefined
}

// ---------- UI pass ----------

async function auditPage(page, { name, route, state, viewport }) {
  const errors = []
  const failed = []
  const onConsole = (m) => {
    if (m.type() === 'error') errors.push(m.text().slice(0, 200))
  }
  const onPageError = (e) => errors.push(`PAGEERROR: ${e.message.slice(0, 200)}`)
  const onRequestFailed = (r) =>
    failed.push(`${r.method()} ${r.url().slice(0, 140)} :: ${r.failure()?.errorText || ''}`)
  page.on('console', onConsole)
  page.on('pageerror', onPageError)
  page.on('requestfailed', onRequestFailed)

  let status = null
  let finalURL = null
  try {
    const resp = await page.goto(`${BASE}${route}`, { timeout: 40_000, waitUntil: 'domcontentloaded' })
    status = resp?.status() ?? null
    await page.waitForLoadState('networkidle', { timeout: 4_000 }).catch(() => {})
    await page.waitForTimeout(800)
    finalURL = page.url()
  } catch (error) {
    errors.push(`NAV: ${error instanceof Error ? error.message : String(error)}`)
  }

  const metrics = await page
    .evaluate(() => {
      const de = document.documentElement
      const offenders = Array.from(document.querySelectorAll('body *'))
        .filter((el) => {
          const r = el.getBoundingClientRect()
          return r.right > window.innerWidth + 2 || r.left < -2
        })
        .slice(0, 6)
        .map((el) => ({
          cls: String(el.className || '').slice(0, 50),
          right: Math.round(el.getBoundingClientRect().right),
          tag: el.tagName.toLowerCase(),
        }))
      return { clientW: de.clientWidth, innerW: window.innerWidth, offenders, scrollW: de.scrollWidth }
    })
    .catch(() => ({}))

  const file = path.join(OUT, `${state}-${viewport}-${name}.png`)
  await page.screenshot({ fullPage: false, path: file }).catch(() => {})

  page.off('console', onConsole)
  page.off('pageerror', onPageError)
  page.off('requestfailed', onRequestFailed)

  const overflow = metrics.scrollW > metrics.clientW + 2 ? metrics.offenders : []
  return { errors, failed, finalURL, name, overflow, route, scrollW: metrics.scrollW, state, status, viewport }
}

// ---------- Functional API probes ----------

async function discoverIds(ctx) {
  const ids = { creditProductSlug: null, modelId: null }
  try {
    const res = await ctx.request.get(
      `${API}/models?where[visibility][equals]=public&limit=1&depth=0&sort=-createdAt`,
      { failOnStatusCode: false },
    )
    if (res.ok()) ids.modelId = (await res.json())?.docs?.[0]?.id ?? null
  } catch {
    /* ignore */
  }
  try {
    const res = await ctx.request.get(`${API}/credit-products?limit=1&depth=0&where[isActive][equals]=true`, {
      failOnStatusCode: false,
    })
    if (res.ok()) ids.creditProductSlug = (await res.json())?.docs?.[0]?.slug ?? null
  } catch {
    /* ignore */
  }
  return ids
}

function readProbes(modelId) {
  const probes = [
    ['auth.me', 'GET', '/account/auth/me'],
    ['account.dashboard', 'GET', '/account/dashboard'],
    ['account.profile', 'GET', '/account/profile'],
    ['account.favorites', 'GET', '/account/favorites'],
    ['account.follows', 'GET', '/account/follows'],
    ['account.notifications', 'GET', '/account/notifications'],
    ['account.notifications.unread', 'GET', '/account/notifications/unread-count'],
    ['billing.plans', 'GET', '/billing/subscriptions/plans'],
    ['commerce.creditProducts', 'GET', '/credit-products?limit=30&depth=0'],
    ['ops.dashboard(staff-only)', 'GET', '/platform/ops/dashboard'],
  ]
  if (modelId) {
    probes.push(
      ['model.detail', 'GET', `/social/models/${modelId}/detail`],
      ['model.related', 'GET', `/platform/models/${modelId}/related`],
      ['model.reactions', 'GET', `/social/models/${modelId}/reactions`],
      ['model.viewer', 'GET', `/platform/models/${modelId}/viewer?format=glb`, { maxRedirects: 0 }],
    )
  }
  return probes
}

function mutationProbes(modelId, creditProductSlug) {
  const probes = [
    ['billing.subCheckout', 'POST', '/billing/subscriptions/checkout', { data: { billingCycle: 'monthly', planKey: 'pro' } }],
  ]
  if (creditProductSlug) {
    probes.push(['billing.creditCheckout', 'POST', '/billing/credits/checkout', { data: { productSlug: creditProductSlug } }])
  }
  if (modelId) {
    probes.push(
      ['model.download', 'GET', `/platform/models/${modelId}/download?format=glb`, { maxRedirects: 0 }],
      ['model.favorite', 'POST', `/social/models/${modelId}/favorite`],
      ['model.unfavorite', 'DELETE', `/social/models/${modelId}/favorite`],
    )
  }
  return probes
}

async function runApiProbes(ctx, state, report, { creditProductSlug, modelId }) {
  const probes = [...readProbes(modelId)]
  if (state === 'auth' && MUTATE) probes.push(...mutationProbes(modelId, creditProductSlug))

  for (const [name, method, p, opts = {}] of probes) {
    const headers = { ...MUTATION_HEADERS }
    const reqOpts = { failOnStatusCode: false, headers, method }
    if (opts.maxRedirects !== undefined) reqOpts.maxRedirects = opts.maxRedirects
    if (opts.data) {
      reqOpts.data = opts.data
      headers['content-type'] = 'application/json'
    }
    try {
      const res = await ctx.request.fetch(`${API}${p}`, reqOpts)
      const body = (await res.text().catch(() => '')).replace(/\s+/g, ' ').slice(0, 180)
      report.api.push({ body, method, mutation: Boolean(opts.data) || method !== 'GET', name, ok: res.ok(), path: p, state, status: res.status() })
      console.log(`[api ${state}] ${method} ${p} -> ${res.status()}`)
    } catch (error) {
      report.api.push({ error: String(error).slice(0, 150), method, name, path: p, state })
    }
  }
}

// ---------- pass orchestration ----------

async function runPass(browser, state, report, ids) {
  // Sandboxed egress may terminate TLS with a proxy CA that the bundled Chromium
  // does not trust; ignore cert errors so pages actually load.
  const ctx = await browser.newContext({
    ignoreHTTPSErrors: true,
    userAgent: UA,
    viewport: { height: 900, width: 1440 },
  })

  if (state === 'auth') {
    if (!EMAIL || !PASSWORD) {
      report.login = { ok: false, skipped: true }
      console.log('[login] skipped (set AUDIT_EMAIL/AUDIT_PASSWORD to authenticate)')
    } else {
      try {
        const resp = await ctx.request.post(`${API}/account/auth/login`, {
          data: { email: EMAIL, password: PASSWORD },
          headers: { 'content-type': 'application/json', ...MUTATION_HEADERS },
        })
        report.login = { ok: resp.ok(), status: resp.status(), body: (await resp.text()).slice(0, 300) }
      } catch (error) {
        report.login = { error: error instanceof Error ? error.message : String(error), ok: false }
      }
      console.log(`[login] status=${report.login.status} ok=${report.login.ok}`)
      if (!report.login.ok) console.warn('[login] failed — auth pass reflects a logged-out session.')
    }
  }

  await runApiProbes(ctx, state, report, ids)

  const page = await ctx.newPage()
  for (const [vpName, w, h] of viewports) {
    await page.setViewportSize({ height: h, width: w })
    for (const [name, route] of allRoutes) {
      const entry = await auditPage(page, { name, route, state, viewport: vpName })
      report.pages.push(entry)
      console.log(
        `[${state}/${vpName}] ${route} -> ${entry.status} overflow:${entry.overflow.length} err:${entry.errors.length} failedReq:${entry.failed.length}`,
      )
    }
  }
  await ctx.close()
}

async function main() {
  await mkdir(OUT, { recursive: true })
  const browser = await chromium.launch({ executablePath: resolveExecutablePath(), headless: true })
  const report = { api: [], base: BASE, generatedAt: new Date().toISOString(), login: {}, mutations: MUTATE, pages: [], states }

  try {
    const probeCtx = await browser.newContext({ ignoreHTTPSErrors: true, userAgent: UA })
    report.discovered = await discoverIds(probeCtx)
    await probeCtx.close()
    console.log(`[discover] modelId=${report.discovered.modelId} creditProductSlug=${report.discovered.creditProductSlug}`)

    for (const state of states) {
      await runPass(browser, state, report, report.discovered)
    }
  } finally {
    await browser.close()
  }

  await writeFile(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2))

  const problems = report.pages.filter(
    (p) => (p.status && p.status >= 400) || p.overflow.length || p.errors.length || p.failed.length,
  )
  const lines = [
    `# Live UI + functional audit — ${report.base}`,
    ``,
    `Generated: ${report.generatedAt}`,
    `States: ${states.join(', ')} | Login: status=${report.login.status} ok=${report.login.ok} | Mutations: ${MUTATE}`,
    `Discovered: modelId=${report.discovered?.modelId} creditProductSlug=${report.discovered?.creditProductSlug}`,
    `UI pages checked: ${report.pages.length} (with findings: ${problems.length}) | API probes: ${report.api.length}`,
    ``,
    `## Functional API probes`,
    ``,
    `| state | name | method | path | status |`,
    `| --- | --- | --- | --- | --- |`,
    ...report.api.map((a) => `| ${a.state} | ${a.name} | ${a.method} | ${a.path} | ${a.status ?? a.error} |`),
    ``,
    `## UI findings`,
    ``,
  ]
  for (const p of problems) {
    lines.push(`### [${p.state}] ${p.viewport} ${p.route} (HTTP ${p.status})`)
    if (p.finalURL && p.finalURL !== `${report.base}${p.route}`) lines.push(`- Redirected to: ${p.finalURL}`)
    if (p.overflow.length) lines.push(`- Horizontal overflow: ${JSON.stringify(p.overflow)}`)
    if (p.errors.length) lines.push(`- Console/page errors: ${JSON.stringify(p.errors.slice(0, 5))}`)
    if (p.failed.length) lines.push(`- Failed requests: ${JSON.stringify(p.failed.slice(0, 5))}`)
    lines.push('')
  }
  if (problems.length === 0) lines.push('No HTTP errors, overflow, console errors, or failed requests detected in the UI pass.')
  await writeFile(path.join(OUT, 'report.md'), lines.join('\n'))

  console.log(`\n[done] screenshots + report.json + report.md in ${OUT}`)
  console.log(`[done] UI findings: ${problems.length}/${report.pages.length} | API probes: ${report.api.length}`)
}

await main()
