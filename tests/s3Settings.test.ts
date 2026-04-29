import assert from 'node:assert/strict'
import test from 'node:test'

import { getS3StorageSettings } from '../src/lib/s3Settings.ts'

test('getS3StorageSettings reads Supabase Storage runtime config from Storage Settings', async () => {
  const payload = {
    findGlobal: async ({ slug }: { slug: string }) => {
      assert.equal(slug, 'storage-settings')

      return {
        baseURL: '',
        bucket: 'media',
        enabled: true,
        prefix: 'media',
        region: 'us-east-1',
        signedDownloads: true,
      }
    },
  }

  const settings = await getS3StorageSettings(payload as never)

  assert.equal(settings.source, 'storage-settings')
  assert.equal(settings.enabled, true)
  assert.equal(settings.hasRequiredConfig, true)
  assert.equal(settings.bucket, 'media')
  assert.equal(settings.region, 'us-east-1')
  assert.equal(settings.prefix, 'media')
  assert.equal(settings.baseURL, '')
  assert.equal(settings.signedDownloads, true)
  assert.deepEqual(settings.missingRequiredSettings, [])
})

test('getS3StorageSettings reports missing Supabase bucket config', async () => {
  const payload = {
    findGlobal: async () => ({
      bucket: '',
      enabled: true,
      prefix: 'media',
      region: 'us-east-1',
      signedDownloads: true,
    }),
  }

  const settings = await getS3StorageSettings(payload as never)

  assert.equal(settings.hasRequiredConfig, false)
  assert.deepEqual(settings.missingRequiredSettings, ['storage-settings.bucket'])
})
