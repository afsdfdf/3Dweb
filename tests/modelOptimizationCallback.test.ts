import assert from 'node:assert/strict'
import test from 'node:test'

import {
  completeModelOptimizationJob,
  verifyModelOptimizationCallback,
} from '../src/lib/modelOptimization/callback.ts'

const originalSecret = process.env.MODEL_OPTIMIZATION_CALLBACK_SECRET

test('verifies model optimization callback secret from header', () => {
  process.env.MODEL_OPTIMIZATION_CALLBACK_SECRET = 'callback-secret'

  try {
    assert.equal(
      verifyModelOptimizationCallback({
        headers: new Headers({ 'x-model-optimization-secret': 'callback-secret' }),
      } as never),
      true,
    )
    assert.equal(
      verifyModelOptimizationCallback({
        headers: new Headers({ 'x-model-optimization-secret': 'wrong' }),
      } as never),
      false,
    )
  } finally {
    if (originalSecret === undefined) {
      delete process.env.MODEL_OPTIMIZATION_CALLBACK_SECRET
    } else {
      process.env.MODEL_OPTIMIZATION_CALLBACK_SECRET = originalSecret
    }
  }
})

test('completion creates media and marks job and model succeeded', async () => {
  const created: Record<string, unknown>[] = []
  const updates: Record<string, unknown>[] = []
  const payload = {
    create: async (args: Record<string, unknown>) => {
      created.push(args)
      return { id: 501 }
    },
    findByID: async () => ({
      attempts: 1,
      id: 123,
      mode: 'conservative',
      model: {
        id: 61,
        owner: 12,
        visibility: 'public',
      },
      sourceFile: {
        id: 88,
      },
    }),
    update: async (args: Record<string, unknown>) => {
      updates.push(args)
      return { id: args.id }
    },
  }

  await completeModelOptimizationJob({
    jobId: 123,
    output: {
      bytes: 4_794_944,
      mb: 4.57,
      path: 'media/model-previews/user-12/model-61/source-88/model-61-preview-conservative.glb',
      publicUrl: 'https://storage.example/preview.glb',
    },
    reductionPercent: 88.8,
    req: { payload } as never,
    source: {
      bytes: 42_929_948,
      mb: 40.94,
    },
    timingsMs: {
      total: 11_000,
    },
    workerRunId: 'run-1',
  })

  assert.equal(created[0]?.collection, 'media')
  assert.equal((created[0]?.data as Record<string, unknown>).url, 'https://storage.example/preview.glb')
  assert.equal(updates.some((item) => item.collection === 'models'), true)
  assert.equal(updates.some((item) => item.collection === 'model-optimization-jobs'), true)
})
