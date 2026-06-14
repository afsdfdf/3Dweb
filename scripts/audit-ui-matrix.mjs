import { mkdir } from 'node:fs/promises'
import path from 'node:path'

import { chromium } from 'playwright'

const baseURL = process.env.AUDIT_BASE_URL || 'http://127.0.0.1:3000'
const outputDir =
  process.env.AUDIT_OUTPUT_DIR || path.join(process.cwd(), 'tmp', 'audit-ui-matrix')
const navigationTimeoutMs = Number(process.env.AUDIT_NAVIGATION_TIMEOUT_MS || 30_000)
const networkIdleTimeoutMs = Number(process.env.AUDIT_NETWORK_IDLE_TIMEOUT_MS || 1_500)
const stableWaitMs = Number(process.env.AUDIT_STABLE_WAIT_MS || 500)

const allViewports = [
  { height: 844, name: 'mobile-390', width: 390 },
  { height: 1180, name: 'tablet-820', width: 820 },
  { height: 768, name: 'desktop-1366', width: 1366 },
  { height: 1080, name: 'desktop-1920', width: 1920 },
  { height: 1080, name: 'ultrawide-2560x1080', width: 2560 },
  { height: 1440, name: 'ultrawide-3440x1440', width: 3440 },
]

const allRoutes = [
  { name: 'home', path: '/' },
  { name: 'workbench', path: '/workbench' },
  { name: 'model-detail', path: process.env.AUDIT_MODEL_DETAIL_PATH || '/model-detail?id=1' },
  { name: 'assets', path: '/assets' },
  { name: 'showcase', path: '/showcase' },
  { name: 'blog', path: '/blog' },
  { name: 'about', path: '/about' },
]

function filterByName(items, rawFilter, label) {
  if (!rawFilter) return items

  const names = new Set(
    rawFilter
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
  )
  const selected = items.filter((item) => names.has(item.name))

  if (selected.length === 0) {
    throw new Error(`AUDIT_${label} did not match any known ${label.toLowerCase()}: ${rawFilter}`)
  }

  return selected
}

const viewports = filterByName(allViewports, process.env.AUDIT_VIEWPORTS, 'VIEWPORTS')
const routes = filterByName(allRoutes, process.env.AUDIT_ROUTES, 'ROUTES')

function toAbsoluteURL(routePath) {
  return new URL(routePath, baseURL).toString()
}

function safeFilename(value) {
  return value.replace(/[^a-z0-9_-]+/gi, '-').replace(/^-|-$/g, '').toLowerCase()
}

const browser = await chromium.launch({ headless: true })
const failures = []

try {
  await mkdir(outputDir, { recursive: true })
  console.log(
    `[ui-matrix] auditing ${routes.length} route(s) across ${viewports.length} viewport(s) from ${baseURL}`,
  )

  for (const viewport of viewports) {
    const context = await browser.newContext({
      deviceScaleFactor: 1,
      viewport: {
        height: viewport.height,
        width: viewport.width,
      },
    })
    const page = await context.newPage()
    const runtimeErrors = []

    page.on('console', (message) => {
      if (message.type() === 'error') {
        runtimeErrors.push(message.text())
      }
    })
    page.on('pageerror', (error) => {
      runtimeErrors.push(error.message)
    })

    for (const route of routes) {
      const url = toAbsoluteURL(route.path)
      const screenshotPath = path.join(outputDir, `${viewport.name}-${safeFilename(route.name)}.png`)
      const beforeErrorCount = runtimeErrors.length

      try {
        const response = await page.goto(url, {
          timeout: navigationTimeoutMs,
          waitUntil: 'domcontentloaded',
        })
        await page.waitForLoadState('networkidle', { timeout: networkIdleTimeoutMs }).catch(() => null)
        await page.waitForTimeout(stableWaitMs)

        await page.screenshot({
          fullPage: true,
          path: screenshotPath,
        })

        const metrics = await page.evaluate(() => {
          const documentElement = document.documentElement
          const overflowOffenders = Array.from(document.querySelectorAll('body *'))
            .filter((element) => {
              const rect = element.getBoundingClientRect()
              return rect.right > window.innerWidth + 2 || rect.left < -2
            })
            .slice(0, 10)
            .map((element) => {
              const rect = element.getBoundingClientRect()
              return {
                className:
                  typeof element.className === 'string'
                    ? element.className
                    : String(element.getAttribute('class') || ''),
                left: Math.round(rect.left),
                right: Math.round(rect.right),
                tagName: element.tagName.toLowerCase(),
              }
            })

          return {
            clientWidth: documentElement.clientWidth,
            overflowOffenders,
            scrollWidth: documentElement.scrollWidth,
          }
        })

        if (response && response.status() >= 500) {
          failures.push(`${viewport.name} ${route.path}: HTTP ${response.status()}`)
        }

        if (metrics.scrollWidth > metrics.clientWidth + 2) {
          failures.push(
            `${viewport.name} ${route.path}: horizontal overflow ${metrics.scrollWidth}/${metrics.clientWidth} ${JSON.stringify(
              metrics.overflowOffenders,
            )}`,
          )
        }

        const routeErrors = runtimeErrors.slice(beforeErrorCount)
        if (routeErrors.length > 0) {
          failures.push(`${viewport.name} ${route.path}: console/page errors ${JSON.stringify(routeErrors.slice(0, 5))}`)
        }

        console.log(`[ui-matrix] ${viewport.name} ${route.path} -> ${screenshotPath}`)
      } catch (error) {
        failures.push(`${viewport.name} ${route.path}: ${error instanceof Error ? error.message : String(error)}`)
      }
    }

    await context.close()
  }
} finally {
  await browser.close()
}

if (failures.length > 0) {
  console.error('[ui-matrix] failures:')
  for (const failure of failures) {
    console.error(`- ${failure}`)
  }
  process.exit(1)
}

console.log(`[ui-matrix] completed without failures. Screenshots: ${outputDir}`)
