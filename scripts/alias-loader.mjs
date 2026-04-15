import path from 'node:path'
import { pathToFileURL } from 'node:url'

const rootDir = process.cwd()

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('@/')) {
    const relativePath = specifier.slice(2)
    const resolvedPath = /\.[a-z0-9]+$/i.test(relativePath) ? relativePath : `${relativePath}.ts`
    const targetURL = pathToFileURL(path.join(rootDir, 'src', resolvedPath)).href
    return nextResolve(targetURL, context)
  }

  return nextResolve(specifier, context)
}

