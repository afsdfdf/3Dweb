import assert from 'node:assert/strict'
import test from 'node:test'

import { ModelOptimizationJobs } from '../src/collections/ModelOptimizationJobs.ts'
import { Models } from '../src/collections/Models.ts'

test('model optimization job collection has idempotent queue fields', () => {
  assert.equal(ModelOptimizationJobs.slug, 'model-optimization-jobs')

  const fieldNames = ModelOptimizationJobs.fields.map((field) => ('name' in field ? field.name : ''))

  assert.ok(fieldNames.includes('jobKey'))
  assert.ok(fieldNames.includes('model'))
  assert.ok(fieldNames.includes('sourceFile'))
  assert.ok(fieldNames.includes('outputFile'))
  assert.ok(fieldNames.includes('status'))
  assert.ok(fieldNames.includes('leaseExpiresAt'))
})

test('models collection exposes viewer optimization group', () => {
  const field = Models.fields.find((item) => 'name' in item && item.name === 'viewerOptimization')

  assert.ok(field)
  assert.equal(field.type, 'group')
})
