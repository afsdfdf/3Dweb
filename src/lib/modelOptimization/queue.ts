import type { PayloadRequest, Where } from 'payload'

import type { ModelOptimizationMode } from './config'

const INTERNAL_ACCESS = true
const MAX_OPTIMIZATION_ATTEMPTS = 3

export function buildModelOptimizationJobKey(args: {
  mode: ModelOptimizationMode
  modelId: number
  sourceMediaId: number
}) {
  return `model:${args.modelId}:source:${args.sourceMediaId}:mode:${args.mode}`
}

export function shouldRetryOptimizationJob(args: {
  attempts?: null | number
  leaseExpiresAt?: null | string
  now?: Date | string
  status?: null | string
}) {
  const attempts = Number(args.attempts || 0)
  if (!Number.isFinite(attempts) || attempts >= MAX_OPTIMIZATION_ATTEMPTS) return false
  if (args.status === 'failed') return true
  if (args.status !== 'running' || !args.leaseExpiresAt) return false

  const leaseTime = new Date(args.leaseExpiresAt).getTime()
  const nowTime = args.now instanceof Date ? args.now.getTime() : new Date(args.now || Date.now()).getTime()

  return Number.isFinite(leaseTime) && Number.isFinite(nowTime) && leaseTime <= nowTime
}

export function buildModelOptimizationDispatchWhere(nowISOString: string): Where {
  return {
    or: [
      {
        status: {
          equals: 'pending',
        },
      },
      {
        and: [
          {
            status: {
              equals: 'failed',
            },
          },
          {
            attempts: {
              less_than: MAX_OPTIMIZATION_ATTEMPTS,
            },
          },
        ],
      },
      {
        and: [
          {
            status: {
              equals: 'running',
            },
          },
          {
            attempts: {
              less_than: MAX_OPTIMIZATION_ATTEMPTS,
            },
          },
          {
            leaseExpiresAt: {
              less_than_equal: nowISOString,
            },
          },
        ],
      },
    ],
  } satisfies Where
}

export async function enqueueModelOptimizationJob(args: {
  mode: ModelOptimizationMode
  modelId: number
  req: PayloadRequest
  sourceMediaId: number
  sourceURL: string
}) {
  const jobKey = buildModelOptimizationJobKey(args)
  const existing = await args.req.payload.find({
    collection: 'model-optimization-jobs',
    depth: 0,
    limit: 1,
    overrideAccess: INTERNAL_ACCESS,
    pagination: false,
    req: args.req,
    where: {
      jobKey: {
        equals: jobKey,
      },
    },
  })

  if (existing.docs[0]) {
    return existing.docs[0]
  }

  return args.req.payload.create({
    collection: 'model-optimization-jobs',
    data: {
      jobKey,
      mode: args.mode,
      model: args.modelId,
      sourceFile: args.sourceMediaId,
      sourceUrl: args.sourceURL,
      status: 'pending',
    },
    overrideAccess: INTERNAL_ACCESS,
    req: args.req,
  })
}
