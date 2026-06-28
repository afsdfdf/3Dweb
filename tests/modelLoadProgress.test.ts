import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'

import { getModelLoadPhaseDisplay } from '../src/lib/modelLoadProgress.ts'

const rootDir = process.cwd()
const modelViewerPath = path.join(rootDir, 'src', 'app', '(frontend)', '_components', 'ModelViewer.tsx')
const modelDetailNativePath = path.join(rootDir, 'src', 'app', '(frontend)', 'model-detail', 'ModelDetailNative.tsx')
const modelDetailPageCssPath = path.join(rootDir, 'src', 'app', '(frontend)', 'model-detail', 'page.module.css')
const workbenchClientPath = path.join(rootDir, 'src', 'app', '(frontend)', 'workbench', 'WorkbenchClient.tsx')
const workbenchModelViewerPath = path.join(rootDir, 'src', 'app', '(frontend)', 'workbench', '_components', 'WorkbenchModelViewer.tsx')
const workbenchLoadingFramePath = path.join(rootDir, 'public', 'ui-lab', 'workbench', 'model-loading-frame-2x.png')

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

test('ModelViewer shows completion for uncached loads but skips progress for cached assets', () => {
  const source = readFileSync(modelViewerPath, 'utf8')

  assert.match(source, /status: "complete" \| "error" \| "idle" \| "loading" \| "ready"/)
  assert.match(source, /status !== "loading" && status !== "complete"/)
  assert.match(source, /phase: "ready",\s*progress: 100,\s*status: "complete"/)
  assert.match(source, /window\.setTimeout\(\(\) => \{/)
  assert.match(source, /status: "ready"/)
  assert.match(source, /const cached = getCachedModelAsset\(modelSrc\);[\s\S]*?phase: "ready",[\s\S]*?progress: 100,[\s\S]*?status: "ready"/)
  assert.match(source, /const diskCachedBlob = await getDiskCachedModelAssetBlob\(modelSrc\);[\s\S]*?phase: "ready",[\s\S]*?progress: 100,[\s\S]*?status: "ready"/)
  assert.equal(
    source.indexOf('phase: "cache"') > source.indexOf('const diskCachedBlob = await getDiskCachedModelAssetBlob(modelSrc);'),
    true,
  )
})

test('Workbench model viewers do not render the display base', () => {
  const workbenchSource = readFileSync(workbenchClientPath, 'utf8')

  assert.doesNotMatch(workbenchSource, /displayBase="workbench"/)
  assert.match(workbenchSource, /showGround=\{false\}/)
})

test('ModelViewer loading overlay uses the target framed model-preview style', () => {
  const modelViewerSource = readFileSync(modelViewerPath, 'utf8')
  const modelDetailPageCssSource = readFileSync(modelDetailPageCssPath, 'utf8')
  const workbenchSource = readFileSync(workbenchClientPath, 'utf8')
  const workbenchModelViewerSource = readFileSync(workbenchModelViewerPath, 'utf8')

  assert.equal(existsSync(workbenchLoadingFramePath), true)
  assert.doesNotMatch(modelViewerSource, /import \{ createPortal \} from "react-dom"/)
  assert.match(modelViewerSource, /loadingOverlayVariant\?: "default" \| "workbench"/)
  assert.match(modelViewerSource, /modelLoadingOverlayTargetFrame/)
  assert.match(modelViewerSource, /absolute left-1\/2/)
  assert.doesNotMatch(modelViewerSource, /pointer-events-none fixed/)
  assert.match(modelViewerSource, /width: "min\(460px, calc\(100% - 48px\)\)"/)
  assert.match(modelViewerSource, /left: "50%"/)
  assert.match(modelViewerSource, /bottom: "32px"/)
  assert.match(modelViewerSource, /borderImageSource:\s*'url\("\/ui-lab\/workbench\/model-loading-frame-2x\.png"\)'/)
  assert.match(modelViewerSource, /borderImageSlice: "50"/)
  assert.match(modelViewerSource, /borderImageWidth: "25px"/)
  assert.match(modelViewerSource, /borderImageOutset: "0"/)
  assert.match(modelViewerSource, /borderImageRepeat: "stretch"/)
  assert.doesNotMatch(modelViewerSource, /setLoadingOverlayPortalRoot\(document\.body\)/)
  assert.doesNotMatch(modelViewerSource, /createPortal\(overlay, loadingOverlayPortalRoot\)/)
  assert.doesNotMatch(modelDetailPageCssSource, /detail-model-viewer \.model-viewer-loading-overlay/)
  assert.doesNotMatch(modelViewerSource, /Checking Cache/)
  assert.match(modelViewerSource, /\? "Load Model" : "Load Model"/)
  assert.match(modelViewerSource, /variant={loadingOverlayVariant}/)
  assert.match(workbenchSource, /className={styles\.mobileViewer}[\s\S]*?loadingOverlayVariant="workbench"/)
  assert.match(workbenchSource, /className={styles\.viewerCanvas}[\s\S]*?loadingOverlayVariant="workbench"/)
  assert.match(workbenchSource, /loadingOverlayVariant="workbench"/)
  assert.match(workbenchModelViewerSource, /loadingOverlayVariant="workbench"/)
  assert.match(workbenchModelViewerSource, /<DynamicModelViewer loadingOverlayVariant="workbench" \{\.\.\.props\} \/>/)
})

test('model detail mounts the viewer only for the active responsive branch', () => {
  const source = readFileSync(modelDetailNativePath, 'utf8')

  assert.match(source, /mobileViewportMediaQuery = "\(max-width: 980px\)"/)
  assert.match(source, /shouldRenderMobileViewer = isMobileViewport === true/)
  assert.match(source, /shouldRenderDesktopViewer = isMobileViewport === false/)
  assert.match(source, /activeModel\.viewerURL && shouldRenderMobileViewer/)
  assert.match(
    source,
    /activeModel\.viewerURL &&\s*shouldRenderDesktopViewer/s,
  )
})
