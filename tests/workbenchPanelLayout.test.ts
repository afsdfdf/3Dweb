import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'

const rootDir = process.cwd()
const workbenchCssPath = path.join(rootDir, 'src', 'app', '(frontend)', 'workbench', 'page.module.css')

function getRuleBlock(source: string, selector: string) {
  const start = source.indexOf(`${selector} {`)
  assert.notEqual(start, -1, `Missing CSS rule for ${selector}`)

  const bodyStart = source.indexOf('{', start)
  const bodyEnd = source.indexOf('}', bodyStart)
  assert.notEqual(bodyStart, -1, `Missing opening brace for ${selector}`)
  assert.notEqual(bodyEnd, -1, `Missing closing brace for ${selector}`)

  return source.slice(bodyStart + 1, bodyEnd)
}

test('Workbench left panel keeps tab clearance on the scroll container', () => {
  const source = readFileSync(workbenchCssPath, 'utf8')
  const leftPanel = getRuleBlock(source, '.leftPanel')
  const modeTabsMount = getRuleBlock(source, '.modeTabsMount')
  const panelScrollArea = getRuleBlock(source, '.panelScrollArea')
  const panelFooterArea = getRuleBlock(source, '.panelFooterArea')
  const formSection = getRuleBlock(source, '.formSection')

  assert.match(leftPanel, /display:\s*block;/)
  assert.doesNotMatch(leftPanel, /display:\s*flex;/)

  assert.match(modeTabsMount, /position:\s*absolute;/)

  assert.match(panelScrollArea, /position:\s*absolute;/)
  assert.match(panelScrollArea, /top:\s*109px;/)
  assert.match(panelScrollArea, /bottom:\s*100px;/)
  assert.doesNotMatch(panelScrollArea, /flex:\s*1\s+1\s+auto;/)
  assert.doesNotMatch(panelScrollArea, /margin-top:\s*75px;/)

  assert.match(panelFooterArea, /position:\s*absolute;/)
  assert.match(panelFooterArea, /bottom:\s*26px;/)

  assert.match(formSection, /margin-top:\s*0;/)
  assert.doesNotMatch(formSection, /margin-top:\s*75px;/)
})
