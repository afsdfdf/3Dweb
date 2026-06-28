import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'

const rootDir = process.cwd()
const authModalStagePath = path.join(rootDir, 'src', 'components', 'auth', 'AuthModalStage.tsx')
const authModalProviderPath = path.join(rootDir, 'src', 'components', 'auth', 'AuthModalProvider.tsx')
const authFlowCardPath = path.join(rootDir, 'src', 'components', 'auth', 'AuthFlowCard.tsx')
const authModalStageCssPath = path.join(rootDir, 'src', 'components', 'auth', 'AuthModalStage.module.css')
const authPasswordEyeHiddenPath = path.join(rootDir, 'public', 'ui-lab', 'auth', 'password-eye-hidden@2x.png')
const authPasswordEyeVisiblePath = path.join(rootDir, 'public', 'ui-lab', 'auth', 'password-eye-visible@2x.png')
const resetPasswordFormPath = path.join(rootDir, 'src', 'app', '(frontend)', '_components', 'ResetPasswordForm.tsx')
const loginPagePath = path.join(rootDir, 'src', 'app', '(frontend)', 'login', 'page.tsx')
const homePageCssPath = path.join(rootDir, 'src', 'app', '(frontend)', 'test-home', 'testHomePage.module.css')
const stickyTopNavigationCssPaths = [
  path.join(rootDir, 'src', 'app', '(frontend)', 'about', 'page.module.css'),
  path.join(rootDir, 'src', 'app', '(frontend)', 'blog', 'page.module.css'),
  path.join(rootDir, 'src', 'app', '(frontend)', 'bundles', 'page.module.css'),
  path.join(rootDir, 'src', 'app', '(frontend)', 'bundles', '[slug]', 'page.module.css'),
  path.join(rootDir, 'src', 'app', '(frontend)', 'showcase', 'page.module.css'),
  path.join(rootDir, 'src', 'app', '(frontend)', '_components', 'MarketingPage.module.css'),
]
const stickyTopNavigationStagePaths = [
  path.join(rootDir, 'src', 'app', '(frontend)', 'about', 'page.tsx'),
  path.join(rootDir, 'src', 'app', '(frontend)', 'blog', '_components', 'BlogComponents.tsx'),
  path.join(rootDir, 'src', 'app', '(frontend)', 'bundles', 'page.tsx'),
  path.join(rootDir, 'src', 'app', '(frontend)', 'bundles', '[slug]', 'page.tsx'),
  path.join(rootDir, 'src', 'app', '(frontend)', 'showcase', 'page.tsx'),
  path.join(rootDir, 'src', 'app', '(frontend)', '_components', 'MarketingPage.tsx'),
]
const stickyBoundTopNavigationCssPaths = [
  path.join(rootDir, 'src', 'app', '(frontend)', 'assets-preview', 'page.module.css'),
  path.join(rootDir, 'src', 'app', '(frontend)', 'assets-test', 'assetsTestPage.module.css'),
]
const modelDetailNativePath = path.join(rootDir, 'src', 'app', '(frontend)', 'model-detail', 'ModelDetailNative.tsx')
const modelDetailCssPath = path.join(rootDir, 'src', 'app', '(frontend)', 'model-detail', 'page.module.css')
const modelDetailDataPath = path.join(rootDir, 'src', 'app', '(frontend)', 'model-detail', '_lib', 'modelDetailData.ts')
const modelDetailPagePath = path.join(rootDir, 'src', 'app', '(frontend)', 'model-detail', 'page.tsx')
const topNavigationPath = path.join(rootDir, 'src', 'components', 'ui-lab', 'top-navigation', 'top-navigation.tsx')
const modelDetailHeaderPath = path.join(rootDir, 'src', 'app', '(frontend)', 'model-detail', 'ModelDetailHeader.tsx')
const workbenchClientPath = path.join(rootDir, 'src', 'app', '(frontend)', 'workbench', 'WorkbenchClient.tsx')
const workbenchCssPath = path.join(rootDir, 'src', 'app', '(frontend)', 'workbench', 'page.module.css')
const siteShellPath = path.join(rootDir, 'src', 'app', '(frontend)', '_components', 'SiteShell.tsx')

function readPngDimensions(sourcePath: string) {
  const buffer = readFileSync(sourcePath)

  assert.equal(buffer.toString('ascii', 1, 4), 'PNG')
  return {
    height: buffer.readUInt32BE(20),
    width: buffer.readUInt32BE(16),
  }
}

test('AuthModalStage uses the canonical provider import to avoid duplicate auth modal contexts', () => {
  const source = readFileSync(authModalStagePath, 'utf8')

  assert.match(source, /@\/components\/auth\/AuthModalProvider/)
  assert.doesNotMatch(source, /from ['"]\.\/AuthModalProvider['"]/)
})

test('useAuthModal falls back to compatibility auth routes instead of crashing the page', () => {
  const source = readFileSync(authModalProviderPath, 'utf8')

  assert.match(source, /openAuthCompatibilityRoute/)
  assert.match(source, /Falling back to auth routes/)
  assert.doesNotMatch(source, /throw new Error\(['"]useAuthModal must be used within AuthModalProvider['"]\)/)
})

test('AuthModalProvider closes stale modal state when navigating between pages', () => {
  const source = readFileSync(authModalProviderPath, 'utf8')

  assert.match(source, /usePathname/)
  assert.match(source, /lastLocationKeyRef/)
  assert.match(source, /previousLocationKey !== null && previousLocationKey !== locationKey/)
  assert.match(source, /closeAuthModal\(\)/)
})

test('TopNavigation route links dismiss the auth modal before navigation', () => {
  const source = readFileSync(topNavigationPath, 'utf8')

  assert.match(source, /const \{ closeAuthModal \} = useAuthModal\(\)/)
  assert.match(source, /onClick=\{closeAuthModal\}/)
})

test('AuthFlowCard reads backend auth settings and requests registration codes', () => {
  const source = readFileSync(authFlowCardPath, 'utf8')

  assert.match(source, /\/api\/account\/auth\/settings/)
  assert.match(source, /registrationVerificationMode/)
  assert.match(source, /\/api\/account\/auth\/send-register-code/)
  assert.match(source, /verificationCode: requiresVerificationCode \? verificationCode : undefined/)
})

test('AuthFlowCard auto signs in and closes the modal after verified registration', () => {
  const source = readFileSync(authFlowCardPath, 'utf8')

  assert.match(source, /const completeLogin = async \(\) =>/)
  assert.match(source, /\/api\/account\/auth\/login/)
  assert.match(source, /registerJson\?\.loginReady === true/)
  assert.match(source, /Registration complete\. Signing you in\.\.\./)
  assert.match(source, /onSuccess\(\)/)
})

test('AuthFlowCard keeps the forgot password success state in the auth modal flow', () => {
  const source = readFileSync(authFlowCardPath, 'utf8')

  assert.match(source, /\/api\/account\/auth\/forgot-password/)
  assert.match(source, /setMode\('forgot-success'\)/)
  assert.match(source, /Check Your Email/)
  assert.match(source, /password reset link/)
})

test('AuthFlowCard requires terms agreement before login or registration', () => {
  const source = readFileSync(authFlowCardPath, 'utf8')

  assert.match(source, /const termsAgreementMessage = /)
  assert.equal([...source.matchAll(/throw new Error\(termsAgreementMessage\)/g)].length, 2)
  assert.match(source, /if \(isLogin\) \{[\s\S]*if \(!agreed\) \{[\s\S]*throw new Error\(termsAgreementMessage\)/)
  assert.match(source, /styles\.termsError/)
})

test('AuthFlowCard password visibility button uses high-density eye assets', () => {
  const source = readFileSync(authFlowCardPath, 'utf8')

  assert.match(source, /password-eye-hidden@2x\.png/)
  assert.match(source, /password-eye-visible@2x\.png/)
  assert.match(source, /<img[\s\S]*className=\{styles\.eyeIcon\}/)
  assert.deepEqual(readPngDimensions(authPasswordEyeHiddenPath), { height: 48, width: 48 })
  assert.deepEqual(readPngDimensions(authPasswordEyeVisiblePath), { height: 48, width: 48 })
})

test('auth redirects reject protocol-relative external paths', () => {
  const providerSource = readFileSync(authModalProviderPath, 'utf8')
  const cardSource = readFileSync(authFlowCardPath, 'utf8')
  const loginSource = readFileSync(loginPagePath, 'utf8')

  assert.match(providerSource, /isSafeInternalRedirect/)
  assert.match(providerSource, /getSafeInternalRedirect/)
  assert.match(cardSource, /getSafeInternalRedirect/)
  assert.match(loginSource, /getSafeInternalRedirect/)
  assert.doesNotMatch(providerSource, /redirectTo\?\.startsWith\('\/'\)/)
})

test('ResetPasswordForm delegates to the shared account auth reset flow', () => {
  const resetPasswordFormSource = readFileSync(resetPasswordFormPath, 'utf8')
  const authFlowCardSource = readFileSync(authFlowCardPath, 'utf8')

  assert.match(resetPasswordFormSource, /AuthFlowCard/)
  assert.match(resetPasswordFormSource, /initialMode="reset"/)
  assert.match(resetPasswordFormSource, /initialResetToken=\{initialToken \|\| ''\}/)
  assert.match(authFlowCardSource, /\/api\/account\/auth\/reset-password/)
  assert.doesNotMatch(authFlowCardSource, /\/api\/users\/reset-password/)
  assert.match(authFlowCardSource, /credentials: 'include'/)
  assert.match(authFlowCardSource, /setMode\('login'\)/)
})

test('Auth modal overlay remains below the fixed top navigation layer', () => {
  const source = readFileSync(authModalStageCssPath, 'utf8')

  assert.match(source, /z-index:\s*50;/)
  assert.doesNotMatch(source, /z-index:\s*70;/)
})

test('Unclipped AuthModalStage keeps the auth dialog centered in the viewport', () => {
  const componentSource = readFileSync(authModalStagePath, 'utf8')
  const cssSource = readFileSync(authModalStageCssPath, 'utf8')

  assert.match(componentSource, /clipContent \? '' : styles\.overlayViewportFixed/)
  assert.match(cssSource, /\.overlayViewportFixed\s*\{[\s\S]*position:\s*fixed;/)
})

test('Model Detail keeps legacy button resets away from the shared top navigation', () => {
  const source = readFileSync(modelDetailCssPath, 'utf8')

  assert.match(source, /\.pageRoot :global\(\.uc-detail button\)/)
  assert.doesNotMatch(source, /\.pageRoot :global\(button\)/)
})

test('Model Detail mounts the shared auth modal stage for top navigation login', () => {
  const source = readFileSync(modelDetailNativePath, 'utf8')

  assert.match(source, /@\/components\/auth\/AuthModalStage/)
  assert.match(source, /<AuthModalStage fitViewport topOffset=\{60\}>/)
})

test('Model Detail reads owner-private models through access-controlled Local API', () => {
  const pageSource = readFileSync(modelDetailPagePath, 'utf8')
  const dataSource = readFileSync(modelDetailDataPath, 'utf8')
  const nativeSource = readFileSync(modelDetailNativePath, 'utf8')

  assert.match(pageSource, /currentUser:\s*user/)
  assert.match(dataSource, /overrideAccess:\s*false/)
  assert.match(dataSource, /\.\.\.\(currentUser \? \{ user: currentUser \} : \{\}\)/)
  assert.match(dataSource, /commentsEnabled = model\.visibility === "public"/)
  assert.doesNotMatch(dataSource, /fallbackPreview/)
  assert.doesNotMatch(dataSource, /fallbackSidePreview/)
  assert.doesNotMatch(dataSource, /email\.split/)
  assert.doesNotMatch(dataSource, /email:\s*true/)
  assert.match(dataSource, /if \(!previewURL\) return null/)
  assert.match(nativeSource, /side-empty-state/)
  assert.doesNotMatch(nativeSource, /detail-side-img-1\.png/)
  assert.match(nativeSource, /Comments are available after this model is public\./)
})

test('Page-level top navigation positioning wins over shared TopNavigation base styles', () => {
  const homeSource = readFileSync(homePageCssPath, 'utf8')
  const workbenchSource = readFileSync(workbenchCssPath, 'utf8')
  const modelDetailSource = readFileSync(modelDetailCssPath, 'utf8')
  const siteShellSource = readFileSync(siteShellPath, 'utf8')

  assert.match(homeSource, /\.boundTopNavigation(?:\.boundTopNavigation)?\s*\{[^}]*position:\s*fixed;/)
  for (const cssPath of stickyTopNavigationCssPaths) {
    const source = readFileSync(cssPath, 'utf8')
    assert.match(source, /\.page\s*\{[\s\S]*overflow-x:\s*clip;/, cssPath)
    assert.doesNotMatch(source, /\.page\s*\{[\s\S]*overflow-y:\s*auto;/, cssPath)
    assert.match(source, /\.topNavigation\.topNavigation\s*\{[^}]*position:\s*sticky;/, cssPath)
  }
  for (const pagePath of stickyTopNavigationStagePaths) {
    const source = readFileSync(pagePath, 'utf8')
    assert.match(source, /<AuthModalStage\s+clipContent=\{false\}/, pagePath)
  }
  for (const cssPath of stickyBoundTopNavigationCssPaths) {
    const source = readFileSync(cssPath, 'utf8')
    assert.match(source, /\.page\s*\{[\s\S]*overflow-x:\s*clip;/, cssPath)
    assert.doesNotMatch(source, /\.page\s*\{[\s\S]*overflow-y:\s*auto;/, cssPath)
    assert.match(source, /\.boundTopNavigation\.boundTopNavigation\s*\{[^}]*position:\s*sticky;/, cssPath)
  }
  assert.match(workbenchSource, /@media \(max-width:\s*980px\)\s*\{[\s\S]*\.page\s*\{[\s\S]*overflow-x:\s*clip;/)
  assert.doesNotMatch(workbenchSource, /@media \(max-width:\s*980px\)\s*\{[\s\S]*\.page\s*\{[\s\S]*overflow-y:\s*auto;/)
  assert.match(workbenchSource, /\.mobileHeader\s*\{[\s\S]*position:\s*sticky;[\s\S]*top:\s*0;/)
  assert.match(siteShellSource, /className="min-h-screen overflow-x-clip bg-\[#181818\] text-\[#ededee\]"/)
  assert.match(siteShellSource, /className="!sticky !top-0 z-\[60\]"/)
  assert.match(siteShellSource, /className="fixed inset-0 overflow-y-auto bg-\[#181818\] text-\[#ededee\] lg:hidden"/)
  assert.match(workbenchSource, /\.stageViewport\s*>\s*\.boundTopNavigation\s*\{[\s\S]*position:\s*absolute;/)
  assert.match(modelDetailSource, /\.scaleViewport\s*>\s*\.boundTopNavigation\s*\{[\s\S]*position:\s*absolute;/)
})

test('height-scaled desktop stages keep top navigation on the viewport scale', () => {
  const workbenchSource = readFileSync(workbenchClientPath, 'utf8')
  const modelDetailNativeSource = readFileSync(modelDetailNativePath, 'utf8')
  const modelDetailHeaderSource = readFileSync(modelDetailHeaderPath, 'utf8')

  assert.match(workbenchSource, /<div className=\{styles\.stageViewport\}>\s*<TopNavigation[\s\S]*fitViewport[\s\S]*<section className=\{styles\.stage\}/)
  assert.doesNotMatch(workbenchSource, /<section className=\{styles\.stage\}[\s\S]*<TopNavigation/)
  assert.match(modelDetailNativeSource, /<div className=\{styles\.scaleViewport\}>\s*<ModelDetailHeader[\s\S]*navUser=\{navUser\}[\s\S]*navigationPromotion=\{navigationPromotion\}[\s\S]*\/>[\s\S]*<div className=\{styles\.scaleStage\}>/)
  assert.match(modelDetailHeaderSource, /<TopNavigation[\s\S]*fitViewport/)
})
