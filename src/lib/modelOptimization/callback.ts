import type { PayloadRequest } from 'payload'

import { getModelOptimizationConfig } from './config'

const INTERNAL_ACCESS = true

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

const getRelationId = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  if (isRecord(value)) return getRelationId(value.id)
  return null
}

const getJobModel = (job: unknown) => (isRecord(job) && isRecord(job.model) ? job.model : null)

const getJobMode = (job: unknown) => {
  if (!isRecord(job)) return 'conservative'
  return job.mode === 'small' ? 'small' : 'conservative'
}

const getOutputFilename = (args: { mode: string; modelId: number; outputPath: string }) => {
  const filename = args.outputPath.split('/').pop()?.trim()
  return filename?.toLowerCase().endsWith('.glb') ? filename : `model-${args.modelId}-preview-${args.mode}.glb`
}

const getJobAttempts = (job: unknown) => {
  if (!isRecord(job)) return 0
  const attempts = Number(job.attempts || 0)
  return Number.isFinite(attempts) && attempts > 0 ? attempts : 0
}

const getModelOwnerId = (model: Record<string, unknown> | null) => {
  if (!model) return null
  return getRelationId(model.owner)
}

const getModelVisibility = (model: Record<string, unknown> | null) => {
  return typeof model?.visibility === 'string' ? model.visibility : null
}

export function verifyModelOptimizationCallback(req: Pick<PayloadRequest, 'headers'>) {
  const config = getModelOptimizationConfig()
  const received = req.headers.get('x-model-optimization-secret') || ''

  return Boolean(config.callbackSecret) && received === config.callbackSecret
}

export async function completeModelOptimizationJob(args: {
  jobId: number
  output: {
    bytes: number
    mb: number
    path: string
    publicUrl: string
  }
  reductionPercent: number
  req: PayloadRequest
  source: {
    bytes: number
    mb: number
  }
  timingsMs: Record<string, number>
  workerRunId: string
}) {
  const job = await args.req.payload.findByID({
    collection: 'model-optimization-jobs',
    depth: 2,
    id: args.jobId,
    overrideAccess: INTERNAL_ACCESS,
    req: args.req,
  })

  if (isRecord(job) && job.status === 'succeeded') {
    return job
  }

  const model = getJobModel(job)
  const modelId = getRelationId(model || (isRecord(job) ? job.model : null))
  const sourceFileId = getRelationId(isRecord(job) ? job.sourceFile : null)

  if (!modelId) {
    throw new Error('Optimization job is missing a model relation.')
  }

  const mode = getJobMode(job)
  const media = await args.req.payload.create({
    collection: 'media',
    context: {
      allowManagedMediaVisibility: true,
    },
    data: {
      alt: `Model ${modelId} optimized GLB preview`,
      filename: getOutputFilename({ mode, modelId, outputPath: args.output.path }),
      filesize: args.output.bytes,
      mimeType: 'model/gltf-binary',
      owner: getModelOwnerId(model) || undefined,
      publicAccess: getModelVisibility(model) === 'public',
      purpose: 'model',
      thumbnailURL: args.output.publicUrl,
      url: args.output.publicUrl,
    },
    overrideAccess: INTERNAL_ACCESS,
    req: args.req,
  })

  await args.req.payload.update({
    collection: 'models',
    data: {
      viewerOptimization: {
        attempts: getJobAttempts(job),
        completedAt: new Date().toISOString(),
        lastError: null,
        mode,
        outputSizeMb: args.output.mb,
        previewFile: Number(media.id),
        reductionPercent: args.reductionPercent,
        sourceFile: sourceFileId || undefined,
        sourceSizeMb: args.source.mb,
        status: 'succeeded',
      },
    },
    id: modelId,
    overrideAccess: INTERNAL_ACCESS,
    req: args.req,
  })

  return args.req.payload.update({
    collection: 'model-optimization-jobs',
    data: {
      completedAt: new Date().toISOString(),
      metrics: {
        timingsMs: args.timingsMs,
      },
      outputFile: Number(media.id),
      outputPath: args.output.path,
      outputSizeMb: args.output.mb,
      outputUrl: args.output.publicUrl,
      reductionPercent: args.reductionPercent,
      sourceSizeMb: args.source.mb,
      status: 'succeeded',
      workerRunId: args.workerRunId,
    },
    id: args.jobId,
    overrideAccess: INTERNAL_ACCESS,
    req: args.req,
  })
}

export async function failModelOptimizationJob(args: {
  error: string
  jobId: number
  req: PayloadRequest
  timingsMs?: Record<string, number>
  workerRunId?: string
}) {
  const job = await args.req.payload.findByID({
    collection: 'model-optimization-jobs',
    depth: 1,
    id: args.jobId,
    overrideAccess: INTERNAL_ACCESS,
    req: args.req,
  })
  const modelId = getRelationId(isRecord(job) ? job.model : null)
  const attempts = getJobAttempts(job)

  if (modelId) {
    await args.req.payload.update({
      collection: 'models',
      data: {
        viewerOptimization: {
          attempts,
          lastError: args.error,
          mode: getJobMode(job),
          status: 'failed',
        },
      },
      id: modelId,
      overrideAccess: INTERNAL_ACCESS,
      req: args.req,
    })
  }

  return args.req.payload.update({
    collection: 'model-optimization-jobs',
    data: {
      completedAt: new Date().toISOString(),
      lastError: args.error,
      metrics: args.timingsMs ? { timingsMs: args.timingsMs } : undefined,
      status: 'failed',
      workerRunId: args.workerRunId,
    },
    id: args.jobId,
    overrideAccess: INTERNAL_ACCESS,
    req: args.req,
  })
}
