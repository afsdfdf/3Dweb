import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'

import {
  formatTopNavigationUserLabel,
  getTopNavigationUserLabel,
  topNavigationUserLabelMaxCharacters,
} from '../src/components/ui-lab/top-navigation/user-label.ts'
import {
  getPublicNavigationActiveID,
  publicNavigationItems,
  resolvePublicNavigationItems,
} from '../src/lib/publicNavigation.ts'

const rootDir = process.cwd()
const publicNavigationPath = path.join(rootDir, 'src', 'lib', 'publicNavigation.ts')
const siteShellPath = path.join(rootDir, 'src', 'app', '(frontend)', '_components', 'SiteShell.tsx')
const topNavigationPath = path.join(rootDir, 'src', 'components', 'ui-lab', 'top-navigation', 'top-navigation.tsx')
const topNavigationCssPath = path.join(rootDir, 'src', 'components', 'ui-lab', 'top-navigation', 'top-navigation.module.css')
const topNavBarPath = path.join(rootDir, 'src', 'app', '(frontend)', '_components', 'shell', 'TopNavBar.tsx')
const marketingPagePath = path.join(rootDir, 'src', 'app', '(frontend)', '_components', 'MarketingPage.tsx')
const blogComponentsPath = path.join(rootDir, 'src', 'app', '(frontend)', 'blog', '_components', 'BlogComponents.tsx')
const blogArticleBodyPath = path.join(rootDir, 'src', 'app', '(frontend)', 'blog', '_components', 'BlogArticleBody.tsx')
const blogDataPath = path.join(rootDir, 'src', 'app', '(frontend)', 'blog', '_lib', 'blogData.ts')
const bundleServicePath = path.join(rootDir, 'src', 'lib', 'bundleService.ts')
const showcasePagePath = path.join(rootDir, 'src', 'app', '(frontend)', 'showcase', 'page.tsx')
const workbenchModelPagePath = path.join(rootDir, 'src', 'app', '(frontend)', 'workbench', 'models', '[id]', 'page.tsx')
const frontendSessionPath = path.join(rootDir, 'src', 'app', '(frontend)', '_lib', 'session.ts')
const accountCenterPath = path.join(
  rootDir,
  'src',
  'components',
  'account',
  'account-center',
  'account-center.tsx',
)

test('public pages share one canonical navigation contract', () => {
  assert.equal(existsSync(publicNavigationPath), true)

  const source = readFileSync(publicNavigationPath, 'utf8')

  for (const item of [
    "{ href: '/', id: 'HOME', label: 'HOME' }",
    "{ href: '/workbench', id: 'WORKBENCH', label: 'WORKBENCH' }",
    "{ href: '/showcase', id: 'SHOWCASE', label: 'SHOWCASE' }",
    "{ href: '/pricing', id: 'PLANS', label: 'PLANS' }",
    "{ href: '/blog', id: 'BLOG', label: 'BLOG' }",
    "{ href: '/about', id: 'ABOUT', label: 'ABOUT' }",
  ]) {
    assert.match(source, new RegExp(item.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
  }

  assert.doesNotMatch(source, /DETAIL/)
  assert.doesNotMatch(source, /CENTER/)
  assert.doesNotMatch(source, /ADMIN/)
  assert.doesNotMatch(source, /\/generate/)
})

test('backend header navigation resolves to stable top navigation items', () => {
  const items = resolvePublicNavigationItems([
    { href: '/', label: 'Start' },
    { href: '/showcase', label: 'Gallery' },
    { href: '/account', label: 'Account' },
  ])

  assert.deepEqual(items, [
    { href: '/', id: 'HOME', label: 'Start' },
    { href: '/showcase', id: 'SHOWCASE', label: 'Gallery' },
    { href: '/account', id: 'ACCOUNT', label: 'Account' },
  ])
  assert.equal(getPublicNavigationActiveID('/showcase?q=dragon', items), 'SHOWCASE')
  assert.equal(getPublicNavigationActiveID('/account?section=models', items), 'ACCOUNT')
  assert.equal(resolvePublicNavigationItems([]).length, publicNavigationItems.length)
})

test('shared navigation components use the canonical navigation source', () => {
  const topNavigationSource = readFileSync(topNavigationPath, 'utf8')
  const topNavigationCssSource = readFileSync(topNavigationCssPath, 'utf8')
  const topNavBarSource = readFileSync(topNavBarPath, 'utf8')
  const userNameCssRule = topNavigationCssSource.match(/\.userName\s*\{[\s\S]*?\}/)?.[0] ?? ''

  assert.match(topNavigationSource, /@\/lib\/publicNavigation/)
  assert.match(topNavigationSource, /publicNavigationItems/)
  assert.match(topNavigationSource, /formatTopNavigationUserLabel/)
  assert.match(topNavigationSource, /TopNavigationUserMenu/)
  assert.match(topNavigationSource, /aria-haspopup="menu"/)
  assert.match(topNavigationSource, /aria-expanded=\{isUserMenuOpen\}/)
  assert.match(topNavigationSource, /className=\{styles\.userName\}[\s\S]*title=\{displayName\s*\?\?\s*undefined\}/)
  assert.doesNotMatch(topNavigationSource, /<Link[\s\S]*className=\{styles\.userName\}[\s\S]*href="\/account"/)
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

  assert.match(siteShellSource, /@\/components\/ui-lab\/top-navigation/)
  assert.match(siteShellSource, /getPublicNavigationActiveID/)
  assert.match(siteShellSource, /resolvePublicNavigationItems/)
  assert.match(siteShellSource, /<TopNavigation/)
  assert.match(siteShellSource, /items=\{navigationItems\}/)
  assert.doesNotMatch(siteShellSource, /items=\{publicNavigationItems\}/)
  assert.doesNotMatch(siteShellSource, /shell\/TopNavBar/)
  assert.doesNotMatch(siteShellSource, /<TopNavBar/)
})

test('formal content pages consume backend header navigation', () => {
  for (const sourcePath of [marketingPagePath, blogComponentsPath, showcasePagePath]) {
    const source = readFileSync(sourcePath, 'utf8')

    assert.match(source, /resolvePublicNavigationItems/)
    assert.match(source, /siteSettings\.headerNav/)
    assert.doesNotMatch(source, /migrationTestNavItems/)
    assert.doesNotMatch(source, /items=\{publicNavigationItems\}/)
  }
})

test('workbench model detail route is only a canonical detail redirect', () => {
  const workbenchModelPageSource = readFileSync(workbenchModelPagePath, 'utf8')

  assert.match(workbenchModelPageSource, /next\/navigation/)
  assert.match(workbenchModelPageSource, /redirect\(`\/model-detail\?id=/)
  assert.doesNotMatch(workbenchModelPageSource, /buildPreviewModel/)
  assert.doesNotMatch(workbenchModelPageSource, /SketchExactPreview/)
  assert.doesNotMatch(workbenchModelPageSource, /TopNavBar/)
})

test('account-style pages do not carry private navigation arrays', () => {
  const accountCenterSource = readFileSync(accountCenterPath, 'utf8')

  assert.match(accountCenterSource, /@\/lib\/publicNavigation/)
  assert.doesNotMatch(accountCenterSource, /realNavigationItems/)
  assert.doesNotMatch(accountCenterSource, /id:\s*["']ADMIN["']/)
})

test('blog detail is fail-soft and renders common rich text nodes', () => {
  const bodySource = readFileSync(blogArticleBodyPath, 'utf8')
  const dataSource = readFileSync(blogDataPath, 'utf8')

  assert.match(dataSource, /export async function getBlogPostBySlug/)
  assert.match(dataSource, /catch \{\s*return null\s*\}/)
  assert.match(bodySource, /node\.type === 'upload'/)
  assert.match(bodySource, /node\.type === 'code'/)
  assert.match(bodySource, /node\.type === 'horizontalrule'/)
  assert.match(bodySource, /node\.tag === 'h4'/)
  assert.doesNotMatch(bodySource, /dangerouslySetInnerHTML/)
})

test('public bundle creator names do not fall back to email local-parts', () => {
  const source = readFileSync(bundleServicePath, 'utf8')

  assert.doesNotMatch(source, /email\.split/)
  assert.doesNotMatch(source, /email:\s*true/)
  assert.match(source, /Creator \$\{ownerId\}/)
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

test('top navigation session data reads the canonical cached credit account', () => {
  const source = readFileSync(frontendSessionPath, 'utf8')
  const navFunction = source.match(/export async function getCurrentNavUser\(\) \{[\s\S]*?\n\}/)?.[0] ?? ''

  assert.match(source, /import \{ cache \} from ["']react["']/)
  assert.match(source, /const getPayloadWithUser = cache/)
  assert.match(source, /const getCurrentUserDocument = cache/)
  assert.match(source, /const getCurrentCreditAccountDocument = cache/)
  assert.match(source, /collection:\s*["']credits["']/)
  assert.match(navFunction, /creditsBalance/)
  assert.match(navFunction, /getCurrentCreditAccountDocument/)
  assert.match(navFunction, /creditAccount\?\.balance/)
})
