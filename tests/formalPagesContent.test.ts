import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'

const rootDir = process.cwd()
const formalPagesGlobalPath = path.join(rootDir, 'src', 'globals', 'FormalPages.ts')
const formalPageContentPath = path.join(rootDir, 'src', 'app', '(frontend)', '_lib', 'formal-page-content.ts')
const payloadConfigPath = path.join(rootDir, 'src', 'payload.config.ts')

test('formal page copy is editable through the formal-pages global', () => {
  assert.equal(existsSync(formalPagesGlobalPath), true)

  const globalSource = readFileSync(formalPagesGlobalPath, 'utf8')
  const configSource = readFileSync(payloadConfigPath, 'utf8')

  assert.match(globalSource, /slug:\s*['"]formal-pages['"]/)
  assert.match(globalSource, /infoPages/)
  assert.match(globalSource, /marketingPages/)
  assert.match(globalSource, /read:\s*\(\)\s*=>\s*true/)
  assert.match(globalSource, /update:\s*isStaff/)
  assert.match(globalSource, /anchorId:\s*section\.id/)
  assert.match(globalSource, /bullets:\s*section\.bullets\?\.map\(\(label\)\s*=>\s*\(\{\s*label\s*\}\)\)/)
  assert.match(configSource, /FormalPages/)
  assert.match(configSource, /HomepageContent,\s*FormalPages/)
})

test('formal frontend routes resolve CMS content with source fallbacks', () => {
  const resolverSource = readFileSync(formalPageContentPath, 'utf8')

  assert.match(resolverSource, /payload\.findGlobal\(\{[\s\S]*slug:\s*['"]formal-pages['"]/)
  assert.match(resolverSource, /overrideAccess:\s*false/)
  assert.match(resolverSource, /return resolveFormalPage\(fallback,\s*page\)/)
  assert.match(resolverSource, /return resolveMarketingPage\(fallback,\s*page\)/)

  for (const route of ['about', 'contact', 'privacy-policy', 'refund-policy', 'shipping-policy']) {
    const source = readFileSync(path.join(rootDir, 'src', 'app', '(frontend)', route, 'page.tsx'), 'utf8')
    assert.match(source, /getFormalPageContent/)
  }

  for (const route of ['features', 'solutions', 'resources', 'developers', 'pricing', 'showcase']) {
    const source = readFileSync(path.join(rootDir, 'src', 'app', '(frontend)', route, 'page.tsx'), 'utf8')
    assert.match(source, /getMarketingPageContent/)
  }
})
