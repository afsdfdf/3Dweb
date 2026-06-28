import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const ribbonCssPath = 'src/components/ui-lab/hero-product-ribbon/hero-product-ribbon.module.css'

test('hero product ribbon centers its label vertically in the ribbon plaque', async () => {
  const cssSource = await readFile(ribbonCssPath, 'utf8')

  assert.match(cssSource, /\.ribbon\s*\{[\s\S]*height:\s*var\(--hero-product-ribbon-height,\s*102px\)/)
  assert.match(cssSource, /\.left\s*\{[\s\S]*flex:\s*0\s+0\s+var\(--hero-product-ribbon-left-width,\s*60px\)[\s\S]*width:\s*var\(--hero-product-ribbon-left-width,\s*60px\)/)
  assert.match(cssSource, /\.middle\s*\{[\s\S]*align-items:\s*center/)
  assert.match(cssSource, /\.middle\s*\{[\s\S]*box-sizing:\s*border-box/)
  assert.match(cssSource, /\.middle\s*\{[\s\S]*height:\s*var\(--hero-product-ribbon-middle-height,\s*30px\)/)
  assert.match(cssSource, /\.middle\s*\{[\s\S]*margin-left:\s*-3px/)
  assert.match(cssSource, /\.middle\s*\{[\s\S]*padding:\s*4px\s+12px\s+4px\s+12px/)
  assert.doesNotMatch(cssSource, /\.middle\s*\{[\s\S]*min-width:\s*210px/)
  assert.doesNotMatch(cssSource, /\.middle\s*\{[\s\S]*padding:\s*0\s+8px\s+2px\s+3px/)
  assert.match(cssSource, /\.label\s*\{[\s\S]*height:\s*22px/)
  assert.match(cssSource, /\.label\s*\{[\s\S]*font-family:\s*PingFangSC,\s*"PingFang SC",\s*Arial,\s*sans-serif/)
  assert.match(cssSource, /\.label\s*\{[\s\S]*font-weight:\s*500/)
  assert.match(cssSource, /\.label\s*\{[\s\S]*font-size:\s*16px/)
  assert.match(cssSource, /\.label\s*\{[\s\S]*line-height:\s*22px/)
  assert.match(cssSource, /\.label\s*\{[\s\S]*text-align:\s*left/)
  assert.match(cssSource, /\.label\s*\{[\s\S]*font-style:\s*normal/)
  assert.doesNotMatch(cssSource, /\.label\s*\{[\s\S]*width:\s*98px/)
})
