import assert from 'node:assert/strict'
import { readFile, stat } from 'node:fs/promises'
import test from 'node:test'

const componentPath = 'src/components/ui-lab/small-button-pair/small-button-pair.tsx'
const cssPath = 'src/components/ui-lab/small-button-pair/small-button-pair.module.css'
const hoverAssetPath =
  'public/ui-lab/formal-components/assets/small-button-pair/button-purple-small-hover-bright@2x.png'

test('small segmented buttons show selected and hover image states without movement', async () => {
  const [componentSource, cssSource, hoverAsset] = await Promise.all([
    readFile(componentPath, 'utf8'),
    readFile(cssPath, 'utf8'),
    stat(hoverAssetPath),
  ])

  assert.match(
    componentSource,
    /const selectedButtonSrc = `\$\{assetBase\}\/button-dark-small-design\.png`/,
  )
  assert.match(
    componentSource,
    /const hoverButtonSrc = `\$\{assetBase\}\/button-purple-small-hover-bright@2x\.png`/,
  )
  assert.equal(hoverAsset.isFile(), true)
  assert.match(
    componentSource,
    /isPressed\s*\?\s*<img alt="" className=\{styles\.buttonImage\} src=\{selectedButtonSrc\} \/>\s*:\s*null/,
  )
  assert.match(
    componentSource,
    /isSelected\s*\?\s*<img alt="" className=\{styles\.buttonImage\} src=\{selectedButtonSrc\} \/>\s*:\s*null/,
  )
  assert.doesNotMatch(
    componentSource,
    /\{!isPressed\s*\?\s*<img/,
  )
  assert.match(
    componentSource,
    /<img alt="" className=\{\[styles\.buttonImage,\s*styles\.hoverImage\]\.join\(" "\)\} src=\{hoverButtonSrc\} \/>/,
  )
  assert.match(cssSource, /\.hoverImage\s*\{[\s\S]*opacity:\s*0/)
  assert.match(
    cssSource,
    /\.control:hover\s+\.hoverImage,\s*\.control:focus-visible\s+\.hoverImage,\s*\.tripleControl:hover\s+\.hoverImage,\s*\.tripleControl:focus-visible\s+\.hoverImage\s*\{[\s\S]*opacity:\s*1/,
  )
  assert.doesNotMatch(cssSource, /\.control:active\s*\{[\s\S]*transform:/)
  assert.doesNotMatch(cssSource, /\.tripleControl:active\s*\{[\s\S]*transform:/)
  assert.doesNotMatch(cssSource, /transition:[^;]*transform/)
})