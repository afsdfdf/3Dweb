import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const homePagePath = 'src/app/(frontend)/page.tsx'
const testHomePagePath = 'src/app/(frontend)/test-home/page.tsx'
const testHomeCssPath = 'src/app/(frontend)/test-home/testHomePage.module.css'
const heroComponentPath = 'src/components/ui-lab/home-hero/HomeHero.tsx'
const heroCssPath = 'src/components/ui-lab/home-hero/HomeHero.module.css'

test('homepage hero uses semantic HomeHero instead of Pixso export', async () => {
  const [homePage, testHomePage, testHomeCss, heroComponent, heroCss] = await Promise.all([
    readFile(homePagePath, 'utf8'),
    readFile(testHomePagePath, 'utf8'),
    readFile(testHomeCssPath, 'utf8'),
    readFile(heroComponentPath, 'utf8'),
    readFile(heroCssPath, 'utf8'),
  ])

  assert.match(homePage, /HomeHero/)
  assert.match(testHomePage, /HomeHero/)
  assert.doesNotMatch(homePage, /Frame12877/)
  assert.doesNotMatch(testHomePage, /Frame12877/)
  assert.doesNotMatch(testHomeCss, /Pixso-/)

  assert.match(heroComponent, /export function HomeHero/)
  assert.match(heroComponent, /GenerateCtaButton/)
  assert.match(heroComponent, /saveWorkbenchDraft/)
  assert.match(heroComponent, /aria-label="Responsive home hero"/)
  assert.match(heroComponent, /className=\{styles\.heroSubtitleRow\}/)
  assert.match(heroComponent, /className=\{styles\.heroSubtitleLine\}/)
  assert.match(heroComponent, /className=\{styles\.heroSubtitle\}/)
  assert.match(heroComponent, /ideas to Full-color Custom Miniatures/)
  assert.match(heroCss, /--hero-art-scale:\s*var\(--hero-scale\)/)
  const heroRule = heroCss.match(/\.hero\s*\{([\s\S]*?)\n\}/)?.[1] ?? ''
  const stageRule = heroCss.match(/\.stage\s*\{([\s\S]*?)\n\}/)?.[1] ?? ''
  assert.match(heroRule, /--hero-scale:\s*calc\(100vw\s*\/\s*1920px\)/)
  assert.doesNotMatch(heroRule, /--hero-scale:\s*min\(1,\s*calc\(100vw\s*\/\s*1920px\)\)/)
  assert.match(heroRule, /height:\s*calc\(989px\s*\*\s*var\(--hero-scale\)\)/)
  assert.doesNotMatch(heroRule, /--home-hero-background|home-hero-header-background/)
  assert.doesNotMatch(heroRule, /100%\s+100%\s+no-repeat/)
  assert.doesNotMatch(stageRule, /max-width:\s*1920px/)
  assert.match(stageRule, /width:\s*100%/)
  assert.match(stageRule, /height:\s*100%/)
  assert.match(stageRule, /--home-hero-background/)
  assert.match(stageRule, /background-size:\s*100%\s+100%/)
  assert.match(heroCss, /\.hero::after\s*\{[\s\S]*linear-gradient\(180deg,\s*rgba\(24,\s*24,\s*24,\s*0\)\s+0%,\s*#181818\s+100%\)/)
  assert.match(heroCss, /\.heroSubtitleRow\s*\{[\s\S]*top:\s*calc\(370px\s*\*\s*var\(--hero-art-scale\)\)/)
  assert.match(heroCss, /@media\s*\(max-width:\s*820px\)\s*\{[\s\S]*\.hero\s*\{[\s\S]*height:\s*clamp\(430px,\s*107vw,\s*520px\)/)
  assert.match(heroCss, /@media\s*\(max-width:\s*820px\)\s*\{[\s\S]*\.stage\s*\{[\s\S]*background-position:\s*center\s+top[\s\S]*background-size:\s*auto\s+100%/)
  assert.match(heroCss, /@media\s*\(max-width:\s*820px\)\s*\{[\s\S]*\.heroSubtitleRow\s*\{[\s\S]*top:\s*clamp\(164px,\s*39\.5vw,\s*188px\)/)
  assert.match(heroCss, /@media\s*\(max-width:\s*820px\)\s*\{[\s\S]*\.heroSubtitleRow\s*\{[\s\S]*transform:\s*translateX\(-50%\)\s+scale\(clamp\(0\.46,\s*calc\(100vw\s*\/\s*820px\),\s*0\.6\)\)/)
  assert.match(heroCss, /\.generateMount\s*\{[\s\S]*top:\s*calc\(762px\s*\*\s*var\(--hero-art-scale\)\)/)
  assert.match(heroCss, /@media\s*\(max-width:\s*820px\)\s*\{[\s\S]*\.generateMount\s*\{[\s\S]*top:\s*clamp\(232px,\s*56vw,\s*268px\)[\s\S]*width:\s*clamp\(134px,\s*35vw,\s*168px\)/)
  assert.doesNotMatch(heroComponent, /getWorkbenchUploadAccept|uploadWorkbenchSourceImage|validateWorkbenchSourceImage/)
  assert.doesNotMatch(heroComponent, /Add Image|Upload Image|Go get your 3D model/)
  assert.doesNotMatch(heroComponent, /Pixso-/)
  assert.doesNotMatch(heroCss, /Pixso-/)
})
