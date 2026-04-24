import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'

const rootDir = process.cwd()

function resolveExistingTypeScriptPath(basePath) {
  const candidatePaths = /\.[a-z0-9]+$/i.test(basePath)
    ? [basePath]
    : [`${basePath}.ts`, `${basePath}.tsx`, path.join(basePath, 'index.ts'), path.join(basePath, 'index.tsx')]

  return candidatePaths.find((candidate) => fs.existsSync(candidate))
}

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('@/')) {
    const relativePath = specifier.slice(2)
    const matchedPath = resolveExistingTypeScriptPath(path.join(rootDir, 'src', relativePath))
    const targetPath = matchedPath || `${relativePath}.ts`
    const targetURL = pathToFileURL(path.isAbsolute(targetPath) ? targetPath : path.join(rootDir, 'src', targetPath)).href
    return nextResolve(targetURL, context)
  }

  if ((specifier.startsWith('./') || specifier.startsWith('../')) && context.parentURL?.startsWith('file:')) {
    const parentPath = fileURLToPath(context.parentURL)
    const targetPath = resolveExistingTypeScriptPath(path.resolve(path.dirname(parentPath), specifier))

    if (targetPath) {
      const targetURL = pathToFileURL(targetPath).href
      return nextResolve(targetURL, context)
    }
  }

  if (path.isAbsolute(specifier)) {
    const targetPath = resolveExistingTypeScriptPath(specifier)

    if (targetPath) {
      const targetURL = pathToFileURL(targetPath).href
      return nextResolve(targetURL, context)
    }
  }

  if (specifier.startsWith('file:')) {
    const targetPath = resolveExistingTypeScriptPath(fileURLToPath(specifier))

    if (targetPath) {
      const targetURL = pathToFileURL(targetPath).href
      return nextResolve(targetURL, context)
    }
  }

  return nextResolve(specifier, context)
}
