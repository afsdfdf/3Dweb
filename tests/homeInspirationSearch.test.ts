import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
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

test('homepage inspiration search and pager return users to the results section after refresh', () => {
  const homePageSource = readFileSync(homePagePath, 'utf8')
  const searchBoxSource = readFileSync(inspirationSearchBoxPath, 'utf8')

  assert.match(homePageSource, /id="inspiration"/)
  assert.match(searchBoxSource, /const INSPIRATION_SECTION_ID = "inspiration"/)
  assert.match(searchBoxSource, /return `\/\$\{search \? `\?\$\{search\}` : ""\}#\$\{INSPIRATION_SECTION_ID\}`/)
  assert.match(searchBoxSource, /action=\{`\/#\$\{INSPIRATION_SECTION_ID\}`\}/)
})

test('homepage inspiration search resets results when an active query is cleared', () => {
  const searchBoxSource = readFileSync(inspirationSearchBoxPath, 'utf8')

  assert.match(searchBoxSource, /"use client"/)
  assert.match(searchBoxSource, /useRouter/)
  assert.match(searchBoxSource, /const \[searchText, setSearchText\] = useState\(query\)/)
  assert.match(searchBoxSource, /query\.trim\(\)\.length === 0/)
  assert.match(searchBoxSource, /searchText\.trim\(\)\.length > 0/)
  assert.match(searchBoxSource, /router\.replace\(`\/#\$\{INSPIRATION_SECTION_ID\}`\)/)
  assert.match(searchBoxSource, /value=\{searchText\}/)
  assert.match(searchBoxSource, /onChange=\{\(event\) => setSearchText\(event\.target\.value\)\}/)
})
