import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'

const rootDir = process.cwd()
const fallbackAssetPath = path.join(rootDir, 'public', 'home-test-assets', 'images', 'home-hero-header-background.jpg')
const frameSourcePath = path.join(rootDir, 'src', 'components', 'ui-lab', 'home-test', 'frame12877.tsx')
const frameCssPath = path.join(rootDir, 'src', 'components', 'ui-lab', 'home-test', 'frame12877.module.css')
const homeDataPath = path.join(rootDir, 'src', 'app', '(frontend)', '_home', 'homeData.ts')
const homePagePath = path.join(rootDir, 'src', 'app', '(frontend)', 'page.tsx')
const homepageContentPath = path.join(rootDir, 'src', 'globals', 'HomepageContent.ts')

test('homepage hero header background has a static fallback and editable CMS override', () => {
  assert.equal(existsSync(fallbackAssetPath), true)

  const frameSource = readFileSync(frameSourcePath, 'utf8')
  const frameCss = readFileSync(frameCssPath, 'utf8')
  const homeDataSource = readFileSync(homeDataPath, 'utf8')
  const homePageSource = readFileSync(homePagePath, 'utf8')
  const homepageContentSource = readFileSync(homepageContentPath, 'utf8')

  assert.match(frameSource, /heroHeaderBackgroundSrc/)
  assert.match(frameSource, /--home-hero-header-background/)
  assert.match(frameCss, /--home-hero-header-background/)
  assert.match(frameCss, /home-hero-header-background\.jpg/)
  assert.match(homePageSource, /heroHeaderBackgroundSrc=\{data\.heroHeaderBackgroundSrc\}/)
  assert.match(homeDataSource, /heroHeaderBackgroundSrc/)
  assert.match(homeDataSource, /homepageContent\.hero\?\.headerBackground/)
  assert.match(homepageContentSource, /name:\s*['"]headerBackground['"]/)
  assert.match(homepageContentSource, /relationTo:\s*['"]media['"]/)
  assert.match(homepageContentSource, /buildGuestReadableMediaWhere\(\)/)
})
