import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'

import {
  getFooterBrandLogoSrc,
  normalizeFooterHref,
} from '../src/app/(frontend)/_components/shell/footerSafety.ts'

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
  assert.match(settingsSource, /name:\s*['"]linkGroups['"][\s\S]*maxRows:\s*4/)
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

test('footer href normalization rejects unsafe and protocol-relative links', () => {
  assert.equal(normalizeFooterHref('/blog'), '/blog')
  assert.equal(normalizeFooterHref('#footer'), '#footer')
  assert.equal(normalizeFooterHref(' https://example.com/posts '), 'https://example.com/posts')
  assert.equal(normalizeFooterHref('mailto:support@example.com'), 'mailto:support@example.com')
  assert.equal(normalizeFooterHref(' //evil.example/path '), null)
  assert.equal(normalizeFooterHref('java\u0000script:alert(1)'), null)
  assert.equal(normalizeFooterHref('javascript:alert(1)'), null)
  assert.equal(normalizeFooterHref('data:text/html,unsafe'), null)
})

test('footer logo source only uses guest-readable media and safe URLs', () => {
  assert.equal(getFooterBrandLogoSrc({ brandLogo: null } as never), '/ui/nav/brand-wordmark.png')
  assert.equal(
    getFooterBrandLogoSrc({
      brandLogo: {
        publicAccess: false,
        purpose: 'asset',
        url: 'https://cdn.example/private.webp',
      },
    } as never),
    '/ui/nav/brand-wordmark.png',
  )
  assert.equal(
    getFooterBrandLogoSrc({
      brandLogo: {
        publicAccess: false,
        purpose: 'preview',
        thumbnailURL: 'https://cdn.example/preview-thumb.webp',
        url: 'https://cdn.example/preview.webp',
      },
    } as never),
    'https://cdn.example/preview-thumb.webp',
  )
  assert.equal(
    getFooterBrandLogoSrc({
      brandLogo: {
        publicAccess: true,
        purpose: 'asset',
        url: '//evil.example/logo.webp',
      },
    } as never),
    '/ui/nav/brand-wordmark.png',
  )
  assert.equal(
    getFooterBrandLogoSrc({
      brandLogo: {
        publicAccess: true,
        purpose: 'asset',
        url: 'https://demo.supabase.co/storage/v1/object/sign/media/private.webp',
      },
    } as never),
    '/ui/nav/brand-wordmark.png',
  )
})
