import assert from 'node:assert/strict'
import test from 'node:test'

import {
  __setModelOptimizationEndpointTestHooks,
  modelOptimizationCallbackEndpoint,
} from '../src/endpoints/modelOptimization.ts'

const originalSecret = process.env.MODEL_OPTIMIZATION_CALLBACK_SECRET

function restoreSecret() {
  if (originalSecret === undefined) {
    delete process.env.MODEL_OPTIMIZATION_CALLBACK_SECRET
  } else {
    process.env.MODEL_OPTIMIZATION_CALLBACK_SECRET = originalSecret
  }
}

test('model optimization callback rejects invalid secret', async () => {
  process.env.MODEL_OPTIMIZATION_CALLBACK_SECRET = 'callback-secret'

  try {
    const response = await modelOptimizationCallbackEndpoint.handler({
      headers: new Headers({ 'x-model-optimization-secret': 'wrong' }),
      json: async () => ({}),
    } as never)

    assert.equal(response.status, 401)
  } finally {
    restoreSecret()
  }
})

test('model optimization callback completes successful worker result', async () => {
  process.env.MODEL_OPTIMIZATION_CALLBACK_SECRET = 'callback-secret'
  let completedJobId: number | null = null

  __setModelOptimizationEndpointTestHooks({
    completeModelOptimizationJob: async ({ jobId }) => {
      completedJobId = jobId
      return { id: jobId } as never
    },
  })

  try {
    const response = await modelOptimizationCallbackEndpoint.handler({
      headers: new Headers({ 'x-model-optimization-secret': 'callback-secret' }),
      json: async () => ({
        jobId: 123,
        ok: true,
        output: {
          bytes: 4_794_944,
          mb: 4.57,
          path: 'media/model-previews/demo.glb',
          publicUrl: 'https://storage.example/demo.glb',
        },
        reductionPercent: 88.8,
        source: {
          bytes: 42_929_948,
          mb: 40.94,
        },
        timingsMs: {
          total: 11_000,
        },
        workerRunId: 'run-1',
      }),
    } as never)

    const body = await response.json()

    assert.equal(response.status, 200)
    assert.equal(body.ok, true)
    assert.equal(completedJobId, 123)
  } finally {
    __setModelOptimizationEndpointTestHooks(null)
    restoreSecret()
  }
})
