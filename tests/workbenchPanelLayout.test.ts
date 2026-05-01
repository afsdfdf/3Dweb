import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'

const rootDir = process.cwd()
const workbenchCssPath = path.join(rootDir, 'src', 'app', '(frontend)', 'workbench', 'page.module.css')

test('Workbench left panel keeps tab clearance on the scroll container', () => {
  const source = readFileSync(workbenchCssPath, 'utf8')

  assert.match(source, /\.modeTabsMount\s*\{[\s\S]*position:\s*absolute;/)
  assert.match(source, /\.panelScrollArea\s*\{[\s\S]*margin-top:\s*75px;/)
  assert.match(source, /\.formSection\s*\{\s*margin-top:\s*0;/)
  assert.doesNotMatch(source, /\.formSection\s*\{\s*margin-top:\s*75px;/)
})
