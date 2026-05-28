import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'

import { getBlogPostContentLocale } from '../src/app/(frontend)/blog/_lib/blogData.ts'

const rootDir = process.cwd()
const blogDataPath = path.join(rootDir, 'src', 'app', '(frontend)', 'blog', '_lib', 'blogData.ts')

test('blog post content always reads the default English locale', () => {
  assert.equal(getBlogPostContentLocale(), 'en')
})

test('blog post queries do not switch content records with the frontend locale', () => {
  const dataSource = readFileSync(blogDataPath, 'utf8')

  assert.match(dataSource, /const blogPostContentLocale:\s*Locale\s*=\s*['"]en['"]/)
  assert.match(dataSource, /locale:\s*blogPostContentLocale/)
  assert.match(dataSource, /fallbackLocale:\s*false/)
  assert.doesNotMatch(dataSource, /fallbackLocale:\s*['"]en['"]/)
  assert.doesNotMatch(dataSource, /getPostLocaleFallbackOrder/)
  assert.doesNotMatch(dataSource, /for \(const postLocale/)
})
