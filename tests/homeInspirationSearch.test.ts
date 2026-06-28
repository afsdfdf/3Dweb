import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'

const rootDir = process.cwd()
const homePagePath = path.join(rootDir, 'src', 'app', '(frontend)', 'page.tsx')
const inspirationSearchBoxPath = path.join(
  rootDir,
  'src',
  'components',
  'ui-lab',
  'home-test',
  'inspiration-search-box.tsx',
)
const inspirationSearchBoxCssPath = path.join(
  rootDir,
  'src',
  'components',
  'ui-lab',
  'home-test',
  'inspiration-search-box.module.css',
)

function extractRule(source: string, selector: string) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = source.match(new RegExp(`${escapedSelector}\\s*\\{([\\s\\S]*?)\\}`))
  assert.ok(match, `Missing CSS rule for ${selector}`)
  return match[1]
}

function extractPxDeclaration(rule: string, property: string) {
  const match = rule.match(new RegExp(`${property}:\\s*(\\d+)px`))
  assert.ok(match, `Missing ${property} px declaration`)
  return Number(match[1])
}

function extractInlinePadding(rule: string) {
  const match = rule.match(/padding:\s*0\s+(\d+)(?:px)?(?:\s+0\s+(\d+)px)?/)
  assert.ok(match, 'Missing horizontal input padding declaration')
  const right = Number(match[1])
  return {
    left: Number(match[2] ?? match[1]),
    right,
  }
}

test('homepage inspiration search and pager return users to the results section after refresh', () => {
  const homePageSource = readFileSync(homePagePath, 'utf8')
  const searchBoxSource = readFileSync(inspirationSearchBoxPath, 'utf8')

  assert.match(homePageSource, /id="inspiration"/)
  assert.match(searchBoxSource, /const INSPIRATION_SECTION_ID = "inspiration"/)
  assert.match(searchBoxSource, /function normalizeBasePath/)
  assert.match(searchBoxSource, /const normalizedBasePath = normalizeBasePath\(basePath\)/)
  assert.match(searchBoxSource, /return `\$\{normalizedBasePath\}\$\{search \? `\?\$\{search\}` : ""\}#\$\{INSPIRATION_SECTION_ID\}`/)
  assert.match(searchBoxSource, /action=\{`\$\{normalizeBasePath\(basePath\)\}#\$\{INSPIRATION_SECTION_ID\}`\}/)
})

test('homepage inspiration search resets results when an active query is cleared', () => {
  const searchBoxSource = readFileSync(inspirationSearchBoxPath, 'utf8')

  assert.match(searchBoxSource, /"use client"/)
  assert.match(searchBoxSource, /useRouter/)
  assert.match(searchBoxSource, /const \[searchText, setSearchText\] = useState\(query\)/)
  assert.match(searchBoxSource, /query\.trim\(\)\.length === 0/)
  assert.match(searchBoxSource, /searchText\.trim\(\)\.length > 0/)
  assert.match(searchBoxSource, /router\.replace\(`\$\{normalizeBasePath\(basePath\)\}#\$\{INSPIRATION_SECTION_ID\}`\)/)
  assert.match(searchBoxSource, /value=\{searchText\}/)
  assert.match(searchBoxSource, /onChange=\{\(event\) => setSearchText\(event\.target\.value\)\}/)
  assert.match(searchBoxSource, /placeholder="Please enter keyword"/)
})

test('homepage inspiration search uses design-slice icons at fixed sizes', () => {
  const searchBoxSource = readFileSync(inspirationSearchBoxPath, 'utf8')
  const cssSource = readFileSync(inspirationSearchBoxCssPath, 'utf8')

  assert.ok(existsSync(path.join(rootDir, 'public', 'ui-lab', 'home-test', 'search-icon-16.png')))
  assert.ok(existsSync(path.join(rootDir, 'public', 'ui-lab', 'home-test', 'pager-arrow-left-14@2x.png')))
  assert.ok(existsSync(path.join(rootDir, 'public', 'ui-lab', 'home-test', 'pager-arrow-right-14@2x.png')))
  assert.match(searchBoxSource, /className=\{\[styles\.pagerIcon,\s*styles\.pagerIconPrevious\]\.join\(" "\)\}/)
  assert.match(searchBoxSource, /className=\{\[styles\.pagerIcon,\s*styles\.pagerIconNext\]\.join\(" "\)\}/)
  assert.doesNotMatch(searchBoxSource, /\{"<"\}/)
  assert.doesNotMatch(searchBoxSource, /\{">"\}/)
  assert.match(cssSource, /\.icon\s*\{[\s\S]*background-image:\s*url\("\/ui-lab\/home-test\/search-icon-16\.png"\)[\s\S]*background-size:\s*16px\s+16px[\s\S]*height:\s*16px[\s\S]*width:\s*16px/)
  assert.match(cssSource, /\.pagerIcon\s*\{[\s\S]*background-size:\s*14px\s+14px[\s\S]*height:\s*14px[\s\S]*width:\s*14px/)
  assert.match(cssSource, /\.pagerIconPrevious\s*\{[\s\S]*background-image:\s*url\("\/ui-lab\/home-test\/pager-arrow-left-14@2x\.png"\)/)
  assert.match(cssSource, /\.pagerIconNext\s*\{[\s\S]*background-image:\s*url\("\/ui-lab\/home-test\/pager-arrow-right-14@2x\.png"\)/)
  assert.match(searchBoxSource, /<span className=\{styles\.buttonLabel\}>Search<\/span>/)
  assert.match(searchBoxSource, /<span className=\{styles\.pageNumber\}>\{item\}<\/span>/)
  assert.match(cssSource, /--control-font-family:\s*PingFangSC,\s*"PingFang SC",\s*"Microsoft YaHei",\s*"Noto Sans CJK SC",\s*Arial,\s*sans-serif/)
  assert.match(cssSource, /\.buttonLabel\s*\{[\s\S]*font-family:\s*var\(--control-font-family\)[\s\S]*font-size:\s*12px[\s\S]*font-weight:\s*500[\s\S]*height:\s*18px[\s\S]*line-height:\s*18px[\s\S]*text-align:\s*left[\s\S]*width:\s*40px/)
  assert.match(cssSource, /\.pageNumber\s*\{[\s\S]*font-family:\s*var\(--control-font-family\)[\s\S]*font-size:\s*12px[\s\S]*font-weight:\s*500[\s\S]*height:\s*18px[\s\S]*line-height:\s*18px[\s\S]*text-align:\s*left[\s\S]*width:\s*8px/)
  assert.match(cssSource, /\.input\s*\{[\s\S]*font-family:\s*var\(--control-font-family\)[\s\S]*font-size:\s*12px[\s\S]*font-weight:\s*500[\s\S]*line-height:\s*18px[\s\S]*padding:\s*0\s+0\s+0\s+4px/)
  assert.match(cssSource, /\.pager\s*\{[\s\S]*gap:\s*8px[\s\S]*margin-left:\s*24px/)
  assert.match(cssSource, /\.pageGroup\s*\{[\s\S]*gap:\s*8px/)
  assert.match(cssSource, /\.pageSize\s*\{[\s\S]*font-family:\s*var\(--control-font-family\)[\s\S]*font-size:\s*12px[\s\S]*font-weight:\s*500[\s\S]*margin-left:\s*24px/)
  assert.match(cssSource, /\.pageSize span:first-child\s*\{[\s\S]*font-family:\s*var\(--control-font-family\)[\s\S]*font-size:\s*12px[\s\S]*font-weight:\s*500[\s\S]*height:\s*18px[\s\S]*line-height:\s*18px/)
})
test('homepage inspiration search leaves enough room for the full keyword placeholder', () => {
  const cssSource = readFileSync(inspirationSearchBoxCssPath, 'utf8')
  const inputShellRule = extractRule(cssSource, '.inputShell')
  const iconRule = extractRule(cssSource, '.icon')
  const inputRule = extractRule(cssSource, '.input')

  const inputShellWidth = extractPxDeclaration(inputShellRule, 'width')
  const iconWidth = extractPxDeclaration(iconRule, 'width')
  const iconLeftMargin = extractPxDeclaration(iconRule, 'margin-left')
  const padding = extractInlinePadding(inputRule)
  const borderWidth = 2
  const availableTextWidth = inputShellWidth - borderWidth - iconLeftMargin - iconWidth - padding.left - padding.right

  assert.ok(availableTextWidth >= 133, `Expected at least 133px for placeholder text, got ${availableTextWidth}px`)
})
