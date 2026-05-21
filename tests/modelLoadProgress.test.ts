import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'

import { getModelLoadPhaseDisplay } from '../src/lib/modelLoadProgress.ts'

const rootDir = process.cwd()
const modelViewerPath = path.join(rootDir, 'src', 'app', '(frontend)', '_components', 'ModelViewer.tsx')
const modelDetailNativePath = path.join(rootDir, 'src', 'app', '(frontend)', 'model-detail', 'ModelDetailNative.tsx')
const workbenchClientPath = path.join(rootDir, 'src', 'app', '(frontend)', 'workbench', 'WorkbenchClient.tsx')

test('model load progress keeps download below parse and ready phases', () => {
  const download = getModelLoadPhaseDisplay({ phase: 'download', progress: 76 })
  const cache = getModelLoadPhaseDisplay({ phase: 'cache', progress: 0 })
  const validate = getModelLoadPhaseDisplay({ phase: 'validate', progress: 20 })
  const decode = getModelLoadPhaseDisplay({ phase: 'decode', progress: 20 })
  const build = getModelLoadPhaseDisplay({ phase: 'build', progress: 20 })
  const parse = getModelLoadPhaseDisplay({ phase: 'parse', progress: 20 })
  const ready = getModelLoadPhaseDisplay({ phase: 'ready', progress: 100 })

  assert.equal(cache.stage, 'NETWORK')
  assert.equal(cache.progress, 0)
  assert.equal(download.stage, 'NETWORK')
  assert.equal(download.progress, 76)
  assert.equal(validate.stage, 'VERIFY')
  assert.equal(validate.progress, 80)
  assert.equal(decode.stage, 'DECODE')
  assert.equal(decode.progress, 85)
  assert.equal(build.stage, 'BUILD')
  assert.equal(build.progress, 94)
  assert.equal(parse.stage, 'DECODE')
  assert.equal(parse.progress, 92)
  assert.equal(ready.stage, 'READY')
  assert.equal(ready.progress, 100)
})

test('model load progress clamps non-terminal phases below complete', () => {
  const download = getModelLoadPhaseDisplay({ phase: 'download', progress: 120 })
  const validate = getModelLoadPhaseDisplay({ phase: 'validate', progress: 120 })
  const decode = getModelLoadPhaseDisplay({ phase: 'decode', progress: 120 })
  const build = getModelLoadPhaseDisplay({ phase: 'build', progress: 120 })
  const parse = getModelLoadPhaseDisplay({ phase: 'parse', progress: 120 })

  assert.equal(download.progress, 80)
  assert.equal(validate.progress, 85)
  assert.equal(decode.progress, 94)
  assert.equal(build.progress, 98)
  assert.equal(parse.progress, 98)
})

test('ModelViewer avoids mounting Canvas when WebGL is unavailable', () => {
  const source = readFileSync(modelViewerPath, 'utf8')

  assert.match(source, /type WebGLStatus = "available" \| "checking" \| "unavailable"/)
  assert.match(source, /function canCreateWebGLContext\(\)/)
  assert.match(source, /setWebGLStatus\(available \? "available" : "unavailable"\)/)
  assert.match(source, /webGLStatus === "available" \? \(/)
  assert.match(source, /webGLStatus === "unavailable"/)
})

test('ModelViewer refreshes the GLB fetch timeout when download progress continues', () => {
  const source = readFileSync(modelViewerPath, 'utf8')

  assert.match(source, /const refreshTimeout = \(\) => \{/)
  assert.match(source, /if \(!response\.ok \|\| !response\.body\)[\s\S]*?refreshTimeout\(\)/)
  assert.match(source, /receivedLength \+= value\.length;\s*refreshTimeout\(\);/)
})

test('Workbench model viewers do not render the display base', () => {
  const workbenchSource = readFileSync(workbenchClientPath, 'utf8')

  assert.doesNotMatch(workbenchSource, /displayBase="workbench"/)
  assert.match(workbenchSource, /showGround=\{false\}/)
})

test('model detail mounts the viewer only for the active responsive branch', () => {
  const source = readFileSync(modelDetailNativePath, 'utf8')

  assert.match(source, /mobileViewportMediaQuery = "\(max-width: 767px\)"/)
  assert.match(source, /shouldRenderMobileViewer = isMobileViewport === true/)
  assert.match(source, /shouldRenderDesktopViewer = isMobileViewport === false/)
  assert.match(source, /activeModel\.viewerURL && shouldRenderMobileViewer/)
  assert.match(
    source,
    /activeModel\.viewerURL &&\s*shouldRenderDesktopViewer/s,
  )
})
