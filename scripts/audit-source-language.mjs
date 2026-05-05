import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'

const root = process.cwd()
const sourceRoot = path.join(root, 'src')
const extensions = new Set(['.js', '.jsx', '.ts', '.tsx'])

const ignoredParts = [
  `${path.sep}src${path.sep}payload-types.ts`,
  `${path.sep}src${path.sep}migrations${path.sep}`,
  `${path.sep}src${path.sep}app${path.sep}(frontend)${path.sep}test${path.sep}`,
  `${path.sep}src${path.sep}app${path.sep}(frontend)${path.sep}test-bundles${path.sep}`,
  `${path.sep}src${path.sep}app${path.sep}(frontend)${path.sep}_components${path.sep}GenerateForm.tsx`,
  `${path.sep}src${path.sep}components${path.sep}ui-lab${path.sep}personal-center-legacy${path.sep}`,
]

const allowedChineseParts = [
  `${path.sep}src${path.sep}i18n${path.sep}`,
]

const chinesePattern = /[\u4e00-\u9fff]/
const mojibakePattern = /[\uFFFD]|(?:鍏|鐨|绠|鈥|€|锛|涓)/

function isIgnored(filePath) {
  return ignoredParts.some((part) => filePath.includes(part))
}

function allowsChinese(filePath) {
  return allowedChineseParts.some((part) => filePath.includes(part))
}

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name)
    if (entry.isDirectory()) {
      files.push(...await listFiles(fullPath))
      continue
    }

    if (entry.isFile() && extensions.has(path.extname(entry.name))) {
      files.push(fullPath)
    }
  }

  return files
}

const failures = []
const files = await listFiles(sourceRoot)

for (const filePath of files) {
  if (isIgnored(filePath)) continue

  const text = await readFile(filePath, 'utf8')
  const lines = text.split(/\r?\n/)

  lines.forEach((line, index) => {
    if (!allowsChinese(filePath) && chinesePattern.test(line)) {
      failures.push({
        filePath,
        line: index + 1,
        reason: 'Chinese text outside an explicit I18N resource',
      })
    }

    if (mojibakePattern.test(line)) {
      failures.push({
        filePath,
        line: index + 1,
        reason: 'Potential mojibake or replacement character',
      })
    }
  })
}

if (failures.length > 0) {
  console.error('Source language audit failed:')
  for (const failure of failures.slice(0, 80)) {
    console.error(`- ${path.relative(root, failure.filePath)}:${failure.line} ${failure.reason}`)
  }
  if (failures.length > 80) {
    console.error(`...and ${failures.length - 80} more`)
  }
  process.exit(1)
}

console.log('Source language audit passed.')
