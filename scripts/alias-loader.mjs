import path from 'node:path'
import fs from 'node:fs'
import { pathToFileURL } from 'node:url'

const rootDir = process.cwd()

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('@/')) {
    const relativePath = specifier.slice(2)
    const candidatePaths = /\.[a-z0-9]+$/i.test(relativePath)
      ? [relativePath]
      : [`${relativePath}.ts`, `${relativePath}.tsx`, path.join(relativePath, 'index.ts'), path.join(relativePath, 'index.tsx')]

    const matchedPath = candidatePaths.find((candidate) => fs.existsSync(path.join(rootDir, 'src', candidate)))
    const targetPath = matchedPath || `${relativePath}.ts`
    const targetURL = pathToFileURL(path.join(rootDir, 'src', targetPath)).href
    return nextResolve(targetURL, context)
  }

  return nextResolve(specifier, context)
}
