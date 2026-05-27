import assert from 'node:assert/strict'
import test from 'node:test'

import {
  __setModelOptimizationBackfillTestHooks,
  backfillModelOptimizationJobs,
  findModelOptimizationBackfillCandidates,
} from '../src/lib/modelOptimization/backfill.ts'

test('findModelOptimizationBackfillCandidates selects unhandled GLB models only', async () => {
  const calls: { params: unknown[]; sql: string }[] = []

  __setModelOptimizationBackfillTestHooks({
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
    const candidates = await findModelOptimizationBackfillCandidates({
      limit: 5,
      mode: 'conservative',
    })

    assert.equal(candidates.length, 1)
    assert.equal(candidates[0]?.modelId, 61)
    assert.equal(candidates[0]?.mediaId, 88)
    assert.deepEqual(calls[0]?.params, ['conservative', 5, null, null])
    assert.match(calls[0]?.sql || '', /model_optimization_jobs/)
    assert.match(calls[0]?.sql || '', /viewer_optimization_status/)
    assert.match(calls[0]?.sql || '', /existing\.id is null/i)
  } finally {
    __setModelOptimizationBackfillTestHooks(null)
  }
})

test('backfillModelOptimizationJobs dry run does not create jobs or update models', async () => {
  __setModelOptimizationBackfillTestHooks({
    queryPostgres: async () => ({
      rows: [
        {
          mediaId: 88,
          mimeType: 'model/gltf-binary',
          modelId: 61,
          ownerId: 12,
          sourceURL: 'https://storage.example/model.glb',
        },
      ],
    }),
  })

  try {
    const result = await backfillModelOptimizationJobs({
      dryRun: true,
      limit: 1,
      mode: 'conservative',
      req: {
        payload: {
          create: async () => {
            throw new Error('create should not run during dry run')
          },
          find: async () => {
            throw new Error('find should not run during dry run')
          },
          update: async () => {
            throw new Error('update should not run during dry run')
          },
        },
      } as never,
    })

    assert.equal(result.dryRun, true)
    assert.equal(result.candidateCount, 1)
    assert.equal(result.enqueuedCount, 0)
    assert.deepEqual(result.jobs, [])
  } finally {
    __setModelOptimizationBackfillTestHooks(null)
  }
})

test('backfillModelOptimizationJobs enqueues candidates and marks models pending', async () => {
  const creates: Array<Record<string, unknown>> = []
  const updates: Array<Record<string, unknown>> = []

  __setModelOptimizationBackfillTestHooks({
    queryPostgres: async () => ({
      rows: [
        {
          mediaId: 88,
          mimeType: 'model/gltf-binary',
          modelId: 61,
          ownerId: 12,
          sourceURL: 'https://storage.example/model.glb',
        },
      ],
    }),
  })

  try {
    const result = await backfillModelOptimizationJobs({
      dryRun: false,
      limit: 1,
      mode: 'conservative',
      req: {
        payload: {
          create: async (args: Record<string, unknown>) => {
            creates.push(args)
            return { id: 301, ...(args.data as Record<string, unknown>) }
          },
          find: async () => ({ docs: [] }),
          update: async (args: Record<string, unknown>) => {
            updates.push(args)
            return { id: args.id }
          },
        },
      } as never,
    })

    assert.equal(result.dryRun, false)
    assert.equal(result.enqueuedCount, 1)
    assert.equal(result.jobs[0]?.jobId, 301)
    assert.equal(creates[0]?.collection, 'model-optimization-jobs')
    assert.equal(updates[0]?.collection, 'models')
    assert.deepEqual((updates[0]?.data as Record<string, unknown>).viewerOptimization, {
      mode: 'conservative',
      sourceFile: 88,
      status: 'pending',
    })
  } finally {
    __setModelOptimizationBackfillTestHooks(null)
  }
})
