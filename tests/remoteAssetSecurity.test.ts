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

test('remote asset security allows configured storage base host', async () => {
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

test('remote asset security always allows canonical and Supabase storage hosts', async () => {
  const previousAppUrl = process.env.NEXT_PUBLIC_APP_URL
  const previousSupabaseUrl = process.env.SUPABASE_URL
  process.env.NEXT_PUBLIC_APP_URL = 'https://app.example.com'
  process.env.SUPABASE_URL = 'https://demo-project.supabase.co'

  try {
    const hosts = await getAllowedRemoteAssetHosts(
      createPayloadMock({
        baseURL: 'https://cdn.example-assets.com',
      }) as never,
    )

    assert.equal(hosts.includes('app.example.com'), true)
    assert.equal(hosts.includes('cdn.example-assets.com'), true)
    assert.equal(hosts.includes('demo-project.supabase.co'), true)
  } finally {
    if (typeof previousAppUrl === 'undefined') {
      delete process.env.NEXT_PUBLIC_APP_URL
    } else {
      process.env.NEXT_PUBLIC_APP_URL = previousAppUrl
    }

    if (typeof previousSupabaseUrl === 'undefined') {
      delete process.env.SUPABASE_URL
    } else {
      process.env.SUPABASE_URL = previousSupabaseUrl
    }
  }
})

test('remote asset security only trusts internal Payload media paths', async () => {
  const payload = createPayloadMock() as never

  assert.equal(await isAllowedRemoteAssetURL({ payload, url: '/api/media/file/model.glb' }), true)
  // Non-media internal routes must not be fetchable.
  assert.equal(await isAllowedRemoteAssetURL({ payload, url: '/admin' }), false)
  assert.equal(await isAllowedRemoteAssetURL({ payload, url: '/api/account/auth/login' }), false)
  // Path traversal cannot escape the media prefix.
  assert.equal(await isAllowedRemoteAssetURL({ payload, url: '/api/media/../admin' }), false)
  // Protocol-relative and backslash values normalize to arbitrary hosts.
  assert.equal(await isAllowedRemoteAssetURL({ payload, url: '//evil.example.net/model.glb' }), false)
  assert.equal(await isAllowedRemoteAssetURL({ payload, url: '/\\evil.example.net/model.glb' }), false)
})

test('remote asset security rejects non-http(s) schemes and bare-TLD allowlist entries', async () => {
  const previousAllowlist = process.env.AI_REMOTE_ASSET_ALLOWLIST
  process.env.AI_REMOTE_ASSET_ALLOWLIST = 'com'

  try {
    const payload = createPayloadMock() as never
    // A bare TLD must not match arbitrary hosts.
    assert.equal(await isAllowedRemoteAssetURL({ payload, url: 'https://evil.com/model.glb' }), false)
    // Dangerous schemes are rejected outright.
    assert.equal(await isAllowedRemoteAssetURL({ payload, url: 'file:///etc/passwd' }), false)
    assert.equal(await isAllowedRemoteAssetURL({ payload, url: 'data:text/plain,hello' }), false)
  } finally {
    process.env.AI_REMOTE_ASSET_ALLOWLIST = previousAllowlist
  }
})

test('remote asset security always allows official Meshy result asset host', async () => {
  const previousKey = process.env.MESHY_API_KEY
  delete process.env.MESHY_API_KEY

  try {
    const hosts = await getAllowedRemoteAssetHosts(createPayloadMock() as never)
    const allowed = await isAllowedRemoteAssetURL({
      payload: createPayloadMock() as never,
      url: 'https://assets.meshy.ai/result/model.glb',
    })

    assert.equal(hosts.includes('assets.meshy.ai'), true)
    assert.equal(allowed, true)
  } finally {
    if (typeof previousKey === 'undefined') {
      delete process.env.MESHY_API_KEY
    } else {
      process.env.MESHY_API_KEY = previousKey
    }
  }
})
