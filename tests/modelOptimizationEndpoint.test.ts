import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'

import {
  __setModelOptimizationEndpointTestHooks,
  backfillModelOptimizationEndpoint,
  cronModelOptimizationDispatchEndpoint,
  modelOptimizationCallbackEndpoint,
} from '../src/endpoints/modelOptimization.ts'

const originalEnv = {
  CRON_SECRET: process.env.CRON_SECRET,
  MODEL_OPTIMIZATION_CALLBACK_SECRET: process.env.MODEL_OPTIMIZATION_CALLBACK_SECRET,
  MODEL_OPTIMIZATION_ENABLED: process.env.MODEL_OPTIMIZATION_ENABLED,
  MODEL_OPTIMIZATION_WORKER_URL: process.env.MODEL_OPTIMIZATION_WORKER_URL,
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

test('model optimization callback rejects invalid secret', async () => {
  process.env.MODEL_OPTIMIZATION_CALLBACK_SECRET = 'callback-secret'

  try {
    const response = await modelOptimizationCallbackEndpoint.handler({
      headers: new Headers({ 'x-model-optimization-secret': 'wrong' }),
      json: async () => ({}),
    } as never)

    assert.equal(response.status, 401)
  } finally {
    restoreEnv()
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
    restoreEnv()
  }
})

test('model optimization cron dispatch requires Vercel cron authorization', async () => {
  process.env.CRON_SECRET = 'cron-secret'

  try {
    const response = await cronModelOptimizationDispatchEndpoint.handler({
      headers: new Headers({ authorization: 'Bearer wrong' }),
    } as never)

    assert.equal(response.status, 401)
  } finally {
    restoreEnv()
  }
})

test('model optimization backfill requires Vercel cron authorization', async () => {
  process.env.CRON_SECRET = 'cron-secret'

  try {
    const response = await backfillModelOptimizationEndpoint.handler({
      headers: new Headers({ authorization: 'Bearer wrong' }),
      json: async () => ({}),
    } as never)

    assert.equal(response.status, 401)
  } finally {
    restoreEnv()
  }
})

test('model optimization backfill accepts dry-run and bounded enqueue options', async () => {
  process.env.CRON_SECRET = 'cron-secret'
  const calls: Array<Record<string, unknown>> = []

  __setModelOptimizationEndpointTestHooks({
    backfillModelOptimizationJobs: async (args) => {
      calls.push(args as unknown as Record<string, unknown>)
      return {
        candidateCount: 2,
        candidates: [],
        dryRun: true,
        enqueuedCount: 0,
        jobs: [],
        limit: 2,
      } as never
    },
  })

  try {
    const response = await backfillModelOptimizationEndpoint.handler({
      headers: new Headers({ authorization: 'Bearer cron-secret' }),
      json: async () => ({
        dryRun: true,
        limit: 2,
        modelId: 61,
      }),
    } as never)
    const body = await response.json()

    assert.equal(response.status, 200)
    assert.equal(body.dryRun, true)
    assert.equal(body.candidateCount, 2)
    assert.equal(calls[0]?.dryRun, true)
    assert.equal(calls[0]?.limit, 2)
    assert.equal(calls[0]?.modelId, 61)
  } finally {
    __setModelOptimizationEndpointTestHooks(null)
    restoreEnv()
  }
})

test('model optimization cron dispatch claims pending jobs with valid Vercel cron authorization', async () => {
  process.env.CRON_SECRET = 'cron-secret'
  process.env.MODEL_OPTIMIZATION_CALLBACK_SECRET = 'callback-secret'
  process.env.MODEL_OPTIMIZATION_ENABLED = 'true'
  process.env.MODEL_OPTIMIZATION_WORKER_URL = 'https://worker.example/api/compress'
  const dispatchedJobIds: number[] = []

  __setModelOptimizationEndpointTestHooks({
    dispatchModelOptimizationJob: async ({ jobId }) => {
      dispatchedJobIds.push(jobId)
      return {
        dispatched: true,
      } as never
    },
  })

  try {
    const response = await cronModelOptimizationDispatchEndpoint.handler({
      headers: new Headers({ authorization: 'Bearer cron-secret' }),
      payload: {
        count: async () => ({ totalDocs: 0 }),
        find: async () => ({
          docs: [{ id: 201 }, { id: 202 }],
        }),
      },
    } as never)
    const body = await response.json()

    assert.equal(response.status, 200)
    assert.equal(body.claimed, 2)
    assert.deepEqual(dispatchedJobIds, [201, 202])
  } finally {
    __setModelOptimizationEndpointTestHooks(null)
    restoreEnv()
  }
})

test('model optimization cron dispatch claims retryable failed and expired running jobs', async () => {
  process.env.CRON_SECRET = 'cron-secret'
  process.env.MODEL_OPTIMIZATION_CALLBACK_SECRET = 'callback-secret'
  process.env.MODEL_OPTIMIZATION_ENABLED = 'true'
  process.env.MODEL_OPTIMIZATION_WORKER_URL = 'https://worker.example/api/compress'
  const dispatchedJobIds: number[] = []
  let capturedWhere: unknown = null

  __setModelOptimizationEndpointTestHooks({
    dispatchModelOptimizationJob: async ({ jobId }) => {
      dispatchedJobIds.push(jobId)
      return {
        dispatched: true,
      } as never
    },
  })

  try {
    const response = await cronModelOptimizationDispatchEndpoint.handler({
      headers: new Headers({ authorization: 'Bearer cron-secret' }),
      payload: {
        count: async () => ({ totalDocs: 0 }),
        find: async (args: { where?: unknown }) => {
          capturedWhere = args.where
          const whereText = JSON.stringify(args.where)
          return {
            docs: whereText.includes('"failed"') && whereText.includes('"running"')
              ? [{ id: 301 }, { id: 302 }]
              : [],
          }
        },
      },
    } as never)
    const body = await response.json()
    const whereText = JSON.stringify(capturedWhere)

    assert.equal(response.status, 200)
    assert.equal(body.claimed, 2)
    assert.deepEqual(dispatchedJobIds, [301, 302])
    assert.match(whereText, /"failed"/)
    assert.match(whereText, /"running"/)
    assert.match(whereText, /"attempts"/)
    assert.match(whereText, /"leaseExpiresAt"/)
  } finally {
    __setModelOptimizationEndpointTestHooks(null)
    restoreEnv()
  }
})

test('Vercel cron invokes model optimization dispatch every minute', () => {
  const config = JSON.parse(readFileSync(path.join(process.cwd(), 'vercel.json'), 'utf8'))

  assert.deepEqual(config.crons, [
    {
      path: '/api/platform/model-optimization/cron-dispatch',
      schedule: '* * * * *',
    },
    {
      path: '/api/studio/ai/tasks/cron-reconcile',
      schedule: '*/10 * * * *',
    },
  ])
})
