import assert from 'node:assert/strict'
import test from 'node:test'

process.env.POSTGRES_URL ||= 'postgres://user:pass@localhost:5432/db'

const createRequestMock = () => ({
  payload: {
    findGlobal: async ({ slug }: { slug: string }) => {
      if (slug === 'storage-settings') {
        return {
          baseURL: 'https://cdn.example-assets.com',
          bucket: 'demo-bucket',
          enabled: true,
          prefix: 'media',
          region: 'us-east-1',
          signedDownloads: true,
        }
      }

      if (slug === 'security-settings') {
        return {
          allowedRemoteAssetHosts: [{ host: 'cdn.example-assets.com' }],
        }
      }

      return null
    },
    create: async ({ data }: { data: Record<string, unknown> }) => ({
      id: 100,
      ...data,
    }),
    logger: {
      warn: () => undefined,
    },
  },
})

test('resolveModelFormatAssets uploads model, thumbnail, and texture assets to user-scoped Supabase paths', async () => {
  const previousFetch = globalThis.fetch
  const uploads: Array<{ contentType: string; path: string }> = []
  const { __setAITaskFlowStorageTestHooks, resolveModelFormatAssets } = await import('../src/lib/aiTaskFlow.ts')

  __setAITaskFlowStorageTestHooks({
    getRuntimeStorageSettings: async () => ({
      baseUrl: null,
      bucket: 'demo-bucket',
      enabled: true,
      prefix: 'media',
      provider: 'supabase-storage',
      signedDownloads: true,
    }),
    uploadToSupabaseStorage: async ({ contentType, path }) => {
      uploads.push({ contentType, path })
      return {
        path,
        publicUrl: `https://supabase.example/storage/v1/object/public/demo-bucket/${path}`,
      }
    },
  })

  globalThis.fetch = async (url) => {
    const value = String(url)
    const contentType = value.endsWith('.png') ? 'image/png' : value.endsWith('.jpg') ? 'image/jpeg' : 'model/gltf-binary'

    return new Response(new Uint8Array([1, 2, 3, 4]), {
      headers: {
        'content-type': contentType,
      },
      status: 200,
    })
  }

  try {
    const assets = await resolveModelFormatAssets({
      generationPricingDownloadCredits: 5,
      payloadData: {
        modelUrls: {
          glb: 'https://cdn.example-assets.com/models/demo.glb',
        },
        textureUrls: {
          albedo: 'https://cdn.example-assets.com/textures/albedo.jpg',
        },
        thumbnailUrl: 'https://cdn.example-assets.com/thumbs/demo.png',
      },
      req: createRequestMock() as never,
      taskCode: 'TASK-123',
      taskId: 10,
      userId: 7,
    })

    assert.equal(assets.formats.length, 1)
    assert.equal(assets.formats[0]?.format, 'glb')
    assert.equal(assets.modelUrls.glb?.startsWith('https://supabase.example/'), true)
    assert.equal(assets.textureUrls.albedo?.startsWith('https://supabase.example/'), true)
    assert.equal(assets.thumbnailUrl?.startsWith('https://supabase.example/'), true)
    assert.deepEqual(
      uploads.map((item) => item.path),
      [
        'media/generated/user-7/task-123/task-123-glb.glb',
        'media/generated/user-7/task-123/textures/task-123-albedo.jpg',
        'media/generated/user-7/task-123/task-123-thumbnail.png',
      ],
    )
  } finally {
    globalThis.fetch = previousFetch
    __setAITaskFlowStorageTestHooks(null)
  }
})

test('resolveModelFormatAssets falls back to allowed remote URLs when Supabase upload fails', async () => {
  const previousFetch = globalThis.fetch
  const { __setAITaskFlowStorageTestHooks, resolveModelFormatAssets } = await import('../src/lib/aiTaskFlow.ts')

  __setAITaskFlowStorageTestHooks({
    getRuntimeStorageSettings: async () => ({
      baseUrl: null,
      bucket: 'demo-bucket',
      enabled: true,
      prefix: 'media',
      provider: 'supabase-storage',
      signedDownloads: true,
    }),
    uploadToSupabaseStorage: async () => {
      throw new Error('upload failed')
    },
  })

  globalThis.fetch = async () =>
    new Response(new Uint8Array([1, 2, 3, 4]), {
      headers: {
        'content-type': 'model/gltf-binary',
      },
      status: 200,
    })

  try {
    const assets = await resolveModelFormatAssets({
      generationPricingDownloadCredits: 5,
      payloadData: {
        modelUrls: {
          glb: 'https://cdn.example-assets.com/models/demo.glb',
        },
      },
      req: createRequestMock() as never,
      taskCode: 'TASK-456',
      taskId: 11,
      userId: 7,
    })

    assert.equal(assets.formats.length, 1)
    assert.equal(assets.formats[0]?.format, 'glb')
    assert.equal(assets.formats[0]?.file, null)
    assert.equal(assets.modelUrls.glb, 'https://cdn.example-assets.com/models/demo.glb')
  } finally {
    globalThis.fetch = previousFetch
    __setAITaskFlowStorageTestHooks(null)
  }
})

test('resolveModelFormatAssets rejects Meshy-style strict ingestion when Supabase upload fails', async () => {
  const previousFetch = globalThis.fetch
  const { __setAITaskFlowStorageTestHooks, resolveModelFormatAssets } = await import('../src/lib/aiTaskFlow.ts')

  __setAITaskFlowStorageTestHooks({
    getRuntimeStorageSettings: async () => ({
      baseUrl: null,
      bucket: 'demo-bucket',
      enabled: true,
      prefix: 'media',
      provider: 'supabase-storage',
      signedDownloads: true,
    }),
    uploadToSupabaseStorage: async () => {
      throw new Error('upload failed')
    },
  })

  globalThis.fetch = async () =>
    new Response(new Uint8Array([1, 2, 3, 4]), {
      headers: {
        'content-type': 'model/gltf-binary',
      },
      status: 200,
    })

  try {
    await assert.rejects(
      () =>
        resolveModelFormatAssets({
          generationPricingDownloadCredits: 5,
          payloadData: {
            modelUrls: {
              glb: 'https://cdn.example-assets.com/models/demo.glb',
            },
          },
          req: createRequestMock() as never,
          requireLocalIngestion: true,
          taskCode: 'TASK-789',
          taskId: 12,
          userId: 7,
        }),
      /upload failed/,
    )
  } finally {
    globalThis.fetch = previousFetch
    __setAITaskFlowStorageTestHooks(null)
  }
})

test('Media upload collection does not write generated assets to local disk', async () => {
  const { Media } = await import('../src/collections/Media.ts')

  assert.equal(typeof Media.upload, 'object')
  assert.equal(Media.upload && typeof Media.upload === 'object' ? Media.upload.disableLocalStorage : false, true)
})
