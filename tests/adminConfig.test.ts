import assert from 'node:assert/strict'
import test from 'node:test'

import { exportAdminConfigDetail, getAdminConfigOverview, validateAdminConfig } from '../src/lib/adminConfig.ts'

const createConfigRequest = (role: 'admin' | 'customer' | 'operator') =>
  ({
    payload: {
      findGlobal: async ({ slug }: { slug: string }) => ({
        effectiveMode: 'runtime-global',
        lastModifiedBy: { id: 1 },
        lastValidatedAt: '2026-04-18T00:00:00.000Z',
        slug,
      }),
      logger: {
        error: () => undefined,
        info: () => undefined,
        warn: () => undefined,
      },
      updateGlobal: async ({ slug, data }: { slug: string; data: Record<string, unknown> }) => ({
        ...data,
        slug,
      }),
    },
    user: {
      id: 1,
      role,
    },
  }) as never

test('staff can read config overview', async () => {
  const result = await getAdminConfigOverview({
    req: createConfigRequest('operator'),
  })

  assert.equal(result.entries.length, 5)
  assert.equal(result.entries[0]?.effectiveMode, 'runtime-global')
})

test('operator cannot validate config', async () => {
  await assert.rejects(
    () =>
      validateAdminConfig({
        req: createConfigRequest('operator'),
        slug: 'security-settings',
      }),
    /Forbidden/,
  )
})

test('admin can validate config', async () => {
  const result = await validateAdminConfig({
    req: createConfigRequest('admin'),
    slug: 'security-settings',
    summary: 'Validated by admin',
  })

  assert.equal((result as any).changeSummary, 'Validated by admin')
  assert.equal((result as any).slug, 'security-settings')
})

test('staff can export config detail', async () => {
  const payload = await exportAdminConfigDetail({
    req: createConfigRequest('operator'),
    slug: 'storage-settings',
  })

  const parsed = JSON.parse(payload)
  assert.equal(parsed.slug, 'storage-settings')
  assert.equal(parsed.effectiveMode, 'runtime-global')
})
