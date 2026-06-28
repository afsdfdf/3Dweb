// Real-machine visual detection against a live deployment.
//
// Drives a real Chromium through Playwright: logs in via the homepage auth
// modal, then sweeps public and authenticated routes across several viewports.
// For each route/viewport it captures a full-page screenshot and records HTTP
// status, horizontal overflow offenders, and console/page errors.
//
// Required env:
//   LIVE_BASE_URL        e.g. https://www.thornstavern.com
//   LIVE_EMAIL           login email
//   LIVE_PASSWORD        login password
// Optional env:
//   LIVE_OUTPUT_DIR      screenshot/report output dir (default tmp/visual-detect-live)
//   LIVE_VIEWPORTS       comma-separated viewport names to include
//   LIVE_ROUTES          comma-separated route names to include
//   LIVE_NAV_TIMEOUT_MS  per-navigation timeout (default 45000)

import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { chromium } from 'playwright'

const baseURL = (process.env.LIVE_BASE_URL || 'https://www.thornstavern.com').replace(/\/$/, '')
const email = process.env.LIVE_EMAIL || ''
const password = process.env.LIVE_PASSWORD || ''
const outputDir =
  process.env.LIVE_OUTPUT_DIR || path.join(process.cwd(), 'tmp', 'visual-detect-live')
const navTimeoutMs = Number(process.env.LIVE_NAV_TIMEOUT_MS || 45_000)
const networkIdleTimeoutMs = Number(process.env.LIVE_NETWORK_IDLE_TIMEOUT_MS || 4_000)
const stableWaitMs = Number(process.env.LIVE_STABLE_WAIT_MS || 1_200)

if (!email || !password) {
  console.error('[visual] LIVE_EMAIL and LIVE_PASSWORD are required')
  process.exit(2)
}

const allViewports = [
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'tablet-820', width: 820, height: 1180 },
  { name: 'desktop-1366', width: 1366, height: 768 },
  { name: 'desktop-1920', width: 1920, height: 1080 },
]

// auth: 'public' renders for anyone; 'user' needs an authenticated session.
const allRoutes = [
  { name: 'home', path: '/', auth: 'public' },
  { name: 'showcase', path: '/showcase', auth: 'public' },
  { name: 'bundles', path: '/bundles', auth: 'public' },
  { name: 'pricing', path: '/pricing', auth: 'public' },
  { name: 'blog', path: '/blog', auth: 'public' },
  { name: 'about', path: '/about', auth: 'public' },
  { name: 'workbench', path: '/workbench', auth: 'user' },
  { name: 'workbench-history', path: '/workbench/history', auth: 'user' },
  { name: 'account', path: '/account', auth: 'user' },
]

function filterByName(items, raw, label) {
  if (!raw) return items
  const names = new Set(raw.split(',').map((s) => s.trim()).filter(Boolean))
  const picked = items.filter((i) => names.has(i.name))
  if (picked.length === 0) throw new Error(`LIVE_${label} matched nothing: ${raw}`)
  return picked
}

const viewports = filterByName(allViewports, process.env.LIVE_VIEWPORTS, 'VIEWPORTS')
const routes = filterByName(allRoutes, process.env.LIVE_ROUTES, 'ROUTES')

function abs(p) {
  return new URL(p, baseURL + '/').toString()
}
function safe(value) {
  return value.replace(/[^a-z0-9_-]+/gi, '-').replace(/^-|-$/g, '').toLowerCase()
}

async function settle(page) {
  await page.waitForLoadState('networkidle', { timeout: networkIdleTimeoutMs }).catch(() => null)
  await page.waitForTimeout(stableWaitMs)
}

async function collectMetrics(page) {
  return page.evaluate(() => {
    const de = document.documentElement
    const offenders = Array.from(document.querySelectorAll('body *'))
      .filter((el) => {
        const r = el.getBoundingClientRect()
        return r.right > window.innerWidth + 2 || r.left < -2
      })
      .slice(0, 8)
      .map((el) => {
        const r = el.getBoundingClientRect()
        return {
          tag: el.tagName.toLowerCase(),
          cls: typeof el.className === 'string' ? el.className.slice(0, 120) : '',
          left: Math.round(r.left),
          right: Math.round(r.right),
        }
      })
    return { clientWidth: de.clientWidth, scrollWidth: de.scrollWidth, offenders }
  })
}

async function login(context) {
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto(abs('/?auth=login'), { timeout: navTimeoutMs, waitUntil: 'domcontentloaded' })
  await settle(page)

  const emailInput = page.locator('input[type="email"]').first()
  await emailInput.waitFor({ state: 'visible', timeout: navTimeoutMs })
  await emailInput.fill(email)
  await page.locator('input[type="password"]').first().fill(password)

  // The login form requires the terms checkbox before submit is accepted.
  const terms = page.locator('input[type="checkbox"]').first()
  if (await terms.count()) {
    await terms.check({ force: true }).catch(() => null)
  }

  await Promise.all([
    page.waitForURL((url) => !/[?&]auth=login/.test(url.toString()), { timeout: navTimeoutMs }).catch(() => null),
    page.getByRole('button', { name: /sign in/i }).first().click(),
  ])
  await settle(page)

  // Verify session by hitting an authenticated route and checking we are not
  // bounced back to the login modal.
  await page.goto(abs('/account'), { timeout: navTimeoutMs, waitUntil: 'domcontentloaded' })
  await settle(page)
  const loggedIn = !/[?&]auth=login/.test(page.url())
  await page.close()
  return loggedIn
}

await mkdir(outputDir, { recursive: true })
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] })
const report = { baseURL, startedAt: new Date().toISOString(), loggedIn: false, results: [], failures: [] }

try {
  // One shared, authenticated context so cookies carry across the sweep.
  const context = await browser.newContext({ ignoreHTTPSErrors: true })
  report.loggedIn = await login(context)
  console.log(`[visual] login ${report.loggedIn ? 'OK' : 'FAILED'} for ${email}`)
  if (!report.loggedIn) {
    report.failures.push('login failed: authenticated routes will be skipped')
  }

  for (const viewport of viewports) {
    await context.clearCookies().catch(() => null) // no-op safety; cookies set during login persist via storageState below
    const page = await context.newPage()
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    const consoleErrors = []
    page.on('console', (m) => {
      if (m.type() === 'error') consoleErrors.push(m.text())
    })
    page.on('pageerror', (e) => consoleErrors.push(e.message))

    for (const route of routes) {
      if (route.auth === 'user' && !report.loggedIn) continue
      const before = consoleErrors.length
      const file = path.join(outputDir, `${viewport.name}-${safe(route.name)}.png`)
      const entry = { viewport: viewport.name, route: route.path, name: route.name, auth: route.auth }
      try {
        const resp = await page.goto(abs(route.path), { timeout: navTimeoutMs, waitUntil: 'domcontentloaded' })
        await settle(page)
        await page.screenshot({ path: file, fullPage: true })
        const m = await collectMetrics(page)
        entry.status = resp ? resp.status() : null
        entry.finalURL = page.url()
        entry.overflow = m.scrollWidth > m.clientWidth + 2
        entry.scrollWidth = m.scrollWidth
        entry.clientWidth = m.clientWidth
        entry.offenders = entry.overflow ? m.offenders : []
        entry.consoleErrors = consoleErrors.slice(before, before + 5)
        entry.screenshot = path.relative(process.cwd(), file)

        if (entry.status && entry.status >= 500) report.failures.push(`${viewport.name} ${route.path}: HTTP ${entry.status}`)
        if (entry.overflow) report.failures.push(`${viewport.name} ${route.path}: overflow ${m.scrollWidth}/${m.clientWidth}`)
        if (entry.consoleErrors.length) report.failures.push(`${viewport.name} ${route.path}: console ${JSON.stringify(entry.consoleErrors)}`)
        console.log(`[visual] ${viewport.name} ${route.path} -> HTTP ${entry.status} overflow=${entry.overflow} errs=${entry.consoleErrors.length}`)
      } catch (err) {
        entry.error = err instanceof Error ? err.message : String(err)
        report.failures.push(`${viewport.name} ${route.path}: ${entry.error}`)
        console.log(`[visual] ${viewport.name} ${route.path} -> ERROR ${entry.error}`)
      }
      report.results.push(entry)
    }
    await page.close()
  }
} finally {
  await browser.close()
}

report.finishedAt = new Date().toISOString()
await writeFile(path.join(outputDir, 'report.json'), JSON.stringify(report, null, 2))
console.log(`\n[visual] done. ${report.results.length} captures, ${report.failures.length} issue(s). Output: ${outputDir}`)
if (report.failures.length) {
  console.log('[visual] issues:')
  for (const f of report.failures) console.log(`  - ${f}`)
}
