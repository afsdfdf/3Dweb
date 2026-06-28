import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const componentPath = 'src/components/ui-lab/border-combo-frame-2/border-combo-frame-2.tsx'
const cssPath = 'src/components/ui-lab/border-combo-frame-2/border-combo-frame-2.module.css'
const indexPath = 'src/components/ui-lab/border-combo-frame-2/index.ts'

test('BorderComboFrame2 exposes a stable header/body container without replacing the legacy frame', async () => {
  const [componentSource, cssSource, indexSource] = await Promise.all([
    readFile(componentPath, 'utf8'),
    readFile(cssPath, 'utf8'),
    readFile(indexPath, 'utf8'),
  ])

  assert.match(componentSource, /export function BorderComboFrame2Container/)
  assert.match(componentSource, /type BorderComboFrame2ContainerProps/)
  assert.match(componentSource, /header\?: ReactNode/)
  assert.match(componentSource, /headerHeight\?: number \| string/)
  assert.match(componentSource, /bodyClassName\?: string/)
  assert.match(componentSource, /contentClassName\?: string/)
  assert.match(componentSource, /"--frame-header-height":/)
  assert.match(componentSource, /"--upper-height":\s*"calc\(var\(--frame-header-height\) - var\(--top-height\) - \(var\(--middle-height\) \/ 2\)\)"/)
  assert.match(componentSource, /export function BorderComboFrame2\(/)
  assert.match(componentSource, /renderBorderPieces\(\)/)
  assert.doesNotMatch(componentSource, /props:\s*any/)

  assert.match(cssSource, /\.containerContent\s*\{[\s\S]*display:\s*flex[\s\S]*flex-direction:\s*column/)
  assert.match(cssSource, /\.headerSlot\s*\{[\s\S]*flex:\s*0\s+0\s+var\(--frame-header-height\)/)
  assert.match(cssSource, /\.bodySlot\s*\{[\s\S]*flex:\s*1\s+1\s+auto/)
  assert.match(indexSource, /BorderComboFrame2Container/)
})
