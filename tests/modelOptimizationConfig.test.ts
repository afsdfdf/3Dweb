import assert from 'node:assert/strict'
import test from 'node:test'

import { normalizeModelOptimizationConfig } from '../src/lib/modelOptimization/config.ts'
import { buildOptimizedModelPath } from '../src/lib/modelOptimization/paths.ts'

test('normalizes model optimization config with safe defaults', () => {
  const config = normalizeModelOptimizationConfig({
    MODEL_OPTIMIZATION_CALLBACK_SECRET: 'secret',
    MODEL_OPTIMIZATION_ENABLED: 'true',
    MODEL_OPTIMIZATION_WORKER_URL: 'https://worker.example/api/compress',
  } as NodeJS.ProcessEnv)

  assert.equal(config.enabled, true)
  assert.equal(config.mode, 'conservative')
  assert.equal(config.maxActive, 24)
  assert.equal(config.dispatchBatchSize, 6)
  assert.equal(config.workerURL, 'https://worker.example/api/compress')
})

test('builds deterministic optimized GLB path', () => {
  assert.equal(
    buildOptimizedModelPath({
      mode: 'conservative',
      modelId: 61,
      prefix: 'media',
      sourceMediaId: 88,
      userId: 12,
    }),
    'media/model-previews/user-12/model-61/source-88/model-61-preview-conservative.glb',
  )
})
