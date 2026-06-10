import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'

const rootDir = process.cwd()
const routeDir = path.join(rootDir, 'src', 'app', '(frontend)', 'assets-preview')
const pagePath = path.join(routeDir, 'page.tsx')
const clientPath = path.join(routeDir, 'AssetsPreviewClient.tsx')
const dataPath = path.join(routeDir, 'assetsPreviewData.ts')
const cssPath = path.join(routeDir, 'page.module.css')

test('assets preview route is UI-only and uses the asset-center frame', () => {
  for (const filePath of [pagePath, clientPath, dataPath, cssPath]) {
    assert.equal(existsSync(filePath), true, `${path.basename(filePath)} should exist`)
  }

  const pageSource = readFileSync(pagePath, 'utf8')
  const clientSource = readFileSync(clientPath, 'utf8')
  const dataSource = readFileSync(dataPath, 'utf8')
  const cssSource = readFileSync(cssPath, 'utf8')

  assert.match(pageSource, /AssetsPreviewClient/)
  assert.match(clientSource, /BorderComboFrame2/)
  assert.match(clientSource, /assetsPanel/)
  assert.match(cssSource, /\.assetsPanel/)
  assert.match(cssSource, /inset:\s*0\s+0\s+42px\s+0/)
  assert.match(cssSource, /--assets-profile-height/)
  assert.match(cssSource, /--assets-grid-top/)
  assert.match(clientSource, /My Assets/)
  assert.match(clientSource, /My Collections/)
  assert.match(clientSource, /My Follows/)
  assert.match(clientSource, /Creator Assets/)
  assert.match(clientSource, /Hide Current Model/)
  assert.match(clientSource, /Delete Current Model/)
  assert.match(clientSource, /setModels/)
  assert.match(dataSource, /visibility:\s*'public'/)
  assert.match(dataSource, /visibility:\s*'private'/)
  assert.doesNotMatch(clientSource, /\/api\/account\/models/)
  assert.doesNotMatch(clientSource, /\/api\/social\/models/)
  assert.doesNotMatch(clientSource, /\/api\/creators/)
})

test('assets preview route keeps production assets route untouched', () => {
  const productionAssetsRoute = path.join(rootDir, 'src', 'app', '(frontend)', 'assets', 'page.tsx')

  assert.equal(existsSync(productionAssetsRoute), false)
})
