import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'

const rootDir = process.cwd()
const authModalStagePath = path.join(rootDir, 'src', 'components', 'auth', 'AuthModalStage.tsx')
const authModalProviderPath = path.join(rootDir, 'src', 'components', 'auth', 'AuthModalProvider.tsx')
const authFlowCardPath = path.join(rootDir, 'src', 'components', 'auth', 'AuthFlowCard.tsx')
const authModalStageCssPath = path.join(rootDir, 'src', 'components', 'auth', 'AuthModalStage.module.css')
const homePageCssPath = path.join(rootDir, 'src', 'app', '(frontend)', '_home', 'homePage.module.css')
const modelDetailNativePath = path.join(rootDir, 'src', 'app', '(frontend)', 'model-detail', 'ModelDetailNative.tsx')
const modelDetailCssPath = path.join(rootDir, 'src', 'app', '(frontend)', 'model-detail', 'page.module.css')
const topNavigationPath = path.join(rootDir, 'src', 'components', 'ui-lab', 'top-navigation', 'top-navigation.tsx')
const workbenchCssPath = path.join(rootDir, 'src', 'app', '(frontend)', 'workbench', 'page.module.css')

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

test('Auth modal overlay remains below the fixed top navigation layer', () => {
  const source = readFileSync(authModalStageCssPath, 'utf8')

  assert.match(source, /z-index:\s*50;/)
  assert.doesNotMatch(source, /z-index:\s*70;/)
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

test('Page-level top navigation positioning wins over shared TopNavigation base styles', () => {
  const homeSource = readFileSync(homePageCssPath, 'utf8')
  const workbenchSource = readFileSync(workbenchCssPath, 'utf8')
  const modelDetailSource = readFileSync(modelDetailCssPath, 'utf8')

  assert.match(homeSource, /\.stage\s*>\s*\.boundTopNavigation\s*\{[\s\S]*position:\s*absolute;/)
  assert.match(workbenchSource, /\.stage\s*>\s*\.boundTopNavigation\s*\{[\s\S]*position:\s*absolute;/)
  assert.match(modelDetailSource, /\.scaleStage\s*>\s*\.boundTopNavigation\s*\{[\s\S]*position:\s*absolute;/)
})
