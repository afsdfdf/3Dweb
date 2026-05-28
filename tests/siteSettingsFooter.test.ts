import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'

const rootDir = process.cwd()
const footerBarPath = path.join(rootDir, 'src', 'app', '(frontend)', '_components', 'shell', 'FooterBar.tsx')
const marketingContentPath = path.join(rootDir, 'src', 'app', '(frontend)', '_lib', 'marketing-content.ts')
const siteSettingsPath = path.join(rootDir, 'src', 'globals', 'SiteSettings.ts')
const footerPreviewPath = path.join(rootDir, 'src', 'components', 'admin', 'FooterPreview.tsx')

test('site settings owns every visible public footer field', () => {
  const settingsSource = readFileSync(siteSettingsPath, 'utf8')
  const marketingSource = readFileSync(marketingContentPath, 'utf8')

  for (const fieldName of ['brandLogo', 'brandLogoAlt', 'brandSummary', 'linkGroups']) {
    assert.match(settingsSource, new RegExp(`name:\\s*['"]${fieldName}['"]`))
    assert.match(marketingSource, new RegExp(`${fieldName}[:?]`))
  }

  assert.match(settingsSource, /relationTo:\s*['"]media['"]/)
  assert.match(settingsSource, /Field:\s*['"]\/components\/admin\/FooterPreview['"]/)
})

test('public footer renders backend brand content instead of a fixed-only footer', () => {
  const source = readFileSync(footerBarPath, 'utf8')

  assert.match(source, /footerContent\.brandLogo/)
  assert.match(source, /footerContent\.brandLogoAlt/)
  assert.match(source, /footerContent\.brandSummary/)
  assert.match(source, /siteDescription/)
  assert.match(source, /getFooterBrandLogoSrc/)
  assert.doesNotMatch(source, /<img alt="Thorns Tavern"[^>]+src="\/ui\/nav\/brand-wordmark\.png"/)
})

test('admin footer preview component is registered and reads live form fields', () => {
  assert.equal(existsSync(footerPreviewPath), true)

  const source = readFileSync(footerPreviewPath, 'utf8')
  assert.match(source, /'use client'/)
  assert.match(source, /useFormFields/)
  assert.match(source, /footer\.brandSummary/)
  assert.match(source, /footer\.linkGroups/)
  assert.match(source, /supportEmail/)
})
