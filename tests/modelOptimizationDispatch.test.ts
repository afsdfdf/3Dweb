import assert from 'node:assert/strict'
import test from 'node:test'

import {
  __setModelOptimizationDispatchTestHooks,
  dispatchModelOptimizationJob,
} from '../src/lib/modelOptimization/dispatch.ts'

const originalEnv = {
  MODEL_OPTIMIZATION_CALLBACK_SECRET: process.env.MODEL_OPTIMIZATION_CALLBACK_SECRET,
  MODEL_OPTIMIZATION_ENABLED: process.env.MODEL_OPTIMIZATION_ENABLED,
  MODEL_OPTIMIZATION_WORKER_URL: process.env.MODEL_OPTIMIZATION_WORKER_URL,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
}

function restoreEnv() {
  for (const [key, value] of Object.entries(originalEnv)) {
    if (value === undefined) {
      delete process.env[key]
    } else {
      process.env[key] = value
    }
  }
}

test('dispatch sends signed upload target to worker without putting callback secret in body', async () => {
  process.env.MODEL_OPTIMIZATION_CALLBACK_SECRET = 'shared-secret'
  process.env.MODEL_OPTIMIZATION_ENABLED = 'true'
  process.env.MODEL_OPTIMIZATION_WORKER_URL = 'https://worker.example/api/compress'
  process.env.NEXT_PUBLIC_APP_URL = 'https://app.example'

  const updates: Record<string, unknown>[] = []
  let workerRequest: { body: Record<string, unknown>; headers: Headers; url: string } | null = null

  __setModelOptimizationDispatchTestHooks({
    createSupabaseStorageSignedUploadUrl: async ({ path }) => ({
      path,
      publicUrl: `https://storage.example/${path}`,
      token: 'upload-token',
    }),
    fetch: async (url, init) => {
      workerRequest = {
        body: JSON.parse(String(init?.body || '{}')),
        headers: new Headers(init?.headers),
        url: String(url),
      }
      return new Response(JSON.stringify({ ok: true }), { status: 202 })
    },
    getMediaAccessURL: async () => 'https://storage.example/source.glb?token=read',
    getRuntimeStorageSettings: async () => ({
      baseUrl: null,
      bucket: 'media',
      enabled: true,
      prefix: 'media',
      provider: 'supabase-storage',
      signedDownloads: true,
    }),
  })

  const payload = {
    findByID: async () => ({
      id: 123,
      mode: 'conservative',
      model: {
        id: 61,
        owner: 12,
      },
      sourceFile: {
        id: 88,
        mimeType: 'model/gltf-binary',
        url: 'https://storage.example/source.glb',
      },
      sourceUrl: 'https://storage.example/source.glb',
    }),
    update: async (args: Record<string, unknown>) => {
      updates.push(args)
      return { id: args.id }
    },
  }

  try {
    const result = await dispatchModelOptimizationJob({
      jobId: 123,
      req: { payload } as never,
    })

    assert.equal(result.dispatched, true)
    assert.equal(workerRequest?.url, 'https://worker.example/api/compress')
    assert.equal(workerRequest?.headers.get('x-model-optimization-secret'), 'shared-secret')
    assert.equal(JSON.stringify(workerRequest?.body).includes('shared-secret'), false)
    assert.equal((workerRequest?.body.callback as Record<string, unknown>).url, 'https://app.example/api/platform/model-optimization/callback')
    assert.equal((workerRequest?.body.upload as Record<string, unknown>).token, 'upload-token')
    assert.equal(updates.some((item) => item.collection === 'model-optimization-jobs'), true)
    assert.equal(updates.some((item) => item.collection === 'models'), true)
  } finally {
    __setModelOptimizationDispatchTestHooks(null)
    restoreEnv()
  }
})
