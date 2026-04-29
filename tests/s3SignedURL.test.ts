import assert from 'node:assert/strict'
import test from 'node:test'

import { getMediaAccessURL } from '../src/lib/s3SignedURL.ts'

const createPayloadMock = (signedDownloads = true) => ({
  findGlobal: async () => ({
    baseURL: '',
    bucket: 'media',
    enabled: true,
    prefix: 'media',
    region: 'us-east-1',
    signedDownloads,
  }),
  logger: {
    warn: () => undefined,
  },
})

test('getMediaAccessURL leaves Payload media file paths on the Payload media route', async () => {
  const accessURL = await getMediaAccessURL({
    payload: createPayloadMock(true) as never,
    url: '/api/media/file/Adventurer.glb',
  })

  assert.equal(accessURL, '/api/media/file/Adventurer.glb')
})

test('getMediaAccessURL leaves non-Supabase absolute URLs unchanged', async () => {
  const originalURL = 'https://assets.example.com/imports/model.glb'
  const accessURL = await getMediaAccessURL({
    payload: createPayloadMock(true) as never,
    url: originalURL,
  })

  assert.equal(accessURL, originalURL)
})

test('getMediaAccessURL rejects unsupported relative paths', async () => {
  const accessURL = await getMediaAccessURL({
    payload: createPayloadMock(true) as never,
    url: '/not-a-media-route/model.glb',
  })

  assert.equal(accessURL, null)
})
