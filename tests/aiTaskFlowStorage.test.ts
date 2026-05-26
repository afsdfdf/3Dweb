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

const createWebhookRequestMock = (taskOverrides: Record<string, unknown> = {}) => {
  let currentTask = {
    callbackPayload: null,
    creditsReserved: 0,
    id: 31,
    parameterSnapshot: {},
    progress: 85,
    provider: 'custom',
    providerTaskId: 'provider-empty-1',
    resultModel: null,
    status: 'processing',
    taskCode: 'TASK-EMPTY',
    user: 7,
    ...taskOverrides,
  }
  const createdCollections: string[] = []
  const generationTaskUpdates: Array<Record<string, unknown>> = []
  const modelUpdates: Array<Record<string, unknown>> = []

  return {
    createdCollections,
    generationTaskUpdates,
    modelUpdates,
    get currentTask() {
      return currentTask
    },
    req: {
      payload: {
        findGlobal: async ({ slug }: { slug: string }) => {
          if (slug === 'security-settings') {
            return {
              allowedRemoteAssetHosts: [{ host: 'cdn.example-assets.com' }],
            }
          }

          return null
        },
        find: async ({ collection }: { collection: string }) => {
          if (collection === 'generation-tasks') {
            return { docs: [currentTask] }
          }

          if (collection === 'models') {
            return { docs: [] }
          }

          return { docs: [] }
        },
        findByID: async ({ collection }: { collection: string }) => {
          if (collection === 'generation-tasks') {
            return currentTask
          }

          throw new Error(`Unexpected findByID collection: ${collection}`)
        },
        update: async ({ collection, data }: { collection: string; data: Record<string, unknown> }) => {
          if (collection === 'generation-tasks') {
            generationTaskUpdates.push(data)
            currentTask = {
              ...currentTask,
              ...data,
            }
            return currentTask
          }

          if (collection === 'models') {
            modelUpdates.push(data)
            return {
              id: 100,
              ...data,
            }
          }

          throw new Error(`Unexpected update collection: ${collection}`)
        },
        create: async ({ collection, data }: { collection: string; data: Record<string, unknown> }) => {
          createdCollections.push(collection)
          return {
            id: createdCollections.length + 100,
            ...data,
          }
        },
        logger: {
          error: () => undefined,
          warn: () => undefined,
        },
      },
      user: {
        id: 7,
      },
    },
  }
}

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

test('handleAIWebhook fails succeeded provider payloads with no model assets', async () => {
  const previousMockFlag = process.env.ENABLE_AI_MOCK_RESULTS
  const { handleAIWebhook } = await import('../src/lib/aiTaskFlow.ts')
  const harness = createWebhookRequestMock()

  delete process.env.ENABLE_AI_MOCK_RESULTS

  try {
    const result = await handleAIWebhook({
      payloadData: {
        provider: 'custom',
        providerTaskId: 'provider-empty-1',
        status: 'succeeded',
      },
      req: harness.req as never,
    })

    assert.equal(result.status, 'failed')
    assert.equal(harness.currentTask.status, 'failed')
    assert.match(String(harness.currentTask.failureReason), /without a downloadable model asset/)
    assert.equal(harness.createdCollections.includes('models'), false)
  } finally {
    if (previousMockFlag === undefined) {
      delete process.env.ENABLE_AI_MOCK_RESULTS
    } else {
      process.env.ENABLE_AI_MOCK_RESULTS = previousMockFlag
    }
  }
})

test('handleAIWebhook rejects production model formats that only fall back to remote URLs', async () => {
  const previousFetch = globalThis.fetch
  const previousCanonicalAppURL = process.env.CANONICAL_APP_URL
  const previousNextPublicAppURL = process.env.NEXT_PUBLIC_APP_URL
  const previousNodeEnv = process.env.NODE_ENV
  const { __setAITaskFlowStorageTestHooks, handleAIWebhook } = await import('../src/lib/aiTaskFlow.ts')
  const harness = createWebhookRequestMock({
    providerTaskId: 'provider-remote-1',
    taskCode: 'TASK-REMOTE',
  })

  process.env.NODE_ENV = 'production'
  process.env.CANONICAL_APP_URL = 'https://thorns.example'
  process.env.NEXT_PUBLIC_APP_URL = 'https://thorns.example'
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
    await handleAIWebhook({
      payloadData: {
        modelUrls: {
          glb: 'https://cdn.example-assets.com/models/demo.glb',
        },
        provider: 'custom',
        providerTaskId: 'provider-remote-1',
        status: 'succeeded',
      },
      req: harness.req as never,
    })

    assert.equal(harness.currentTask.status, 'failed')
    assert.match(String(harness.currentTask.failureReason), /managed storage/)
    assert.equal(harness.createdCollections.includes('models'), false)
  } finally {
    globalThis.fetch = previousFetch
    if (previousCanonicalAppURL === undefined) {
      delete process.env.CANONICAL_APP_URL
    } else {
      process.env.CANONICAL_APP_URL = previousCanonicalAppURL
    }
    if (previousNextPublicAppURL === undefined) {
      delete process.env.NEXT_PUBLIC_APP_URL
    } else {
      process.env.NEXT_PUBLIC_APP_URL = previousNextPublicAppURL
    }
    process.env.NODE_ENV = previousNodeEnv
    __setAITaskFlowStorageTestHooks(null)
  }
})

test('handleAIWebhook keeps succeeded tasks when preview optimization enqueue fails', async () => {
  const previousFetch = globalThis.fetch
  const previousEnabled = process.env.MODEL_OPTIMIZATION_ENABLED
  const previousMode = process.env.MODEL_OPTIMIZATION_MODE
  const {
    __setAITaskFlowOptimizationTestHooks,
    __setAITaskFlowStorageTestHooks,
    handleAIWebhook,
  } = await import('../src/lib/aiTaskFlow.ts')
  const harness = createWebhookRequestMock({
    providerTaskId: 'provider-optimize-1',
    taskCode: 'TASK-OPTIMIZE',
  })

  process.env.MODEL_OPTIMIZATION_ENABLED = 'true'
  process.env.MODEL_OPTIMIZATION_MODE = 'small'
  __setAITaskFlowStorageTestHooks({
    getRuntimeStorageSettings: async () => ({
      baseUrl: null,
      bucket: 'demo-bucket',
      enabled: true,
      prefix: 'media',
      provider: 'supabase-storage',
      signedDownloads: true,
    }),
    uploadToSupabaseStorage: async ({ path }) => ({
      path,
      publicUrl: `https://supabase.example/storage/v1/object/public/demo-bucket/${path}`,
    }),
  })
  __setAITaskFlowOptimizationTestHooks({
    enqueueModelOptimizationJob: async () => {
      throw new Error('queue unavailable')
    },
    resolveOriginalGLBAsset: async (modelId) => ({
      mediaId: 101,
      mimeType: 'model/gltf-binary',
      modelId,
      ownerId: 7,
      sourceURL: 'https://supabase.example/storage/v1/object/public/demo-bucket/media/generated/task.glb',
    }),
  })
  globalThis.fetch = async () =>
    new Response(new Uint8Array([1, 2, 3, 4]), {
      headers: {
        'content-type': 'model/gltf-binary',
      },
      status: 200,
    })

  try {
    const result = await handleAIWebhook({
      payloadData: {
        modelUrls: {
          glb: 'https://cdn.example-assets.com/models/demo.glb',
        },
        provider: 'custom',
        providerTaskId: 'provider-optimize-1',
        status: 'succeeded',
      },
      req: harness.req as never,
    })

    assert.equal(result.status, 'succeeded')
    assert.equal(harness.currentTask.status, 'succeeded')
    assert.equal(harness.createdCollections.includes('models'), true)
  } finally {
    globalThis.fetch = previousFetch
    if (previousEnabled === undefined) {
      delete process.env.MODEL_OPTIMIZATION_ENABLED
    } else {
      process.env.MODEL_OPTIMIZATION_ENABLED = previousEnabled
    }
    if (previousMode === undefined) {
      delete process.env.MODEL_OPTIMIZATION_MODE
    } else {
      process.env.MODEL_OPTIMIZATION_MODE = previousMode
    }
    __setAITaskFlowStorageTestHooks(null)
    __setAITaskFlowOptimizationTestHooks(null)
  }
})

test('handleAIWebhook schedules preview optimization dispatch after enqueue without blocking success', async () => {
  const previousFetch = globalThis.fetch
  const previousEnabled = process.env.MODEL_OPTIMIZATION_ENABLED
  const previousMode = process.env.MODEL_OPTIMIZATION_MODE
  const {
    __setAITaskFlowOptimizationTestHooks,
    __setAITaskFlowStorageTestHooks,
    handleAIWebhook,
  } = await import('../src/lib/aiTaskFlow.ts')
  const harness = createWebhookRequestMock({
    providerTaskId: 'provider-optimize-dispatch-1',
    taskCode: 'TASK-OPTIMIZE-DISPATCH',
  })
  const scheduledDispatches: Array<() => Promise<void> | void> = []
  const dispatchedJobIds: number[] = []

  process.env.MODEL_OPTIMIZATION_ENABLED = 'true'
  process.env.MODEL_OPTIMIZATION_MODE = 'conservative'
  __setAITaskFlowStorageTestHooks({
    getRuntimeStorageSettings: async () => ({
      baseUrl: null,
      bucket: 'demo-bucket',
      enabled: true,
      prefix: 'media',
      provider: 'supabase-storage',
      signedDownloads: true,
    }),
    uploadToSupabaseStorage: async ({ path }) => ({
      path,
      publicUrl: `https://supabase.example/storage/v1/object/public/demo-bucket/${path}`,
    }),
  })
  __setAITaskFlowOptimizationTestHooks({
    dispatchModelOptimizationJob: async ({ jobId }) => {
      dispatchedJobIds.push(jobId)
      throw new Error('worker unavailable')
    },
    enqueueModelOptimizationJob: async () => ({
      attempts: 0,
      id: 456,
      status: 'pending',
    } as never),
    resolveOriginalGLBAsset: async (modelId) => ({
      mediaId: 101,
      mimeType: 'model/gltf-binary',
      modelId,
      ownerId: 7,
      sourceURL: 'https://supabase.example/storage/v1/object/public/demo-bucket/media/generated/task.glb',
    }),
    scheduleAfterResponse: (task) => {
      scheduledDispatches.push(task)
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
    const result = await handleAIWebhook({
      payloadData: {
        modelUrls: {
          glb: 'https://cdn.example-assets.com/models/demo.glb',
        },
        provider: 'custom',
        providerTaskId: 'provider-optimize-dispatch-1',
        status: 'succeeded',
      },
      req: harness.req as never,
    })

    assert.equal(result.status, 'succeeded')
    assert.equal(harness.currentTask.status, 'succeeded')
    assert.equal(scheduledDispatches.length, 1)
    assert.deepEqual(dispatchedJobIds, [])

    await scheduledDispatches[0]?.()

    assert.deepEqual(dispatchedJobIds, [456])
    assert.equal(harness.modelUpdates.length, 1)
  } finally {
    globalThis.fetch = previousFetch
    if (previousEnabled === undefined) {
      delete process.env.MODEL_OPTIMIZATION_ENABLED
    } else {
      process.env.MODEL_OPTIMIZATION_ENABLED = previousEnabled
    }
    if (previousMode === undefined) {
      delete process.env.MODEL_OPTIMIZATION_MODE
    } else {
      process.env.MODEL_OPTIMIZATION_MODE = previousMode
    }
    __setAITaskFlowStorageTestHooks(null)
    __setAITaskFlowOptimizationTestHooks(null)
  }
})

test('Media upload collection does not write generated assets to local disk', async () => {
  const { Media } = await import('../src/collections/Media.ts')

  assert.equal(typeof Media.upload, 'object')
  assert.equal(Media.upload && typeof Media.upload === 'object' ? Media.upload.disableLocalStorage : false, true)
})
