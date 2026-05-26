import type { PayloadRequest } from 'payload'

import type { ModelOptimizationMode } from './config'

const INTERNAL_ACCESS = true

export function buildModelOptimizationJobKey(args: {
  mode: ModelOptimizationMode
  modelId: number
  sourceMediaId: number
}) {
  return `model:${args.modelId}:source:${args.sourceMediaId}:mode:${args.mode}`
}

export function shouldRetryOptimizationJob(args: {
  attempts?: null | number
  status?: null | string
}) {
  return args.status === 'failed' && Number(args.attempts || 0) < 3
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
