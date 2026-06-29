import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'

const rootDir = process.cwd()
const workbenchPagePath = path.join(rootDir, 'src', 'app', '(frontend)', 'workbench', 'page.tsx')
const workbenchClientPath = path.join(rootDir, 'src', 'app', '(frontend)', 'workbench', 'WorkbenchClient.tsx')
const workbenchDataPath = path.join(rootDir, 'src', 'app', '(frontend)', 'workbench', '_lib', 'workbenchData.ts')

test('workbench model and reference query params initialize the active model viewer', () => {
  const pageSource = readFileSync(workbenchPagePath, 'utf8')
  const clientSource = readFileSync(workbenchClientPath, 'utf8')
  const dataSource = readFileSync(workbenchDataPath, 'utf8')

  assert.match(pageSource, /searchParams:\s*Promise<\{/)
  assert.match(pageSource, /searchParams\.get\("reference"\)/)
  assert.match(pageSource, /searchParams\.get\("model"\)/)
  assert.match(pageSource, /getWorkbenchModelById\(user, requestedModelId\)/)
  assert.match(pageSource, /initialSelectedModelId=\{requestedModelCard\?\.id \?\? null\}/)
  assert.match(dataSource, /export async function getWorkbenchModelById/)
  assert.match(dataSource, /findByID\(\{[\s\S]*?collection: "models"[\s\S]*?overrideAccess: false/)
  assert.match(clientSource, /initialSelectedModelId\?: null \| number/)
  assert.match(clientSource, /libraryCards\.find\(\(card\) => card\.id === initialSelectedModelId\)/)
  assert.match(clientSource, /selectedInitialModelCard\?\.modelSrc \?\? libraryCards\[0\]\?\.modelSrc \?\? null/)
})
