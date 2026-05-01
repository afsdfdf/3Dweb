import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'

import {
  formatTopNavigationUserLabel,
  getTopNavigationUserLabel,
  topNavigationUserLabelMaxCharacters,
} from '../src/components/ui-lab/top-navigation/user-label.ts'

const rootDir = process.cwd()
const publicNavigationPath = path.join(rootDir, 'src', 'lib', 'publicNavigation.ts')
const siteShellPath = path.join(rootDir, 'src', 'app', '(frontend)', '_components', 'SiteShell.tsx')
const topNavigationPath = path.join(rootDir, 'src', 'components', 'ui-lab', 'top-navigation', 'top-navigation.tsx')
const topNavigationCssPath = path.join(rootDir, 'src', 'components', 'ui-lab', 'top-navigation', 'top-navigation.module.css')
const topNavBarPath = path.join(rootDir, 'src', 'app', '(frontend)', '_components', 'shell', 'TopNavBar.tsx')
const workbenchModelPagePath = path.join(rootDir, 'src', 'app', '(frontend)', 'workbench', 'models', '[id]', 'page.tsx')
const personalCenterTestPath = path.join(
  rootDir,
  'src',
  'components',
  'ui-lab',
  'personal-center-test',
  'personal-center-test.tsx',
)
const personalCenterLegacyPath = path.join(
  rootDir,
  'src',
  'components',
  'ui-lab',
  'personal-center-legacy',
  'personal-center.tsx',
)

test('public pages share one canonical navigation contract', () => {
  assert.equal(existsSync(publicNavigationPath), true)

  const source = readFileSync(publicNavigationPath, 'utf8')

  for (const item of [
    "{ href: '/', id: 'HOME', label: 'HOME' }",
    "{ href: '/workbench', id: 'WORKBENCH', label: 'WORKBENCH' }",
    "{ href: '/pricing', id: 'PLANS', label: 'PLANS' }",
    "{ href: '/about', id: 'ABOUT', label: 'ABOUT' }",
  ]) {
    assert.match(source, new RegExp(item.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
  }

  assert.doesNotMatch(source, /DETAIL/)
  assert.doesNotMatch(source, /CENTER/)
  assert.doesNotMatch(source, /ADMIN/)
  assert.doesNotMatch(source, /\/generate/)
})

test('shared navigation components use the canonical navigation source', () => {
  const topNavigationSource = readFileSync(topNavigationPath, 'utf8')
  const topNavigationCssSource = readFileSync(topNavigationCssPath, 'utf8')
  const topNavBarSource = readFileSync(topNavBarPath, 'utf8')
  const userNameCssRule = topNavigationCssSource.match(/\.userName\s*\{[\s\S]*?\}/)?.[0] ?? ''

  assert.match(topNavigationSource, /@\/lib\/publicNavigation/)
  assert.match(topNavigationSource, /publicNavigationItems/)
  assert.match(topNavigationSource, /formatTopNavigationUserLabel/)
  assert.match(
    topNavigationSource,
    /<Link[\s\S]*className=\{styles\.userName\}[\s\S]*href="\/account"[\s\S]*title=\{displayName\s*\?\?\s*undefined\}/,
  )
  assert.match(topNavigationSource, /\{visibleDisplayName\}/)
  assert.doesNotMatch(topNavigationCssSource, /\.topNav\[data-authenticated=["']true["']\]\s+\.userName\s*\{[\s\S]*?display:\s*none/)
  assert.match(userNameCssRule, /width:\s*72px/)
  assert.match(userNameCssRule, /overflow:\s*hidden/)
  assert.match(userNameCssRule, /text-overflow:\s*ellipsis/)
  assert.doesNotMatch(topNavigationSource, /href:\s*['"]\/model-detail['"]/)
  assert.doesNotMatch(topNavigationSource, /id:\s*['"]DETAIL['"]/)

  assert.match(topNavBarSource, /@\/lib\/publicNavigation/)
  assert.match(topNavBarSource, /publicNavigationItems/)
  assert.doesNotMatch(topNavBarSource, /href:\s*['"]\/generate['"]/)
  assert.doesNotMatch(topNavBarSource, /label:\s*['"]Center['"]/)
  assert.doesNotMatch(topNavBarSource, /label:\s*['"]Admin['"]/)
})

test('shell-rendered pages use the same top navigation template as UI-lab pages', () => {
  const siteShellSource = readFileSync(siteShellPath, 'utf8')
  const workbenchModelPageSource = readFileSync(workbenchModelPagePath, 'utf8')

  assert.match(siteShellSource, /@\/components\/ui-lab\/top-navigation/)
  assert.match(siteShellSource, /getPublicNavigationActiveID/)
  assert.match(siteShellSource, /<TopNavigation/)
  assert.doesNotMatch(siteShellSource, /shell\/TopNavBar/)
  assert.doesNotMatch(siteShellSource, /<TopNavBar/)

  assert.match(workbenchModelPageSource, /@\/components\/ui-lab\/top-navigation/)
  assert.match(workbenchModelPageSource, /<TopNavigation/)
  assert.doesNotMatch(workbenchModelPageSource, /TopNavBar/)
})

test('account-style pages do not carry private navigation arrays', () => {
  const personalCenterTestSource = readFileSync(personalCenterTestPath, 'utf8')
  const personalCenterLegacySource = readFileSync(personalCenterLegacyPath, 'utf8')

  assert.match(personalCenterTestSource, /@\/lib\/publicNavigation/)
  assert.match(personalCenterLegacySource, /@\/lib\/publicNavigation/)
  assert.doesNotMatch(personalCenterTestSource, /realNavigationItems/)
  assert.doesNotMatch(personalCenterLegacySource, /personalCenterNavItems/)
  assert.doesNotMatch(personalCenterTestSource, /id:\s*["']ADMIN["']/)
  assert.doesNotMatch(personalCenterLegacySource, /id:\s*["']DETAIL["']/)
})

test('top navigation user label is normalized and display-limited', () => {
  const longEmail = 'averyverylongusername@example.com'
  const longCjkName = '\u957f'.repeat(13)
  const label = getTopNavigationUserLabel({ displayName: '   ', name: null, email: longEmail }, 'Fallback')

  assert.equal(label, longEmail)
  assert.equal(formatTopNavigationUserLabel(label), 'averyvery...')
  assert.equal(formatTopNavigationUserLabel('short'), 'short')
  assert.equal(formatTopNavigationUserLabel(longCjkName), `${'\u957f'.repeat(9)}...`)
  assert.equal(formatTopNavigationUserLabel(label).length, topNavigationUserLabelMaxCharacters)
})
