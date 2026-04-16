import test from 'node:test'
import assert from 'node:assert/strict'

import { isAllowedRemoteAssetURL } from '../src/lib/remoteAssetSecurity.ts'

const createPayloadMock = () => ({
  findGlobal: async () => ({
    baseURL: 'https://cdn.example-assets.com',
    bucket: 'demo-bucket',
    enabled: true,
    prefix: 'media',
    region: 'us-east-1',
    signedDownloads: true,
  }),
})

test('remote asset security allows configured CDN host', async () => {
  const previousAllowlist = process.env.AI_REMOTE_ASSET_ALLOWLIST
  process.env.AI_REMOTE_ASSET_ALLOWLIST = ''

  try {
    const allowed = await isAllowedRemoteAssetURL({
      payload: createPayloadMock() as never,
      url: 'https://cdn.example-assets.com/models/model.glb',
    })

    assert.equal(allowed, true)
  } finally {
    process.env.AI_REMOTE_ASSET_ALLOWLIST = previousAllowlist
  }
})

test('remote asset security rejects unknown hosts', async () => {
  const previousAllowlist = process.env.AI_REMOTE_ASSET_ALLOWLIST
  process.env.AI_REMOTE_ASSET_ALLOWLIST = 'trusted-assets.example.com'

  try {
    const allowed = await isAllowedRemoteAssetURL({
      payload: createPayloadMock() as never,
      url: 'https://evil.example.net/models/model.glb',
    })

    assert.equal(allowed, false)
  } finally {
    process.env.AI_REMOTE_ASSET_ALLOWLIST = previousAllowlist
  }
})
