import assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildModelOptimizationJobKey,
  shouldRetryOptimizationJob,
} from '../src/lib/modelOptimization/queue.ts'

test('builds stable optimization job key', () => {
  assert.equal(
    buildModelOptimizationJobKey({
      mode: 'conservative',
      modelId: 61,
      sourceMediaId: 88,
    }),
    'model:61:source:88:mode:conservative',
  )
})

test('retries failed optimization jobs up to three attempts', () => {
  assert.equal(shouldRetryOptimizationJob({ attempts: 0, status: 'failed' }), true)
  assert.equal(shouldRetryOptimizationJob({ attempts: 2, status: 'failed' }), true)
  assert.equal(shouldRetryOptimizationJob({ attempts: 3, status: 'failed' }), false)
  assert.equal(shouldRetryOptimizationJob({ attempts: 1, status: 'succeeded' }), false)
})
