import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const pagePath = 'src/app/(frontend)/test1/page.tsx'
const cssPath = 'src/app/(frontend)/test1/test1Page.module.css'
const gridComponentPath = 'src/components/ui-lab/home-test/inspiration-grid.tsx'
const gridCssPath = 'src/components/ui-lab/home-test/inspiration-grid.module.css'

test('/test1 third frame uses a two-layer responsive container contract', async () => {
  const [pageSource, cssSource, gridComponentSource, gridCssSource] = await Promise.all([
    readFile(pagePath, 'utf8'),
    readFile(cssPath, 'utf8'),
    readFile(gridComponentPath, 'utf8'),
    readFile(gridCssPath, 'utf8'),
  ])

  assert.match(pageSource, /BorderComboFrame2/)
  assert.match(pageSource, /SmallButtonTriple/)
  assert.match(pageSource, /InspirationGridCard/)
  assert.doesNotMatch(pageSource, /Test1InspirationCard/)
  assert.match(gridComponentSource, /export function InspirationGridCard/)
  assert.match(gridComponentSource, /ButtonBoxFrame/)
  assert.match(pageSource, /className=\{styles\.thirdFrame\}/)
  assert.match(pageSource, /className=\{styles\.thirdFrameHeader\}/)
  assert.match(pageSource, /className=\{styles\.thirdFrameBody\}/)
  assert.match(pageSource, /className=\{styles\.thirdFrameGrid\}/)

  assert.match(cssSource, /--frame-gutter:\s*32px/)
  assert.match(cssSource, /padding:\s*48px\s+var\(--frame-gutter\)\s+72px/)
  assert.match(cssSource, /\.thirdFrame\s*\{/)
  assert.match(cssSource, /\.thirdFrameHeader\s*\{/)
  assert.match(cssSource, /grid-template-columns:\s*58px\s+240px\s+minmax\(0,\s*1fr\)\s+auto/)
  assert.match(cssSource, /height:\s*198px/)
  assert.match(cssSource, /\.thirdFrameBody\s*\{/)
  assert.match(cssSource, /\.thirdFrameGrid\s*\{/)
  assert.match(cssSource, /--card-width:\s*288px/)
  assert.match(cssSource, /--compact-six-card-width:\s*248px/)
  assert.match(cssSource, /--standard-six-card-width:\s*256px/)
  assert.match(cssSource, /--inspiration-card-width:\s*var\(--card-width\)/)
  assert.match(cssSource, /grid-template-columns:\s*repeat\(auto-fit,\s*var\(--card-width\)\)/)
  assert.match(cssSource, /@media \(min-width:\s*1680px\) and \(max-width:\s*1727px\)[\s\S]*?--card-width:\s*var\(--compact-six-card-width\)/)
  assert.match(cssSource, /@media \(min-width:\s*1728px\) and \(max-width:\s*1919px\)[\s\S]*?--card-width:\s*var\(--standard-six-card-width\)/)
  assert.match(cssSource, /@media \(max-width:\s*520px\)[\s\S]*?--frame-gutter:\s*8px/)
  assert.match(cssSource, /@media \(max-width:\s*820px\)[\s\S]*?\.frameActions\s*\{[^}]*grid-column:\s*1\s*\/\s*-1/)
  assert.match(cssSource, /@media \(max-width:\s*820px\)[\s\S]*?\.frameActions\s*\{[^}]*justify-self:\s*center/)
  assert.doesNotMatch(cssSource, /\.frameActions\s*\{[^}]*display:\s*none/)
  assert.match(gridCssSource, /\.item\s*\{[\s\S]*height:\s*var\(--inspiration-card-height,\s*460px\)[\s\S]*width:\s*var\(--inspiration-card-width,\s*288px\)/)
  assert.doesNotMatch(cssSource, /transform:\s*scale/)
  assert.doesNotMatch(cssSource, /zoom:\s*calc/)
})
