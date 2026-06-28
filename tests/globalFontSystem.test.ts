import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'

const rootDir = process.cwd()

const globalsCssPath = path.join(rootDir, 'src', 'app', '(frontend)', 'globals.css')
const coreUiCssPaths = [
  path.join(rootDir, 'src', 'components', 'ui-lab', 'top-navigation', 'top-navigation.module.css'),
  path.join(rootDir, 'src', 'components', 'ui-lab', 'top-navigation', 'user-menu.module.css'),
  path.join(rootDir, 'src', 'components', 'account', 'account-center', 'account-center.module.css'),
  path.join(rootDir, 'src', 'components', 'ui-lab', 'subscription-panel', 'subscription-panel.module.css'),
  path.join(rootDir, 'src', 'components', 'ui-lab', 'credit-topup-redemption-dialog', 'credit-topup-redemption-dialog.module.css'),
  path.join(rootDir, 'src', 'app', '(frontend)', 'cart', 'cartPage.module.css'),
]

test('frontend exposes a global UI font system', () => {
  const source = readFileSync(globalsCssPath, 'utf8')
  const rootRule = source.match(/:root\s*\{[\s\S]*?\n\}/)?.[0] ?? ''
  const themeRule = source.match(/@theme inline\s*\{[\s\S]*?\n\}/)?.[0] ?? ''
  const baseLayer = source.match(/@layer base\s*\{[\s\S]*\n\}/)?.[0] ?? ''

  assert.match(rootRule, /--font-ui:\s*PingFangSC,\s*"PingFang SC",\s*"Helvetica Neue",\s*Arial,\s*"Hiragino Sans GB",\s*"Microsoft YaHei UI",\s*"Microsoft YaHei",\s*SimSun,\s*sans-serif;/)
  assert.match(rootRule, /--font-brand-serif:\s*Georgia,\s*"Times New Roman",\s*serif;/)
  assert.match(rootRule, /--font-code:\s*ui-monospace,\s*SFMono-Regular,\s*Menlo,\s*Monaco,\s*Consolas,\s*"Liberation Mono",\s*"Courier New",\s*monospace;/)
  assert.match(themeRule, /--font-sans:\s*var\(--font-ui\);/)
  assert.match(themeRule, /--font-heading:\s*var\(--font-ui\);/)
  assert.doesNotMatch(themeRule, /--font-sans:\s*var\(--font-sans\)/)
  assert.match(baseLayer, /html,\s*body\s*\{[\s\S]*?font-family:\s*var\(--font-ui\);/)
  assert.match(baseLayer, /button,\s*input,\s*select,\s*textarea\s*\{[\s\S]*?font:\s*inherit;/)
  assert.match(baseLayer, /-webkit-font-smoothing:\s*antialiased;/)
})

test('core UI surfaces consume the global UI font token instead of local Arial stacks', () => {
  for (const sourcePath of coreUiCssPaths) {
    const source = readFileSync(sourcePath, 'utf8')

    assert.match(source, /var\(--font-ui\)/, `${sourcePath} should use var(--font-ui)`)
    assert.doesNotMatch(source, /font-family:\s*Arial\b/, `${sourcePath} should not hard-code Arial as a local UI stack`)
    assert.doesNotMatch(source, /font-family:\s*PingFangSC,\s*"PingFang SC"/, `${sourcePath} should use the shared token`)
    assert.doesNotMatch(source, /font-family:\s*"PingFang SC",\s*"PingFangSC"/, `${sourcePath} should use the shared token`)
  }
})
