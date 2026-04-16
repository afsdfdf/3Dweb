import test from 'node:test'
import assert from 'node:assert/strict'

import { getMediaAccessURL } from '../src/lib/s3SignedURL.ts'

const createPayloadMock = (signedDownloads = true) => ({
  findGlobal: async () => ({
    baseURL: 'https://cdn.example-assets.com',
    bucket: 'demo-bucket',
    credentialsSource: 'environment',
    enabled: true,
    prefix: 'media',
    region: 'us-east-1',
    signedDownloads,
  }),
})

test('getMediaAccessURL converts CDN URL to a signed S3 URL when signed downloads are enabled', async () => {
  const previousAccessKey = process.env.AWS_ACCESS_KEY_ID
  const previousSecretKey = process.env.AWS_SECRET_ACCESS_KEY

  process.env.AWS_ACCESS_KEY_ID = 'test-access-key'
  process.env.AWS_SECRET_ACCESS_KEY = 'test-secret-key'

  try {
    const accessURL = await getMediaAccessURL({
      payload: createPayloadMock(true) as never,
      url: 'https://cdn.example-assets.com/imports/model.glb',
    })

    assert.equal(typeof accessURL, 'string')
    assert.match(String(accessURL), /^https:\/\/demo-bucket\.s3\.us-east-1\.amazonaws\.com\//)
  } finally {
    process.env.AWS_ACCESS_KEY_ID = previousAccessKey
    process.env.AWS_SECRET_ACCESS_KEY = previousSecretKey
  }
})

test('getMediaAccessURL keeps CDN URL unchanged when signed downloads are disabled', async () => {
  const previousAccessKey = process.env.AWS_ACCESS_KEY_ID
  const previousSecretKey = process.env.AWS_SECRET_ACCESS_KEY

  process.env.AWS_ACCESS_KEY_ID = 'test-access-key'
  process.env.AWS_SECRET_ACCESS_KEY = 'test-secret-key'

  try {
    const originalURL = 'https://cdn.example-assets.com/imports/model.glb'
    const accessURL = await getMediaAccessURL({
      payload: createPayloadMock(false) as never,
      url: originalURL,
    })

    assert.equal(accessURL, originalURL)
  } finally {
    process.env.AWS_ACCESS_KEY_ID = previousAccessKey
    process.env.AWS_SECRET_ACCESS_KEY = previousSecretKey
  }
})
