import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'

import { getPostLocaleFallbackOrder } from '../src/app/(frontend)/blog/_lib/blogData.ts'

const rootDir = process.cwd()
const blogDataPath = path.join(rootDir, 'src', 'app', '(frontend)', 'blog', '_lib', 'blogData.ts')

test('blog post locale fallback checks the requested locale before alternate locales', () => {
  assert.deepEqual(getPostLocaleFallbackOrder('en'), ['en', 'zh'])
  assert.deepEqual(getPostLocaleFallbackOrder('zh'), ['zh', 'en'])
})

test('blog post fallback remains explicit and keeps Payload localized fallback disabled', () => {
  const dataSource = readFileSync(blogDataPath, 'utf8')

  assert.match(dataSource, /getPostLocaleFallbackOrder/)
  assert.match(dataSource, /for \(const postLocale of getPostLocaleFallbackOrder/)
  assert.match(dataSource, /fallbackLocale:\s*false/)
  assert.doesNotMatch(dataSource, /fallbackLocale:\s*['"]en['"]/)
})
