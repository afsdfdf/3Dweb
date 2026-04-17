import assert from 'node:assert/strict'
import test from 'node:test'

import { getAllowedRemoteAssetHosts, isAllowedRemoteAssetURL } from '../src/lib/remoteAssetSecurity.ts'

const createPayloadMock = (options?: {
  allowedRemoteAssetHosts?: Array<{ host: string }>
  baseURL?: string
}) => ({
  findGlobal: async ({ slug }: { slug: string }) => {
    if (slug === 'storage-settings') {
      return {
        baseURL: options?.baseURL ?? 'https://cdn.example-assets.com',
        bucket: 'demo-bucket',
        enabled: true,
        prefix: 'media',
        region: 'us-east-1',
        signedDownloads: true,
      }
    }

    if (slug === 'security-settings') {
      return {
        allowedRemoteAssetHosts: options?.allowedRemoteAssetHosts ?? [],
      }
    }

    throw new Error(`Unexpected global slug: ${slug}`)
  },
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

test('remote asset security prefers Security Settings hosts over legacy env allowlist', async () => {
  const previousAllowlist = process.env.AI_REMOTE_ASSET_ALLOWLIST
  process.env.AI_REMOTE_ASSET_ALLOWLIST = 'legacy-assets.example.com'

  try {
    const payload = createPayloadMock({
      allowedRemoteAssetHosts: [{ host: 'approved-assets.example.com' }],
    })

    const allowedFromGlobal = await isAllowedRemoteAssetURL({
      payload: payload as never,
      url: 'https://approved-assets.example.com/models/model.glb',
    })
    const deniedLegacyHost = await isAllowedRemoteAssetURL({
      payload: payload as never,
      url: 'https://legacy-assets.example.com/models/model.glb',
    })

    assert.equal(allowedFromGlobal, true)
    assert.equal(deniedLegacyHost, false)
  } finally {
    process.env.AI_REMOTE_ASSET_ALLOWLIST = previousAllowlist
  }
})

test('remote asset security falls back to env allowlist when Security Settings is empty', async () => {
  const previousAllowlist = process.env.AI_REMOTE_ASSET_ALLOWLIST
  process.env.AI_REMOTE_ASSET_ALLOWLIST = 'trusted-assets.example.com'

  try {
    const allowed = await isAllowedRemoteAssetURL({
      payload: createPayloadMock() as never,
      url: 'https://trusted-assets.example.com/models/model.glb',
    })

    assert.equal(allowed, true)
  } finally {
    process.env.AI_REMOTE_ASSET_ALLOWLIST = previousAllowlist
  }
})

test('remote asset security always allows canonical and storage derived hosts', async () => {
  const previousAppUrl = process.env.NEXT_PUBLIC_APP_URL
  process.env.NEXT_PUBLIC_APP_URL = 'https://app.example.com'

  try {
    const hosts = await getAllowedRemoteAssetHosts(
      createPayloadMock({
        baseURL: 'https://cdn.example-assets.com',
      }) as never,
    )

    assert.equal(hosts.includes('app.example.com'), true)
    assert.equal(hosts.includes('cdn.example-assets.com'), true)
    assert.equal(hosts.includes('demo-bucket.s3.us-east-1.amazonaws.com'), true)
  } finally {
    process.env.NEXT_PUBLIC_APP_URL = previousAppUrl
  }
})
