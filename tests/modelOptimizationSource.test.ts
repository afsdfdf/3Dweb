import assert from 'node:assert/strict'
import test from 'node:test'

import {
  __setModelOptimizationSourceTestHooks,
  resolveOriginalGLBAsset,
} from '../src/lib/modelOptimization/source.ts'

test('resolves original GLB asset through models formats media rows', async () => {
  const calls: { params: unknown[]; sql: string }[] = []

  __setModelOptimizationSourceTestHooks({
    queryPostgres: async (sql, params) => {
      calls.push({ params, sql })
      return {
        rows: [
          {
            mediaId: 88,
            mimeType: 'model/gltf-binary',
            modelId: 61,
            ownerId: 12,
            sourceURL: 'https://storage.example/model.glb',
          },
        ],
      }
    },
  })

  try {
    const asset = await resolveOriginalGLBAsset(61)

    assert.equal(asset?.mediaId, 88)
    assert.equal(asset?.sourceURL, 'https://storage.example/model.glb')
    assert.equal(calls[0]?.params[0], 61)
    assert.match(calls[0]?.sql || '', /models_formats/)
  } finally {
    __setModelOptimizationSourceTestHooks(null)
  }
})
