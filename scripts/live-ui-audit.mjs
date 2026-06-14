/**
 * Live UI/functional audit against the deployed site.
 *
 * Run this from a session/environment that has network egress to the site
 * (Network access = Custom with *.thornstavern.com, or Full):
 *
 *   pnpm install   # if node_modules is missing
 *   AUDIT_BASE_URL=https://www.thornstavern.com \
 *   AUDIT_EMAIL=a77694688@qq.com \
 *   AUDIT_PASSWORD=changcheng \
 *   node scripts/live-ui-audit.mjs
 *
 * Output: tmp/live-audit/<viewport>-<route>.png screenshots, report.json, report.md.
 * The script logs in via the account API (so authed pages render), then walks
 * every route across 4 viewports collecting console errors, failed requests and
 * horizontal overflow.
 */

import { mkdir, writeFile } from 'node:fs/promises'
import { existsSync, readdirSync } from 'node:fs'
import path from 'node:path'

import { chromium } from 'playwright'

const BASE = (process.env.AUDIT_BASE_URL || 'https://www.thornstavern.com').replace(/\/$/, '')
const EMAIL = process.env.AUDIT_EMAIL || 'a77694688@qq.com'
const PASSWORD = process.env.AUDIT_PASSWORD || 'changcheng'
const OUT = process.env.AUDIT_OUTPUT_DIR || path.join(process.cwd(), 'tmp', 'live-audit')

const routes = [
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

const viewports = [
  ['desktop-1920', 1920, 1080],
  ['laptop-1366', 1366, 768],
  ['tablet-820', 820, 1180],
  ['mobile-390', 390, 844],
]

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

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36'

async function main() {
  await mkdir(OUT, { recursive: true })
  const executablePath = resolveExecutablePath()
  const browser = await chromium.launch({ executablePath, headless: true })
  const report = { base: BASE, generatedAt: new Date().toISOString(), login: {}, pages: [] }

  try {
    const ctx = await browser.newContext({ userAgent: UA, viewport: { height: 900, width: 1440 } })

    // Authenticate so authed routes (/account, /workbench) render real content.
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

    const page = await ctx.newPage()

    for (const [vpName, w, h] of viewports) {
      await page.setViewportSize({ height: h, width: w })

      for (const [name, route] of routes) {
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
        try {
          const resp = await page.goto(`${BASE}${route}`, { timeout: 40_000, waitUntil: 'domcontentloaded' })
          status = resp?.status() ?? null
          await page.waitForLoadState('networkidle', { timeout: 4_000 }).catch(() => {})
          await page.waitForTimeout(800)
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

        const file = path.join(OUT, `${vpName}-${name}.png`)
        await page.screenshot({ fullPage: false, path: file }).catch(() => {})

        page.off('console', onConsole)
        page.off('pageerror', onPageError)
        page.off('requestfailed', onRequestFailed)

        const overflow = metrics.scrollW > metrics.clientW + 2 ? metrics.offenders : []
        const entry = { errors, failed, name, overflow, route, scrollW: metrics.scrollW, status, viewport: vpName }
        report.pages.push(entry)
        console.log(
          `[${vpName}] ${route} -> ${status} overflow:${overflow.length} err:${errors.length} failedReq:${failed.length}`,
        )
      }
    }
  } finally {
    await browser.close()
  }

  await writeFile(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2))

  // Markdown summary of only the pages that have something worth looking at.
  const problems = report.pages.filter(
    (p) => (p.status && p.status >= 400) || p.overflow.length || p.errors.length || p.failed.length,
  )
  const lines = [
    `# Live UI audit — ${report.base}`,
    ``,
    `Generated: ${report.generatedAt}`,
    `Login: status=${report.login.status} ok=${report.login.ok}`,
    `Pages checked: ${report.pages.length} | with findings: ${problems.length}`,
    ``,
    `## Findings`,
  ]
  for (const p of problems) {
    lines.push(`### ${p.viewport} ${p.route} (HTTP ${p.status})`)
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
