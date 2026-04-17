import assert from 'node:assert/strict'
import test from 'node:test'

import { getS3StorageSettings, readS3PluginBootstrapSettingsFromEnv } from '../src/lib/s3Settings.ts'

const withEnv = async (overrides: Record<string, string | undefined>, callback: () => Promise<void> | void) => {
  const previous = new Map<string, string | undefined>()

  for (const [key, value] of Object.entries(overrides)) {
    previous.set(key, process.env[key])

    if (typeof value === 'undefined') {
      delete process.env[key]
    } else {
      process.env[key] = value
    }
  }

  try {
    await callback()
  } finally {
    for (const [key, value] of previous.entries()) {
      if (typeof value === 'undefined') {
        delete process.env[key]
      } else {
        process.env[key] = value
      }
    }
  }
}

test('getS3StorageSettings reads runtime non-sensitive config from Storage Settings only', async () => {
  await withEnv(
    {
      AWS_ACCESS_KEY_ID: 'runtime-access-key',
      AWS_SECRET_ACCESS_KEY: 'runtime-secret-key',
      S3_BUCKET: 'env-bucket-should-not-be-used',
      S3_REGION: 'eu-west-1',
      S3_PREFIX: 'env-prefix',
      S3_CDN_URL: 'https://env-cdn.example.com',
      S3_SIGNED_DOWNLOADS: 'false',
    },
    async () => {
      const calls: string[] = []
      const payload = {
        findGlobal: async ({ slug }: { slug: string }) => {
          calls.push(slug)

          if (slug === 'storage-settings') {
            return {
              baseURL: 'https://cdn.example-assets.com',
              bucket: 'global-bucket',
              enabled: true,
              prefix: 'global-prefix',
              region: 'ap-southeast-1',
              signedDownloads: true,
            }
          }

          throw new Error(`Unexpected global read: ${slug}`)
        },
      }

      const settings = await getS3StorageSettings(payload as never)

      assert.deepEqual(calls, ['storage-settings'])
      assert.equal(settings.source, 'storage-settings')
      assert.equal(settings.enabled, true)
      assert.equal(settings.hasRequiredConfig, true)
      assert.equal(settings.bucket, 'global-bucket')
      assert.equal(settings.region, 'ap-southeast-1')
      assert.equal(settings.prefix, 'global-prefix')
      assert.equal(settings.baseURL, 'https://cdn.example-assets.com')
      assert.equal(settings.signedDownloads, true)
      assert.equal(settings.accessKeyId, 'runtime-access-key')
      assert.equal(settings.secretAccessKey, 'runtime-secret-key')
    },
  )
})

test('getS3StorageSettings does not fall back to legacy or env non-sensitive values when Storage Settings is missing', async () => {
  await withEnv(
    {
      AWS_ACCESS_KEY_ID: 'runtime-access-key',
      AWS_SECRET_ACCESS_KEY: 'runtime-secret-key',
      S3_BUCKET: 'legacy-env-bucket',
      S3_REGION: 'eu-west-1',
      S3_PREFIX: 'legacy-prefix',
      S3_CDN_URL: 'https://legacy-cdn.example.com',
      S3_SIGNED_DOWNLOADS: 'false',
    },
    async () => {
      const payload = {
        findGlobal: async () => null,
      }

      const settings = await getS3StorageSettings(payload as never)

      assert.equal(settings.enabled, false)
      assert.equal(settings.hasRequiredConfig, true)
      assert.equal(settings.bucket, '')
      assert.equal(settings.region, 'us-east-1')
      assert.equal(settings.prefix, 'media')
      assert.equal(settings.baseURL, '')
      assert.equal(settings.signedDownloads, true)
      assert.deepEqual(settings.missingRequiredSettings, [])
    },
  )
})

test('readS3PluginBootstrapSettingsFromEnv throws a clear error for partial bootstrap env config', async () => {
  await withEnv(
    {
      AWS_ACCESS_KEY_ID: 'bootstrap-access-key',
      AWS_SECRET_ACCESS_KEY: undefined,
      S3_BUCKET: 'bootstrap-bucket',
      S3_REGION: 'us-east-1',
    },
    () => {
      assert.throws(
        () => readS3PluginBootstrapSettingsFromEnv(),
        /Incomplete S3 plugin bootstrap env configuration\. Missing: AWS_SECRET_ACCESS_KEY\./,
      )
    },
  )
})

test('readS3PluginBootstrapSettingsFromEnv keeps build-time bootstrap support when env config is complete', async () => {
  await withEnv(
    {
      AWS_ACCESS_KEY_ID: 'bootstrap-access-key',
      AWS_SECRET_ACCESS_KEY: 'bootstrap-secret-key',
      S3_BUCKET: 'bootstrap-bucket',
      S3_REGION: 'ap-southeast-1',
      S3_PREFIX: 'bootstrap-prefix',
      S3_CDN_URL: 'https://bootstrap-cdn.example.com',
      S3_SIGNED_DOWNLOADS: 'false',
    },
    () => {
      const settings = readS3PluginBootstrapSettingsFromEnv()

      assert.equal(settings.source, 'env-bootstrap')
      assert.equal(settings.enabled, true)
      assert.equal(settings.bucket, 'bootstrap-bucket')
      assert.equal(settings.region, 'ap-southeast-1')
      assert.equal(settings.prefix, 'bootstrap-prefix')
      assert.equal(settings.baseURL, 'https://bootstrap-cdn.example.com')
      assert.equal(settings.signedDownloads, false)
    },
  )
})
