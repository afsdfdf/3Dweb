import type { PayloadRequest } from 'payload'

import { rejectRateLimitedEndpoint } from '@/lib/endpointRateLimit'
import { dispatchModelOptimizationJob } from '@/lib/modelOptimization/dispatch'
import { getModelOptimizationConfig } from '@/lib/modelOptimization/config'
import { completeModelOptimizationJob, failModelOptimizationJob, verifyModelOptimizationCallback } from '@/lib/modelOptimization/callback'
import { enqueueModelOptimizationJob } from '@/lib/modelOptimization/queue'
import { resolveOriginalGLBAsset } from '@/lib/modelOptimization/source'
import { ensurePayloadRequestUser } from '@/lib/payloadAuthFallback'
import { rejectDisallowedMutationOrigin } from '@/lib/requestSecurity'

type ModelOptimizationEndpointTestHooks = {
  completeModelOptimizationJob?: typeof completeModelOptimizationJob
  dispatchModelOptimizationJob?: typeof dispatchModelOptimizationJob
  enqueueModelOptimizationJob?: typeof enqueueModelOptimizationJob
  failModelOptimizationJob?: typeof failModelOptimizationJob
  resolveOriginalGLBAsset?: typeof resolveOriginalGLBAsset
}

let modelOptimizationEndpointTestHooks: ModelOptimizationEndpointTestHooks | null = null

export function __setModelOptimizationEndpointTestHooks(hooks: ModelOptimizationEndpointTestHooks | null) {
  modelOptimizationEndpointTestHooks = hooks
}

const unauthorized = () => Response.json({ message: 'Please sign in first.' }, { status: 401 })

const readBody = async (req: PayloadRequest) => {
  if (!req.json) return {}
  const body = await req.json().catch(() => ({}))
  return body && typeof body === 'object' && !Array.isArray(body) ? body as Record<string, unknown> : {}
}

const readPositiveId = (value: unknown) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : null
}

const readOptimizationView = (value: unknown) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {
      completedAt: null,
      mode: null,
      outputSizeMb: null,
      reductionPercent: null,
      status: 'none',
    }
  }

  const record = value as Record<string, unknown>
  return {
    completedAt: typeof record.completedAt === 'string' ? record.completedAt : null,
    mode: record.mode === 'small' || record.mode === 'conservative' ? record.mode : null,
    outputSizeMb: typeof record.outputSizeMb === 'number' ? record.outputSizeMb : null,
    reductionPercent: typeof record.reductionPercent === 'number' ? record.reductionPercent : null,
    status:
      record.status === 'pending' ||
      record.status === 'running' ||
      record.status === 'succeeded' ||
      record.status === 'failed' ||
      record.status === 'skipped'
        ? record.status
        : 'none',
  }
}

export const modelOptimizationCallbackEndpoint = {
  path: '/platform/model-optimization/callback',
  method: 'post' as const,
  handler: async (req: PayloadRequest) => {
    if (!verifyModelOptimizationCallback(req)) {
      return Response.json({ message: 'Model optimization callback verification failed.' }, { status: 401 })
    }

    const body = await readBody(req)
    const jobId = readPositiveId(body.jobId)
    const workerRunId = typeof body.workerRunId === 'string' && body.workerRunId.trim() ? body.workerRunId.trim() : ''
    const timingsMs = body.timingsMs && typeof body.timingsMs === 'object' && !Array.isArray(body.timingsMs)
      ? body.timingsMs as Record<string, number>
      : {}

    if (!jobId) {
      return Response.json({ message: 'Optimization job id is required.' }, { status: 400 })
    }

    if (body.ok === false) {
      await (modelOptimizationEndpointTestHooks?.failModelOptimizationJob || failModelOptimizationJob)({
        error: typeof body.error === 'string' && body.error.trim() ? body.error.trim() : 'Worker compression failed.',
        jobId,
        req,
        timingsMs,
        workerRunId,
      })

      return Response.json({ ok: true })
    }

    const output = body.output && typeof body.output === 'object' && !Array.isArray(body.output) ? body.output as Record<string, unknown> : null
    const source = body.source && typeof body.source === 'object' && !Array.isArray(body.source) ? body.source as Record<string, unknown> : null
    const reductionPercent = Number(body.reductionPercent)

    if (!output || !source || !Number.isFinite(reductionPercent)) {
      return Response.json({ message: 'Worker success payload is incomplete.' }, { status: 400 })
    }

    await (modelOptimizationEndpointTestHooks?.completeModelOptimizationJob || completeModelOptimizationJob)({
      jobId,
      output: {
        bytes: Number(output.bytes || 0),
        mb: Number(output.mb || 0),
        path: String(output.path || ''),
        publicUrl: String(output.publicUrl || ''),
      },
      reductionPercent,
      req,
      source: {
        bytes: Number(source.bytes || 0),
        mb: Number(source.mb || 0),
      },
      timingsMs,
      workerRunId,
    })

    return Response.json({ ok: true })
  },
}

export const dispatchModelOptimizationEndpoint = {
  path: '/platform/model-optimization/dispatch',
  method: 'post' as const,
  handler: async (req: PayloadRequest) => {
    if (!verifyModelOptimizationCallback(req)) {
      return Response.json({ message: 'Model optimization dispatch verification failed.' }, { status: 401 })
    }

    const config = getModelOptimizationConfig()
    if (!config.enabled) {
      return Response.json({ message: 'Model optimization is disabled.', claimed: 0 })
    }

    const active = await req.payload.count({
      collection: 'model-optimization-jobs',
      overrideAccess: true,
      req,
      where: {
        and: [
          { status: { equals: 'running' } },
          { leaseExpiresAt: { greater_than: new Date().toISOString() } },
        ],
      },
    })
    const availableSlots = Math.max(0, config.maxActive - Number(active.totalDocs || 0))
    const limit = Math.min(config.dispatchBatchSize, availableSlots)

    if (limit <= 0) {
      return Response.json({ message: 'No optimization capacity is available.', activeLimit: config.maxActive, claimed: 0 })
    }

    const jobs = await req.payload.find({
      collection: 'model-optimization-jobs',
      depth: 0,
      limit,
      overrideAccess: true,
      pagination: false,
      req,
      sort: 'createdAt',
      where: {
        status: {
          equals: 'pending',
        },
      },
    })
    const results = []

    for (const job of jobs.docs) {
      const jobId = readPositiveId(job.id)
      if (!jobId) continue

      results.push(
        await (modelOptimizationEndpointTestHooks?.dispatchModelOptimizationJob || dispatchModelOptimizationJob)({
          jobId,
          req,
        }),
      )
    }

    return Response.json({
      activeLimit: config.maxActive,
      claimed: results.length,
      message: 'Optimization dispatch completed.',
      results,
    })
  },
}

export const manualModelOptimizationEndpoint = {
  path: '/platform/models/:modelId/optimize-preview',
  method: 'post' as const,
  handler: async (req: PayloadRequest) => {
    const blocked = await rejectDisallowedMutationOrigin(req)
    if (blocked) return blocked

    await ensurePayloadRequestUser(req)
    if (!req.user) return unauthorized()

    const rateLimited = await rejectRateLimitedEndpoint({
      req,
      scope: 'model-optimization',
    })
    if (rateLimited) return rateLimited

    const modelId = readPositiveId(req.routeParams?.modelId)
    if (!modelId) {
      return Response.json({ message: 'Invalid model id.' }, { status: 400 })
    }

    await req.payload.findByID({
      collection: 'models',
      depth: 0,
      id: modelId,
      overrideAccess: false,
      req,
      user: req.user,
    })

    const config = getModelOptimizationConfig()
    const sourceAsset = await (modelOptimizationEndpointTestHooks?.resolveOriginalGLBAsset || resolveOriginalGLBAsset)(modelId)
    if (!sourceAsset) {
      return Response.json({ message: 'No original GLB asset is available for optimization.' }, { status: 404 })
    }

    const job = await (modelOptimizationEndpointTestHooks?.enqueueModelOptimizationJob || enqueueModelOptimizationJob)({
      mode: config.mode,
      modelId,
      req,
      sourceMediaId: sourceAsset.mediaId,
      sourceURL: sourceAsset.sourceURL,
    })

    await req.payload.update({
      collection: 'models',
      data: {
        viewerOptimization: {
          mode: config.mode,
          sourceFile: sourceAsset.mediaId,
          status: 'pending',
        },
      },
      id: modelId,
      overrideAccess: true,
      req,
    })

    return Response.json({
      jobId: job.id,
      message: 'Model preview optimization queued.',
      status: 'pending',
    })
  },
}

export const modelOptimizationStatusEndpoint = {
  path: '/platform/models/:modelId/optimization',
  method: 'get' as const,
  handler: async (req: PayloadRequest) => {
    const modelId = readPositiveId(req.routeParams?.modelId)
    if (!modelId) {
      return Response.json({ message: 'Invalid model id.' }, { status: 400 })
    }

    const model = await req.payload.findByID({
      collection: 'models',
      depth: 0,
      id: modelId,
      overrideAccess: false,
      req,
      ...(req.user ? { user: req.user } : {}),
    })

    return Response.json({
      optimization: readOptimizationView((model as { viewerOptimization?: unknown }).viewerOptimization),
    })
  },
}
