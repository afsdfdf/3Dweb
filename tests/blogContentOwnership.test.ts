import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'

const rootDir = process.cwd()
const formalPagesPath = path.join(rootDir, 'src', 'globals', 'FormalPages.ts')
const blogDefaultsPath = path.join(rootDir, 'src', 'app', '(frontend)', 'blog', '_lib', 'blogPageDefaults.ts')
const blogContentPath = path.join(rootDir, 'src', 'app', '(frontend)', 'blog', '_lib', 'blogPageContent.ts')
const blogDataPath = path.join(rootDir, 'src', 'app', '(frontend)', 'blog', '_lib', 'blogData.ts')
const blogSeoPath = path.join(rootDir, 'src', 'app', '(frontend)', 'blog', '_lib', 'blogSeo.ts')
const blogComponentsPath = path.join(rootDir, 'src', 'app', '(frontend)', 'blog', '_components', 'BlogComponents.tsx')
const blogListPagePath = path.join(rootDir, 'src', 'app', '(frontend)', 'blog', 'page.tsx')
const blogDetailPagePath = path.join(rootDir, 'src', 'app', '(frontend)', 'blog', '[slug]', 'page.tsx')
const blogArticleBodyPath = path.join(rootDir, 'src', 'app', '(frontend)', 'blog', '_components', 'BlogArticleBody.tsx')

test('blog page auxiliary UI copy is owned by formal-pages.blogPage', () => {
  const formalPagesSource = readFileSync(formalPagesPath, 'utf8')
  const defaultsSource = readFileSync(blogDefaultsPath, 'utf8')
  const contentSource = readFileSync(blogContentPath, 'utf8')

  for (const fieldName of ['listingLabels', 'paginationLabels', 'articleLabels', 'articleCTA']) {
    assert.match(formalPagesSource, new RegExp(`name:\\s*['"]${fieldName}['"]`))
    assert.match(defaultsSource, new RegExp(`${fieldName}:\\s*\\{`))
  }

  assert.match(formalPagesSource, /name:\s*['"]all['"]/)
  assert.match(defaultsSource, /all:\s*['"]All['"]/)
  assert.match(contentSource, /resolveBlogListingLabels/)
  assert.match(contentSource, /resolveBlogArticleLabels/)
  assert.match(contentSource, /resolveBlogArticleCTA/)
})

test('blog list and detail render configurable blog page copy instead of local literals', () => {
  const dataSource = readFileSync(blogDataPath, 'utf8')
  const componentsSource = readFileSync(blogComponentsPath, 'utf8')
  const listPageSource = readFileSync(blogListPagePath, 'utf8')
  const detailPageSource = readFileSync(blogDetailPagePath, 'utf8')

  assert.match(dataSource, /categoryLabels\?:\s*BlogPageCategoryLabels/)
  assert.match(dataSource, /readingTimeSuffix\?:\s*string/)
  assert.match(listPageSource, /categoryLabels:\s*blogPage\.categoryLabels/)
  assert.match(detailPageSource, /getBlogPageContent/)
  assert.match(componentsSource, /labels:\s*BlogPageContent\['listingLabels'\]/)
  assert.match(componentsSource, /labels:\s*BlogPageContent\['paginationLabels'\]/)
  assert.match(componentsSource, /labels:\s*BlogPageContent\['articleLabels'\]/)
  assert.match(componentsSource, /cta:\s*BlogPageContent\['articleCTA'\]/)
  assert.match(detailPageSource, /getBlogPostBySlug\(slug,\s*\{/)
  assert.match(detailPageSource, /getBlogPostMetadata\(post,\s*blogPage\)/)

  for (const localLiteral of [
    'Search notes, guides, and releases',
    'The tavern board is being prepared.',
    'Pinned notes',
    'Ready to build your own artifact?',
    'Field footage',
    'More from the board',
    'Related dispatches',
  ]) {
    assert.equal(componentsSource.includes(localLiteral), false)
  }
})

test('blog page rendering uses shared safety helpers for CMS links and article media', () => {
  const contentSource = readFileSync(blogContentPath, 'utf8')
  const componentsSource = readFileSync(blogComponentsPath, 'utf8')
  const articleBodySource = readFileSync(blogArticleBodyPath, 'utf8')

  assert.match(contentSource, /normalizeBlogHref/)
  assert.match(contentSource, /getGuestReadableBlogImageURL/)
  assert.match(componentsSource, /SafeBlogLink/)
  assert.match(articleBodySource, /normalizeBlogHref/)
  assert.match(articleBodySource, /getGuestReadableBlogImageURL/)
  assert.match(articleBodySource, /href\.startsWith\('#'\)/)
  assert.match(articleBodySource, /href\.startsWith\('mailto:'\)/)
  assert.doesNotMatch(articleBodySource, /value\.thumbnailURL[\s\S]{0,160}value\.url/)
})

test('blog shell fetches only site settings and avoids homepage overfetch', () => {
  const componentsSource = readFileSync(blogComponentsPath, 'utf8')
  const listPageSource = readFileSync(blogListPagePath, 'utf8')
  const detailPageSource = readFileSync(blogDetailPagePath, 'utf8')

  assert.match(componentsSource, /getMarketingSiteSettings/)
  assert.match(listPageSource, /getMarketingSiteSettings/)
  assert.match(detailPageSource, /getMarketingSiteSettings/)
  assert.doesNotMatch(listPageSource, /getMarketingSiteData/)
  assert.doesNotMatch(detailPageSource, /getMarketingSiteData/)
})

test('blog post queries prefer the current frontend locale without Payload localized fallback', () => {
  const dataSource = readFileSync(blogDataPath, 'utf8')
  const listPageSource = readFileSync(blogListPagePath, 'utf8')
  const detailPageSource = readFileSync(blogDetailPagePath, 'utf8')

  assert.match(dataSource, /locale\?:\s*Locale/)
  assert.match(dataSource, /getPostLocaleFallbackOrder/)
  assert.match(dataSource, /fallbackLocale:\s*false/)
  assert.match(dataSource, /title:\s*\{\s*exists:\s*true/)
  assert.match(dataSource, /title:\s*\{\s*not_equals:\s*''/)
  assert.match(dataSource, /content:\s*\{\s*exists:\s*true/)
  assert.match(dataSource, /hasPublicLocalizedPostContent/)
  assert.match(dataSource, /decodeURIComponent/)
  assert.doesNotMatch(dataSource, /locale:\s*['"]en['"]/)
  assert.match(listPageSource, /getCurrentLocale/)
  assert.match(listPageSource, /locale,\s*\n/)
  assert.match(detailPageSource, /getCurrentLocale/)
  assert.match(detailPageSource, /locale,/)
})

test('blog admin content group describes whole-page ownership and validates operator links', () => {
  const formalPagesSource = readFileSync(formalPagesPath, 'utf8')

  assert.match(formalPagesSource, /label:\s*['"]Blog page content['"]/)
  assert.match(formalPagesSource, /validateBlogHref/)
  assert.match(formalPagesSource, /Use internal paths like/)
  assert.match(formalPagesSource, /label:\s*['"]Homepage hero and CTAs['"]/)
  assert.match(formalPagesSource, /label:\s*['"]Listing, search, and empty states['"]/)
  assert.match(formalPagesSource, /label:\s*['"]Article detail page['"]/)
  assert.match(formalPagesSource, /label:\s*['"]SEO['"]/)
})
