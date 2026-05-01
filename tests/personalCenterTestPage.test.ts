import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'

const rootDir = process.cwd()
const componentPath = path.join(
  rootDir,
  'src',
  'components',
  'ui-lab',
  'personal-center-test',
  'personal-center-test.tsx',
)
const routePath = path.join(rootDir, 'src', 'app', '(frontend)', 'personal-center-test', 'page.tsx')

test('personal center test route remains available for local design review and hidden in production', () => {
  assert.equal(existsSync(componentPath), true)
  assert.equal(existsSync(routePath), true)

  const source = readFileSync(componentPath, 'utf8')
  const routeSource = readFileSync(routePath, 'utf8')

  assert.match(source, /BorderComboFrame2/)
  assert.match(source, /accountFrameContainer/)
  assert.match(source, /FrameButton/)
  assert.match(source, /OrangeMediumActionButton/)
  assert.doesNotMatch(source, /PurpleMediumActionButton/)
  assert.match(source, /mediumActionSlot/)
  assert.match(source, /TopNavigation/)
  assert.match(source, /href: "\/generate"/)
  assert.match(source, /href: "\/dashboard"/)
  assert.match(routeSource, /NODE_ENV === "production"/)
  assert.match(routeSource, /notFound\(\)/)
  assert.doesNotMatch(routeSource, /SiteShell/)

  for (const label of ['Overview', 'Account Settings', 'Orders', 'Model Library', 'Generation Tasks', 'Billing', 'Change avatar', 'Creator Banner', 'Save Settings']) {
    assert.match(source, new RegExp(label))
  }

  assert.doesNotMatch(source, /Credit Ledger/)
  assert.doesNotMatch(source, /Payment Data/)
  assert.doesNotMatch(source, /Classic Account/)
  assert.doesNotMatch(source, /Main Dashboard/)
  assert.doesNotMatch(source, /number:/)
  assert.doesNotMatch(source, /section\.number/)
  assert.doesNotMatch(source, /Profile Avatar/)
  assert.doesNotMatch(source, /Change Avatar/)
  assert.ok(source.indexOf('label: "Overview"') < source.indexOf('label: "Account Settings"'))
  assert.match(source, /useState<SectionId>\("overview"\)/)

  for (const tableHeader of ['ID', 'Type', 'Item', 'Status', 'Amount', 'Time']) {
    assert.match(source, new RegExp(tableHeader))
  }
})
