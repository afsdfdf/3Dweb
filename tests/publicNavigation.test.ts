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
const topNavigationCoinBadgePath = path.join(rootDir, 'public', 'ui-lab', 'top-navigation', 'icon-coin-badge.png')
const topNavBarPath = path.join(rootDir, 'src', 'app', '(frontend)', '_components', 'shell', 'TopNavBar.tsx')
const globalsCssPath = path.join(rootDir, 'src', 'app', '(frontend)', 'globals.css')
const marketingPagePath = path.join(rootDir, 'src', 'app', '(frontend)', '_components', 'MarketingPage.tsx')
const marketingPageCssPath = path.join(rootDir, 'src', 'app', '(frontend)', '_components', 'MarketingPage.module.css')
const formalInfoPagePath = path.join(rootDir, 'src', 'app', '(frontend)', '_components', 'FormalInfoPage.tsx')
const subscriptionPagePath = path.join(rootDir, 'src', 'app', '(frontend)', '_components', 'SubscriptionPage.tsx')
const aboutPageCssPath = path.join(rootDir, 'src', 'app', '(frontend)', 'about', 'page.module.css')
const blogComponentsPath = path.join(rootDir, 'src', 'app', '(frontend)', 'blog', '_components', 'BlogComponents.tsx')
const blogArticleBodyPath = path.join(rootDir, 'src', 'app', '(frontend)', 'blog', '_components', 'BlogArticleBody.tsx')
const blogPageCssPath = path.join(rootDir, 'src', 'app', '(frontend)', 'blog', 'page.module.css')
const blogDataPath = path.join(rootDir, 'src', 'app', '(frontend)', 'blog', '_lib', 'blogData.ts')
const bundlesPageCssPath = path.join(rootDir, 'src', 'app', '(frontend)', 'bundles', 'page.module.css')
const bundleDetailPageCssPath = path.join(rootDir, 'src', 'app', '(frontend)', 'bundles', '[slug]', 'page.module.css')
const bundleServicePath = path.join(rootDir, 'src', 'lib', 'bundleService.ts')
const showcasePagePath = path.join(rootDir, 'src', 'app', '(frontend)', 'showcase', 'page.tsx')
const showcasePageCssPath = path.join(rootDir, 'src', 'app', '(frontend)', 'showcase', 'page.module.css')
const resultsPageCssPath = path.join(rootDir, 'src', 'app', '(frontend)', 'results', '[taskCode]', 'page.module.css')
const workbenchModelPagePath = path.join(rootDir, 'src', 'app', '(frontend)', 'workbench', 'models', '[id]', 'page.tsx')
const workbenchHistoryPagePath = path.join(rootDir, 'src', 'app', '(frontend)', 'workbench', 'history', 'page.tsx')
const frontendSessionPath = path.join(rootDir, 'src', 'app', '(frontend)', '_lib', 'session.ts')
const accountCenterPath = path.join(
  rootDir,
  'src',
  'components',
  'account',
  'account-center',
  'account-center.tsx',
)
const accountCenterCssPath = path.join(
  rootDir,
  'src',
  'components',
  'account',
  'account-center',
  'account-center.module.css',
)

function readPngDimensions(sourcePath: string) {
  const buffer = readFileSync(sourcePath)

  assert.equal(buffer.toString('ascii', 1, 4), 'PNG')
  return {
    height: buffer.readUInt32BE(20),
    width: buffer.readUInt32BE(16),
  }
}

test('public pages share one canonical navigation contract', () => {
  assert.equal(existsSync(publicNavigationPath), true)

  const source = readFileSync(publicNavigationPath, 'utf8')

  for (const item of [
    "{ href: '/', id: 'HOME', label: 'HOME' }",
    "{ href: '/workbench', id: 'WORKBENCH', label: 'WORKBENCH' }",
    "{ href: '/showcase', id: 'SHOWCASE', label: 'SHOWCASE' }",
    "{ href: '/assets', id: 'ASSETS', label: 'ASSETS' }",
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
  assert.equal(getPublicNavigationActiveID('/assets/library'), 'ASSETS')
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
  assert.match(userNameCssRule, /width:\s*104px/)
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

test('top navigation owns a mobile dropdown menu instead of relying on page-level hidden links', () => {
  const topNavigationSource = readFileSync(topNavigationPath, 'utf8')
  const topNavigationCssSource = readFileSync(topNavigationCssPath, 'utf8')

  assert.match(topNavigationSource, /isMobileMenuOpen/)
  assert.match(topNavigationSource, /setIsMobileMenuOpen/)
  assert.match(topNavigationSource, /aria-label="Toggle navigation menu"/)
  assert.match(topNavigationSource, /aria-controls="top-navigation-mobile-menu"/)
  assert.match(topNavigationSource, /className=\{styles\.mobileMenuButton\}/)
  assert.match(topNavigationSource, /id="top-navigation-mobile-menu"/)
  assert.match(topNavigationSource, /className=\{styles\.mobileMenuPanel\}/)
  assert.match(topNavigationSource, /className=\{styles\.mobileMenuLinks\}/)
  assert.match(topNavigationSource, /className=\{styles\.mobileMenuActions\}/)
  assert.match(topNavigationSource, /setIsMobileMenuOpen\(false\)[\s\S]*closeAuthModal\(\)/)
  assert.match(topNavigationSource, /closeMobileMenu\(\);\s*openCreditTopupDialog\(\);/)
  assert.match(topNavigationSource, /event\.key === "Escape"[\s\S]*setIsMobileMenuOpen\(false\)/)

  assert.match(topNavigationCssSource, /@media \(max-width:\s*820px\)\s*\{[\s\S]*\.scaledTopNav\s*\{[\s\S]*height:\s*60px/)
  assert.match(topNavigationCssSource, /@media \(max-width:\s*820px\)\s*\{[\s\S]*\.scaledTopNavStage\s*\{[\s\S]*transform:\s*none/)
  assert.match(topNavigationCssSource, /@media \(max-width:\s*820px\)\s*\{[\s\S]*\.navLinks,\s*\.navCenter\s*\{[\s\S]*display:\s*none/)
  assert.match(topNavigationCssSource, /@media \(max-width:\s*820px\)\s*\{[\s\S]*\.mobileMenuButton\s*\{[\s\S]*display:\s*flex/)
  assert.match(topNavigationCssSource, /@media \(max-width:\s*820px\)\s*\{[\s\S]*\.mobileMenuPanel\s*\{[\s\S]*position:\s*absolute[\s\S]*top:\s*60px/)
  assert.match(topNavigationCssSource, /\.mobileMenuPanel\[data-open=["']false["']\]\s*\{[\s\S]*display:\s*none/)
  assert.match(topNavigationCssSource, /\.mobileMenuLinkActive/)
  assert.match(topNavigationCssSource, /\.mobileMenuAuthButton/)
  assert.match(topNavigationCssSource, /\.mobileMenuCartLink/)
  assert.match(topNavigationCssSource, /\.mobileMenuActions\s*>\s*:last-child:nth-child\(odd\)\s*\{[\s\S]*grid-column:\s*1\s*\/\s*-1/)
})

test('top navigation desktop styling follows the design spec metrics', () => {
  const topNavigationSource = readFileSync(topNavigationPath, 'utf8')
  const topNavigationCssSource = readFileSync(topNavigationCssPath, 'utf8')
  const activeArrowPath = path.join(rootDir, 'public', 'ui-lab', 'top-navigation', 'nav-active-arrow@2x.png')
  const topNavRule = topNavigationCssSource.match(/\.topNav\s*\{[\s\S]*?\}/)?.[0] ?? ''
  const navLinksRule = topNavigationCssSource.match(/\.navLinks\s*\{[\s\S]*?\}/)?.[0] ?? ''
  const navLinkRule = topNavigationCssSource.match(/\.navLink\s*\{[\s\S]*?\}/)?.[0] ?? ''
  const navLinkTextSharedRule = topNavigationCssSource.match(/\.navLinkText,\s*\.navLinkSizer\s*\{[\s\S]*?\}/)?.[0] ?? ''
  const navLinkSizerRule =
    [...topNavigationCssSource.matchAll(/(?:^|\n)\.navLinkSizer\s*\{[\s\S]*?\}/gm)]
      .map((match) => match[0])
      .find((rule) => /font-weight/.test(rule)) ?? ''
  const hoverRule = topNavigationCssSource.match(/\.navLink:hover,\s*\.navLink:focus-visible\s*\{[\s\S]*?\}/)?.[0] ?? ''
  const activeOnlyRule = topNavigationCssSource.match(/\.activeNav\s*\{[\s\S]*?\}/)?.[0] ?? ''
  const activePseudoRule = topNavigationCssSource.match(/\.activeNav::before,\s*\.activeNav::after\s*\{[\s\S]*?\}/)?.[0] ?? ''
  const activeArrowRule = topNavigationCssSource.match(/\.navLink::after\s*\{[\s\S]*?\}/)?.[0] ?? ''
  const authEntryRule = topNavigationCssSource.match(/\.authEntry\s*\{[\s\S]*?\}/)?.[0] ?? ''
  const walletRule = topNavigationCssSource.match(/\.wallet\s*\{[\s\S]*?\}/)?.[0] ?? ''
  const walletImageRule = topNavigationCssSource.match(/\.wallet img\s*\{[\s\S]*?\}/)?.[0] ?? ''

  assert.equal(existsSync(activeArrowPath), true)
  assert.match(topNavRule, /--nav-font-family:\s*var\(--font-ui\)/)
  assert.match(topNavRule, /--nav-center-width:\s*920px/)
  assert.match(topNavRule, /--notification-right:\s*251px/)
  assert.match(topNavRule, /--cart-right:\s*203px/)
  assert.match(topNavRule, /--avatar-right:\s*139px/)
  assert.match(navLinksRule, /font-family:\s*var\(--nav-font-family\)/)
  assert.match(navLinksRule, /font-size:\s*16px/)
  assert.match(navLinksRule, /font-weight:\s*400/)
  assert.match(navLinksRule, /line-height:\s*22px/)
  assert.match(navLinkRule, /min-width:\s*0/)
  assert.match(navLinkRule, /height:\s*22px/)
  assert.match(navLinkRule, /display:\s*grid/)
  assert.match(navLinkRule, /grid-template-areas:\s*"text"/)
  assert.match(topNavigationSource, /className=\{styles\.navLinkText\}/)
  assert.match(topNavigationSource, /className=\{styles\.navLinkSizer\}/)
  assert.match(navLinkTextSharedRule, /grid-area:\s*text/)
  assert.match(navLinkSizerRule, /font-weight:\s*500/)
  assert.match(navLinkSizerRule, /visibility:\s*hidden/)
  assert.doesNotMatch(topNavigationCssSource, /\.navLink:hover,\s*\.navLink:focus-visible,\s*\.activeNav\s*\{/)
  assert.match(hoverRule, /color:\s*#ffffff/)
  assert.doesNotMatch(hoverRule, /font-weight/)
  assert.doesNotMatch(hoverRule, /text-shadow/)
  assert.match(activeOnlyRule, /font-weight:\s*500/)
  assert.match(activeOnlyRule, /text-shadow:\s*0\s+0\s+10px/)
  assert.match(activePseudoRule, /opacity:\s*1/)
  assert.doesNotMatch(topNavigationCssSource, /\.navLink:hover::before/)
  assert.doesNotMatch(topNavigationCssSource, /\.navLink:hover::after/)
  assert.doesNotMatch(topNavigationCssSource, /\.navLinks:hover\s+\.activeNav/)
  assert.match(activeArrowRule, /background-image:\s*url\("\/ui-lab\/top-navigation\/nav-active-arrow@2x\.png"\)/)
  assert.match(activeArrowRule, /width:\s*16px/)
  assert.match(activeArrowRule, /height:\s*10px/)
  assert.match(authEntryRule, /font-family:\s*var\(--nav-font-family\)/)
  assert.match(authEntryRule, /font-weight:\s*400/)
  assert.match(authEntryRule, /font-size:\s*12px/)
  assert.match(walletRule, /overflow:\s*visible/)
  assert.match(walletImageRule, /left:\s*-26px/)
  assert.match(walletImageRule, /top:\s*-13px/)
  assert.match(walletImageRule, /width:\s*56px/)
  assert.match(walletImageRule, /height:\s*56px/)
})

test('top navigation coin badge uses a high-density source asset', () => {
  assert.equal(existsSync(topNavigationCoinBadgePath), true)

  const dimensions = readPngDimensions(topNavigationCoinBadgePath)

  assert.deepEqual(dimensions, { height: 88, width: 88 })
})

test('shell-rendered pages use the same top navigation template as UI-lab pages', () => {
  const siteShellSource = readFileSync(siteShellPath, 'utf8')

  assert.match(siteShellSource, /@\/components\/ui-lab\/top-navigation/)
  assert.match(siteShellSource, /getPublicNavigationActiveID/)
  assert.match(siteShellSource, /resolvePublicNavigationItems/)
  assert.match(siteShellSource, /const navigationUser = navUser \?\?/)
  assert.match(siteShellSource, /<TopNavigation/)
  assert.match(siteShellSource, /items=\{navigationItems\}/)
  assert.match(siteShellSource, /user=\{navigationUser\}/)
  assert.match(siteShellSource, /--app-stage-scale['"]:\s*['"]min\(1,\s*calc\(100vw\s*\/\s*1920px\)\)/)
  assert.doesNotMatch(siteShellSource, /--app-stage-scale['"]:\s*['"]clamp\(1,/)
  assert.doesNotMatch(siteShellSource, /avatarUrl:\s*navUser\.avatarUrl/)
  assert.doesNotMatch(siteShellSource, /modelsCount:\s*undefined/)
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

test('account center shell uses the standard content-page width and readable dashboard spacing', () => {
  const source = readFileSync(accountCenterCssPath, 'utf8')
  const shellRule = source.match(/\.accountShell\s*\{[\s\S]*?\}/)?.[0] ?? ''

  assert.match(shellRule, /max-width:\s*var\(--content-page-max-width\)/)
  assert.match(shellRule, /width:\s*100%/)
  assert.match(shellRule, /--account-readable-text:\s*15px/)
  assert.match(shellRule, /padding:\s*18px\s+var\(--content-page-gutter\)\s+72px/)
  assert.doesNotMatch(shellRule, /max-width:\s*1460px/)
  assert.doesNotMatch(shellRule, /padding:\s*34px\s+var\(--content-page-gutter\)\s+80px/)
  assert.doesNotMatch(shellRule, /padding:\s*34px\s+28px\s+80px/)
})

test('shared public page width tokens stay available while subscription keeps its restored container', () => {
  const globalsSource = readFileSync(globalsCssPath, 'utf8')
  const subscriptionSource = readFileSync(subscriptionPagePath, 'utf8')

  assert.match(globalsSource, /--public-page-max-width:\s*1600px/)
  assert.match(globalsSource, /--public-page-gutter:\s*24px/)
  assert.match(globalsSource, /--content-page-max-width:\s*1920px/)
  assert.match(globalsSource, /--content-page-gutter:\s*clamp\(32px,\s*2\.5vw,\s*48px\)/)
  assert.match(globalsSource, /--content-subject-max-width:\s*1680px/)
  assert.match(globalsSource, /@media\s*\(min-width:\s*2200px\)\s*\{[\s\S]*--content-page-max-width:\s*2200px[\s\S]*--content-subject-max-width:\s*1848px/)
  assert.match(subscriptionSource, /max-w-\[1600px\]/)
  assert.doesNotMatch(subscriptionSource, /max-w-\[var\(--public-page-max-width\)\]/)
  assert.doesNotMatch(subscriptionSource, /px-\[var\(--public-page-gutter\)\]/)
})

test('formal content pages use standard wide-page proportions with wider inner copy', () => {
  const aboutSource = readFileSync(aboutPageCssPath, 'utf8')
  const blogSource = readFileSync(blogPageCssPath, 'utf8')
  const bundlesSource = readFileSync(bundlesPageCssPath, 'utf8')
  const bundleDetailSource = readFileSync(bundleDetailPageCssPath, 'utf8')
  const showcaseSource = readFileSync(showcasePageCssPath, 'utf8')
  const marketingSource = readFileSync(marketingPageCssPath, 'utf8')
  const resultsSource = readFileSync(resultsPageCssPath, 'utf8')
  const accountSource = readFileSync(accountCenterCssPath, 'utf8')

  const aboutShellRule = aboutSource.match(/\.shell\s*\{[\s\S]*?\}/)?.[0] ?? ''
  const aboutHeroOverlayRule = aboutSource.match(/\.heroOverlay\s*\{[\s\S]*?\}/)?.[0] ?? ''
  const aboutSummaryRule = aboutSource.match(/\.summary\s*\{[\s\S]*?\}/)?.[0] ?? ''
  const blogArticleShellRule = blogSource.match(/\.articleShell\s*\{[\s\S]*?\}/)?.[0] ?? ''
  const blogArticleBodyRule = blogSource.match(/\.articleBody\s*\{[\s\S]*?\}/)?.[0] ?? ''
  const blogVideoRule = blogSource.match(/\.videoBlock\s*\{[\s\S]*?\}/)?.[0] ?? ''
  const bundlesShellRule = bundlesSource.match(/\.shell\s*\{[\s\S]*?\}/)?.[0] ?? ''
  const bundlesHeaderRule = bundlesSource.match(/\.headerCopy h1\s*\{[\s\S]*?\}/)?.[0] ?? ''
  const bundlesHeaderTextRule = bundlesSource.match(/\.headerCopy p\s*\{[\s\S]*?\}/)?.[0] ?? ''
  const bundleDetailShellRule = bundleDetailSource.match(/\.shell\s*\{[\s\S]*?\}/)?.[0] ?? ''
  const bundleDetailTitleRule = bundleDetailSource.match(/\.heroCopy h1\s*\{[\s\S]*?\}/)?.[0] ?? ''
  const bundleDetailSummaryRule = bundleDetailSource.match(/\.summary\s*\{[\s\S]*?\}/)?.[0] ?? ''
  const showcaseShellRule = showcaseSource.match(/\.shell\s*\{[\s\S]*?\}/)?.[0] ?? ''
  const showcaseModelGridRule = showcaseSource.match(/\.modelGrid\s*\{[\s\S]*?\}/)?.[0] ?? ''
  const showcaseTitleRule = showcaseSource.match(/\.heroCopy h1\s*\{[\s\S]*?\}/)?.[0] ?? ''
  const showcaseSummaryRule = showcaseSource.match(/\.summary\s*\{[\s\S]*?\}/)?.[0] ?? ''
  const marketingShellRule = marketingSource.match(/\.shell\s*\{[\s\S]*?\}/)?.[0] ?? ''
  const marketingTitleRule = marketingSource.match(/\.heroCopy h1\s*\{[\s\S]*?\}/)?.[0] ?? ''
  const marketingSummaryRule = marketingSource.match(/\.summary\s*\{[\s\S]*?\}/)?.[0] ?? ''
  const resultsShellRule = resultsSource.match(/\.shell\s*\{[\s\S]*?\}/)?.[0] ?? ''
  const resultsTitleRule = resultsSource.match(/\.heroCopy h1,\s*[\s\S]*?\.notFoundPanel h1\s*\{[\s\S]*?\}/)?.[0] ?? ''
  const resultsNotFoundRule = resultsSource.match(/\.notFoundPanel\s*\{[\s\S]*?margin:\s*80px\s+auto\s+0[\s\S]*?\}/)?.[0] ?? ''
  const accountShellRule = accountSource.match(/\.accountShell\s*\{[\s\S]*?\}/)?.[0] ?? ''

  for (const rule of [aboutShellRule, blogArticleShellRule, bundlesShellRule, bundleDetailShellRule, showcaseShellRule, marketingShellRule, resultsShellRule, accountShellRule]) {
    assert.match(rule, /max-width:\s*var\(--content-page-max-width\)/)
    assert.match(rule, /width:\s*100%/)
    assert.doesNotMatch(rule, /max-width:\s*var\(--formal-page-max-width/)
  }

  assert.match(aboutHeroOverlayRule, /max-width:\s*min\(var\(--content-subject-max-width\),\s*calc\(100%\s*-\s*96px\)\)/)
  assert.match(aboutSummaryRule, /max-width:\s*var\(--content-subject-max-width\)/)
  assert.doesNotMatch(aboutHeroOverlayRule, /880px/)
  assert.doesNotMatch(aboutSummaryRule, /860px/)

  assert.match(blogArticleBodyRule, /max-width:\s*min\(100%,\s*var\(--content-subject-max-width\)\)/)
  assert.match(blogVideoRule, /max-width:\s*min\(100%,\s*var\(--content-subject-max-width\)\)/)
  assert.doesNotMatch(blogArticleShellRule, /1260px/)
  assert.doesNotMatch(blogArticleBodyRule, /860px/)

  assert.match(showcaseModelGridRule, /grid-template-columns:\s*repeat\(6,\s*minmax\(0,\s*1fr\)\)/)
  assert.match(showcaseSource, /@media\s*\(max-width:\s*1440px\)\s*\{[\s\S]*?\.modelGrid\s*\{[\s\S]*?repeat\(5,\s*minmax\(0,\s*1fr\)\)/)
  assert.match(showcaseSource, /@media\s*\(max-width:\s*1180px\)\s*\{[\s\S]*?\.modelGrid\s*\{[\s\S]*?repeat\(4,\s*minmax\(0,\s*1fr\)\)/)

  for (const rule of [
    bundlesHeaderRule,
    bundlesHeaderTextRule,
    bundleDetailTitleRule,
    bundleDetailSummaryRule,
    showcaseTitleRule,
    showcaseSummaryRule,
    marketingTitleRule,
    marketingSummaryRule,
    resultsTitleRule,
    resultsNotFoundRule,
  ]) {
    assert.match(rule, /max-width:\s*var\(--content-subject-max-width\)/)
  }
})

test('shared formal templates use content-page width on desktop', () => {
  const formalInfoSource = readFileSync(formalInfoPagePath, 'utf8')
  const workbenchHistorySource = readFileSync(workbenchHistoryPagePath, 'utf8')

  assert.match(formalInfoSource, /max-w-\[var\(--content-page-max-width\)\]/)
  assert.match(formalInfoSource, /px-\[var\(--content-page-gutter\)\]/)
  assert.match(formalInfoSource, /max-w-\[var\(--content-subject-max-width\)\]/)
  assert.doesNotMatch(formalInfoSource, /max-w-\[var\(--public-page-max-width\)\]/)
  assert.match(workbenchHistorySource, /max-w-\[var\(--content-page-max-width\)\]/)
  assert.doesNotMatch(workbenchHistorySource, /max-w-\[var\(--public-page-max-width\)\]/)
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

test('top navigation session data includes backend profile menu stats', () => {
  const source = readFileSync(frontendSessionPath, 'utf8')
  const navFunction = source.match(/export async function getCurrentNavUser\(\) \{[\s\S]*?\n\}/)?.[0] ?? ''

  assert.match(navFunction, /payload\.count/)
  assert.match(navFunction, /collection:\s*["']models["']/)
  assert.match(navFunction, /overrideAccess:\s*false/)
  assert.match(navFunction, /owner:\s*\{\s*equals:\s*userDoc\.id/)
  assert.match(navFunction, /bio:/)
  assert.match(navFunction, /followersCount:/)
  assert.match(navFunction, /followingCount:/)
  assert.match(navFunction, /modelsCount:/)
})
