import { existsSync } from 'node:fs'
import { chromium } from 'playwright'

const baseURL = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://127.0.0.1:3000'
const smokeModelId = Number(process.env.SMOKE_MODEL_ID || 20)
const browserTimeoutMs = Number(process.env.SMOKE_BROWSER_TIMEOUT_MS || 60_000)
const edgeExecutablePaths = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
]
const browserLaunchArgs = [
  '--use-angle=swiftshader',
  '--enable-webgl',
  '--ignore-gpu-blocklist',
  '--disable-dev-shm-usage',
  '--no-sandbox',
]

const checks = [
  { path: '/', expected: [200] },
  { path: '/login', expected: [200, 307, 308] },
  { path: '/register', expected: [200, 307, 308] },
  { path: '/generate', expected: [200, 307, 308] },
  { path: '/pricing', expected: [200] },
  { path: '/showcase', expected: [200] },
  { path: '/api/users/me', expected: [200, 401] },
]

function getInstalledEdgePath() {
  return edgeExecutablePaths.find((candidate) => existsSync(candidate)) || null
}

async function launchSmokeBrowser() {
  const launchOptions = {
    args: browserLaunchArgs,
    headless: true,
  }

  try {
    return await chromium.launch(launchOptions)
  } catch (error) {
    const edgePath = getInstalledEdgePath()
    if (!edgePath) {
      throw error
    }

    console.warn(`Bundled Playwright Chromium is unavailable; using installed Edge at ${edgePath}.`)
    return chromium.launch({
      ...launchOptions,
      executablePath: edgePath,
    })
  }
}

function visibleViewerState() {
  const isVisible = (element) => {
    const rect = element.getBoundingClientRect()
    const style = window.getComputedStyle(element)
    return (
      rect.width > 0 &&
      rect.height > 0 &&
      style.display !== 'none' &&
      style.visibility !== 'hidden'
    )
  }

  return {
    canvasCount: [...document.querySelectorAll('canvas')].filter(isVisible).length,
    errorVisible: [...document.querySelectorAll('.model-viewer-error-overlay')].some(isVisible),
    loadingVisible: [...document.querySelectorAll('.model-viewer-loading-overlay')].some(isVisible),
  }
}

async function runBrowserSmokeChecks() {
  const browser = await launchSmokeBrowser()
  const results = []

  try {
    const previewPage = await browser.newPage({
      viewport: { width: 1366, height: 768 },
    })
    await previewPage.goto(`${baseURL}/model-detail?id=${encodeURIComponent(String(smokeModelId))}`, {
      timeout: browserTimeoutMs,
      waitUntil: 'domcontentloaded',
    })
    const startedAt = Date.now()
    let observedLoading = false
    let previewState = await previewPage.evaluate(visibleViewerState)

    while (Date.now() - startedAt < browserTimeoutMs) {
      await previewPage.waitForTimeout(1000)
      previewState = await previewPage.evaluate(visibleViewerState)

      if (previewState.loadingVisible) {
        observedLoading = true
      }

      if (previewState.errorVisible) {
        break
      }

      if (
        previewState.canvasCount === 1 &&
        !previewState.loadingVisible &&
        (observedLoading || Date.now() - startedAt > 8000)
      ) {
        break
      }
    }

    results.push({
      details: previewState,
      name: 'anonymous model preview renders',
      ok:
        previewState.canvasCount === 1 &&
        !previewState.errorVisible &&
        !previewState.loadingVisible,
    })
    await previewPage.close()

    const workbenchPage = await browser.newPage({
      viewport: { width: 1366, height: 768 },
    })
    const generationRequests = []
    workbenchPage.on('request', (request) => {
      const url = request.url()
      const method = request.method()
      if (
        method === 'POST' &&
        (url.includes('/api/studio/ai/tasks') ||
          url.includes('/api/studio/ai/images'))
      ) {
        generationRequests.push(url)
      }
    })
    await workbenchPage.goto(`${baseURL}/workbench`, {
      timeout: browserTimeoutMs,
      waitUntil: 'domcontentloaded',
    })
    await workbenchPage.getByRole('button', { name: /generate/i }).first().click({
      timeout: browserTimeoutMs,
    })
    const dialog = workbenchPage.getByRole('dialog')
    await dialog.waitFor({ state: 'visible', timeout: browserTimeoutMs })
    const signInVisible = await dialog.getByText('Sign In', { exact: true }).first().isVisible()
    results.push({
      details: {
        generationRequestCount: generationRequests.length,
        signInVisible,
      },
      name: 'anonymous workbench generate opens login gate',
      ok: signInVisible && generationRequests.length === 0,
    })
    await workbenchPage.close()
  } finally {
    await browser.close()
  }

  return results
}

async function main() {
  const results = []

  for (const check of checks) {
    const url = `${baseURL}${check.path}`
    const response = await fetch(url, { redirect: 'manual' })

    results.push({
      expected: check.expected,
      ok: check.expected.includes(response.status),
      path: check.path,
      status: response.status,
    })
  }

  const browserResults = await runBrowserSmokeChecks()
  const failed = results.filter((item) => !item.ok)
  const failedBrowser = browserResults.filter((item) => !item.ok)

  console.log(JSON.stringify({ baseURL, browserResults, failed, failedBrowser, results }, null, 2))

  if (failed.length > 0 || failedBrowser.length > 0) {
    process.exit(1)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
