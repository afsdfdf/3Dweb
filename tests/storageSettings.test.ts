import assert from 'node:assert/strict'
import test from 'node:test'

import { getObjectStorageSettings } from '../src/lib/storageSettings.ts'

test('getObjectStorageSettings reads Supabase Storage runtime config from Storage Settings', async () => {
  const payload = {
    findGlobal: async ({ slug }: { slug: string }) => {
      assert.equal(slug, 'storage-settings')

      return {
        baseURL: '',
        bucket: 'media',
        enabled: true,
        prefix: 'media',
        signedDownloads: true,
      }
    },
  }

  const settings = await getObjectStorageSettings(payload as never)

  assert.equal(settings.source, 'storage-settings')
  assert.equal(settings.enabled, true)
  assert.equal(settings.hasRequiredConfig, true)
  assert.equal(settings.bucket, 'media')
  assert.equal(settings.prefix, 'media')
  assert.equal(settings.baseURL, '')
  assert.equal(settings.signedDownloads, true)
  assert.deepEqual(settings.missingRequiredSettings, [])
})

test('getObjectStorageSettings reports missing Supabase bucket config', async () => {
  const payload = {
    findGlobal: async () => ({
      bucket: '',
      enabled: true,
      prefix: 'media',
      signedDownloads: true,
    }),
  }

  const settings = await getObjectStorageSettings(payload as never)

  assert.equal(settings.hasRequiredConfig, false)
  assert.deepEqual(settings.missingRequiredSettings, ['storage-settings.bucket'])
})
