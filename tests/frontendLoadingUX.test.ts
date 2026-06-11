import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'

import assert from 'node:assert/strict'

const rootDir = process.cwd()

function collectFrontendLoadingFiles(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  const files: string[] = []

  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      files.push(...collectFrontendLoadingFiles(entryPath))
      continue
    }

    if (entry.isFile() && entry.name === 'loading.tsx') {
      files.push(path.relative(rootDir, entryPath).replaceAll(path.sep, '/'))
    }
  }

  return files.sort()
}

test('frontend routes do not define page-switch loading fallbacks', () => {
  const frontendRoot = path.join(rootDir, 'src/app/(frontend)')
  const loadingFiles = collectFrontendLoadingFiles(frontendRoot)

  assert.deepEqual(
    loadingFiles,
    [],
    'Do not add frontend loading.tsx route fallbacks unless the page-switch loading animation is explicitly requested.',
  )
})
