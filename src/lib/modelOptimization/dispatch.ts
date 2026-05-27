import type { PayloadRequest } from 'payload'

import { getCanonicalAppURL } from '@/lib/getCanonicalAppURL'
import { getMediaAccessURL } from '@/lib/mediaAccessURL'
import {
  createSupabaseStorageSignedUploadUrl,
  getRuntimeStorageSettings,
} from '@/lib/supabase/storage'

import { getModelOptimizationConfig } from './config'
import { buildOptimizedModelPath } from './paths'
import { shouldRetryOptimizationJob } from './queue'

const INTERNAL_ACCESS = true

type DispatchTestHooks = {
  createSupabaseStorageSignedUploadUrl?: typeof createSupabaseStorageSignedUploadUrl
  fetch?: typeof fetch
  getMediaAccessURL?: typeof getMediaAccessURL
  getRuntimeStorageSettings?: typeof getRuntimeStorageSettings
}

let modelOptimizationDispatchTestHooks: DispatchTestHooks | null = null

export function __setModelOptimizationDispatchTestHooks(hooks: DispatchTestHooks | null) {
  modelOptimizationDispatchTestHooks = hooks
}

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

const getNestedText = (value: unknown, key: string) => {
  if (!isRecord(value)) return null
  const raw = value[key]
  return typeof raw === 'string' && raw.trim() ? raw.trim() : null
}

const getJobMode = (job: unknown) => {
  return isRecord(job) && job.mode === 'small' ? 'small' : 'conservative'
}

const getJobAttempts = (job: unknown) => {
  const attempts = Number(isRecord(job) ? job.attempts || 0 : 0)
  return Number.isFinite(attempts) && attempts > 0 ? attempts : 0
}

const getJobStatus = (job: unknown) => (isRecord(job) && typeof job.status === 'string' ? job.status : null)
const getJobLeaseExpiresAt = (job: unknown) =>
  isRecord(job) && typeof job.leaseExpiresAt === 'string' ? job.leaseExpiresAt : null
const getJobModel = (job: unknown) => (isRecord(job) && isRecord(job.model) ? job.model : null)
const getJobSourceFile = (job: unknown) => (isRecord(job) && isRecord(job.sourceFile) ? job.sourceFile : null)

const resolveSourceURL = (job: unknown) => {
  const sourceFile = getJobSourceFile(job)
  return getNestedText(sourceFile, 'url') || getNestedText(job, 'sourceUrl')
}

export async function dispatchModelOptimizationJob(args: {
  jobId: number
  req: PayloadRequest
}) {
  const config = getModelOptimizationConfig()

  if (!config.enabled || !config.workerURL || !config.callbackSecret) {
    return {
      dispatched: false,
      reason: 'disabled-or-unconfigured',
    }
  }

  const job = await args.req.payload.findByID({
    collection: 'model-optimization-jobs',
    depth: 2,
    id: args.jobId,
    overrideAccess: INTERNAL_ACCESS,
    req: args.req,
  })
  const attempts = getJobAttempts(job)
  const status = getJobStatus(job)
  const dispatchable =
    status === 'pending' ||
    shouldRetryOptimizationJob({
      attempts,
      leaseExpiresAt: getJobLeaseExpiresAt(job),
      status,
    })

  if (!dispatchable) {
    return {
      dispatched: false,
      reason: 'not-dispatchable',
    }
  }

  const model = getJobModel(job)
  const sourceFile = getJobSourceFile(job)
  const modelId = getRelationId(model || (isRecord(job) ? job.model : null))
  const sourceMediaId = getRelationId(sourceFile || (isRecord(job) ? job.sourceFile : null))
  const userId = getRelationId(model?.owner) || 0
  const sourceURL = resolveSourceURL(job)

  if (!modelId || !sourceMediaId || !sourceURL) {
    throw new Error('Optimization job is missing model, source file, or source URL.')
  }

  const storage = await (modelOptimizationDispatchTestHooks?.getRuntimeStorageSettings || getRuntimeStorageSettings)()
  if (!storage.enabled || storage.provider !== 'supabase-storage') {
    throw new Error('Supabase Storage is not enabled for model optimization.')
  }

  const mode = getJobMode(job)
  const nextAttempt = attempts + 1
  const accessURL =
    (await (modelOptimizationDispatchTestHooks?.getMediaAccessURL || getMediaAccessURL)({
      payload: args.req.payload,
      ttlSeconds: config.sourceURLTTLSeconds,
      url: sourceURL,
    })) || sourceURL
  const outputPath = buildOptimizedModelPath({
    attempt: nextAttempt,
    mode,
    modelId,
    prefix: storage.prefix,
    sourceMediaId,
    userId,
  })
  const signedUpload = await (
    modelOptimizationDispatchTestHooks?.createSupabaseStorageSignedUploadUrl ||
    createSupabaseStorageSignedUploadUrl
  )({
    bucket: storage.bucket,
    path: outputPath,
  })
  const now = new Date().toISOString()
  const leaseExpiresAt = new Date(Date.now() + config.jobTimeoutSeconds * 1000).toISOString()

  await args.req.payload.update({
    collection: 'model-optimization-jobs',
    data: {
      attempts: nextAttempt,
      completedAt: null,
      lastError: null,
      leaseExpiresAt,
      leaseOwner: 'model-optimization-dispatch',
      outputPath,
      outputUrl: signedUpload.publicUrl,
      startedAt: now,
      status: 'running',
    },
    id: args.jobId,
    overrideAccess: INTERNAL_ACCESS,
    req: args.req,
  })

  await args.req.payload.update({
    collection: 'models',
    data: {
      viewerOptimization: {
        attempts: nextAttempt,
        lastError: null,
        mode,
        previewFile: undefined,
        sourceFile: sourceMediaId,
        startedAt: now,
        status: 'running',
      },
    },
    id: modelId,
    overrideAccess: INTERNAL_ACCESS,
    req: args.req,
  })

  const callbackURL = `${getCanonicalAppURL()}/api/platform/model-optimization/callback`
  const workerBody = {
    callback: {
      url: callbackURL,
    },
    jobId: args.jobId,
    mode,
    source: {
      expectedContentType: getNestedText(sourceFile, 'mimeType') || 'model/gltf-binary',
      url: accessURL,
    },
    upload: {
      bucket: storage.bucket,
      contentType: 'model/gltf-binary',
      path: signedUpload.path,
      publicUrl: signedUpload.publicUrl,
      token: signedUpload.token,
    },
  }
  const response = await (modelOptimizationDispatchTestHooks?.fetch || fetch)(config.workerURL, {
    body: JSON.stringify(workerBody),
    headers: {
      'content-type': 'application/json',
      'x-model-optimization-secret': config.callbackSecret,
    },
    method: 'POST',
  })

  if (!response.ok) {
    const message = `Model optimization worker dispatch failed with ${response.status}.`
    await args.req.payload.update({
      collection: 'models',
      data: {
        viewerOptimization: {
          attempts: nextAttempt,
          lastError: message,
          mode,
          sourceFile: sourceMediaId,
          status: 'failed',
        },
      },
      id: modelId,
      overrideAccess: INTERNAL_ACCESS,
      req: args.req,
    })

    await args.req.payload.update({
      collection: 'model-optimization-jobs',
      data: {
        completedAt: new Date().toISOString(),
        lastError: message,
        status: 'failed',
      },
      id: args.jobId,
      overrideAccess: INTERNAL_ACCESS,
      req: args.req,
    })

    return {
      dispatched: false,
      reason: message,
    }
  }

  return {
    dispatched: true,
    outputPath,
    outputURL: signedUpload.publicUrl,
  }
}
