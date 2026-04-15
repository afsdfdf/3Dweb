import { readdir } from 'node:fs/promises'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { pathToFileURL } from 'node:url'

const rootDir = process.cwd()
const testsDir = path.join(rootDir, 'tests')

async function collectTestFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name)

      if (entry.isDirectory()) {
        return collectTestFiles(fullPath)
      }

      return entry.name.endsWith('.test.ts') ? [fullPath] : []
    }),
  )

  return files.flat()
}

const testFiles = await collectTestFiles(testsDir)

if (testFiles.length === 0) {
  console.error('No unit test files were found in tests/.')
  process.exit(1)
}

const child = spawn(
  process.execPath,
  ['--experimental-loader', pathToFileURL(path.join(rootDir, 'scripts', 'alias-loader.mjs')).href, '--experimental-strip-types', '--test', ...testFiles],
  {
  cwd: rootDir,
  stdio: 'inherit',
  },
)

child.on('exit', (code) => {
  process.exit(code ?? 1)
})
