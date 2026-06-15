/**
 * Live UI/functional audit against the deployed site.
 *
 * Run from a session/environment that has network egress to the site
 * (Network access = Custom with *.thornstavern.com, or Full):
 *
 *   pnpm install   # if node_modules is missing
 *   AUDIT_BASE_URL=https://www.thornstavern.com \
 *   AUDIT_EMAIL=a77694688@qq.com \
 *   AUDIT_PASSWORD=changcheng \
 *   node scripts/live-ui-audit.mjs
 *
 * It captures BOTH states so the guest and signed-in experiences can be compared:
 *   - guest pass: a fresh context with no login (anonymous visitor)
 *   - auth pass:  a context logged in via the account API
 *
 * Output (tmp/live-audit): <state>-<viewport>-<route>.png screenshots, report.json,
 * report.md. Each page records HTTP status, console/page errors, failed requests
 * and horizontal overflow. Falls back to the sandbox chromium under /opt/pw-browsers.
 *
 * Env knobs: AUDIT_STATES=guest,auth (limit which passes run),
 * AUDIT_VIEWPORTS=mobile-390,... AUDIT_CHROMIUM_PATH=...
 */

import { mkdir, writeFile } from 'node:fs/promises'
import { existsSync, readdirSync } from 'node:fs'
import path from 'node:path'

import { chromium } from 'playwright'

const BASE = (process.env.AUDIT_BASE_URL || 'https://www.thornstavern.com').replace(/\/$/, '')
const EMAIL = process.env.AUDIT_EMAIL || 'a77694688@qq.com'
const PASSWORD = process.env.AUDIT_PASSWORD || 'changcheng'
const OUT = process.env.AUDIT_OUTPUT_DIR || path.join(process.cwd(), 'tmp', 'live-audit')

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

// In the managed sandbox the browser ships under /opt/pw-browsers; fall back to it
// when Playwright's own download is missing.
function resolveExecutablePath() {
  if (process.env.AUDIT_CHROMIUM_PATH) return process.env.AUDIT_CHROMIUM_PATH
  const root = '/opt/pw-browsers'
  if (!existsSync(root)) return undefined
  const dir = readdirSync(root).find((name) => name.startsWith('chromium-') && !name.includes('headless'))
  if (!dir) return undefined
  const candidate = path.join(root, dir, 'chrome-linux', 'chrome')
  return existsSync(candidate) ? candidate : undefined
}

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

async function runPass(browser, state, report) {
  // Sandboxed egress may terminate TLS with a proxy CA that the bundled Chromium
  // does not trust; ignore cert errors so pages actually load.
  const ctx = await browser.newContext({
    ignoreHTTPSErrors: true,
    userAgent: UA,
    viewport: { height: 900, width: 1440 },
  })

  if (state === 'auth') {
    try {
      const resp = await ctx.request.post(`${BASE}/api/account/auth/login`, {
        data: { email: EMAIL, password: PASSWORD },
        headers: { 'content-type': 'application/json', origin: BASE, referer: `${BASE}/` },
      })
      report.login = { ok: resp.ok(), status: resp.status(), body: (await resp.text()).slice(0, 300) }
    } catch (error) {
      report.login = { error: error instanceof Error ? error.message : String(error), ok: false }
    }
    console.log(`[login] status=${report.login.status} ok=${report.login.ok}`)
    if (!report.login.ok) {
      console.warn('[login] failed — auth pass will reflect a logged-out session.')
    }
  }

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
  const report = { base: BASE, generatedAt: new Date().toISOString(), login: {}, pages: [], states }

  try {
    for (const state of states) {
      await runPass(browser, state, report)
    }
  } finally {
    await browser.close()
  }

  await writeFile(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2))

  const problems = report.pages.filter(
    (p) => (p.status && p.status >= 400) || p.overflow.length || p.errors.length || p.failed.length,
  )
  const lines = [
    `# Live UI audit — ${report.base}`,
    ``,
    `Generated: ${report.generatedAt}`,
    `States: ${states.join(', ')} | Login: status=${report.login.status} ok=${report.login.ok}`,
    `Pages checked: ${report.pages.length} | with findings: ${problems.length}`,
    ``,
    `## Findings`,
  ]
  for (const p of problems) {
    lines.push(`### [${p.state}] ${p.viewport} ${p.route} (HTTP ${p.status})`)
    if (p.finalURL && p.finalURL !== `${report.base}${p.route}`) lines.push(`- Redirected to: ${p.finalURL}`)
    if (p.overflow.length) lines.push(`- Horizontal overflow: ${JSON.stringify(p.overflow)}`)
    if (p.errors.length) lines.push(`- Console/page errors: ${JSON.stringify(p.errors.slice(0, 5))}`)
    if (p.failed.length) lines.push(`- Failed requests: ${JSON.stringify(p.failed.slice(0, 5))}`)
    lines.push('')
  }
  if (problems.length === 0) lines.push('No HTTP errors, overflow, console errors, or failed requests detected.')
  await writeFile(path.join(OUT, 'report.md'), lines.join('\n'))

  console.log(`\n[done] screenshots + report.json + report.md in ${OUT}`)
  console.log(`[done] pages with findings: ${problems.length}/${report.pages.length}`)
}

await main()
