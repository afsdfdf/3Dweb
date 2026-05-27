import type { PayloadRequest } from 'payload'

import { queryPostgres } from '@/lib/postgres'

import type { ModelOptimizationMode } from './config'
import { getModelOptimizationConfig } from './config'
import { enqueueModelOptimizationJob } from './queue'

const INTERNAL_ACCESS = true
const DEFAULT_BACKFILL_LIMIT = 10
const MAX_BACKFILL_LIMIT = 100

export type ModelOptimizationBackfillCandidate = {
  mediaId: number
  mimeType: string
  modelId: number
  ownerId: number
  sourceURL: string
}

export type ModelOptimizationBackfillJob = {
  jobId: number | string
  modelId: number
  sourceMediaId: number
  status: string
}

export type ModelOptimizationBackfillResult = {
  candidateCount: number
  candidates: ModelOptimizationBackfillCandidate[]
  dryRun: boolean
  enqueuedCount: number
  jobs: ModelOptimizationBackfillJob[]
  limit: number
}

type ModelOptimizationBackfillTestHooks = {
  queryPostgres?: typeof queryPostgres
}

let modelOptimizationBackfillTestHooks: ModelOptimizationBackfillTestHooks | null = null

export function __setModelOptimizationBackfillTestHooks(hooks: ModelOptimizationBackfillTestHooks | null) {
  modelOptimizationBackfillTestHooks = hooks
}

export function normalizeModelOptimizationBackfillLimit(value: unknown) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_BACKFILL_LIMIT

  return Math.min(MAX_BACKFILL_LIMIT, Math.floor(parsed))
}

const readOptionalPositiveId = (value: unknown) => {
  if (value === undefined || value === null || value === '') return null

  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : null
}

const readJobId = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim()) return value
  return ''
}

const readJobStatus = (value: unknown) => {
  if (value && typeof value === 'object' && !Array.isArray(value) && 'status' in value) {
    const status = (value as { status?: unknown }).status
    return typeof status === 'string' && status.trim() ? status.trim() : 'pending'
  }

  return 'pending'
}

export async function findModelOptimizationBackfillCandidates(args: {
  afterId?: null | number
  limit: number
  mode: ModelOptimizationMode
  modelId?: null | number
}) {
  const limit = normalizeModelOptimizationBackfillLimit(args.limit)
  const modelId = readOptionalPositiveId(args.modelId)
  const afterId = modelId ? null : readOptionalPositiveId(args.afterId)
  const query = modelOptimizationBackfillTestHooks?.queryPostgres || queryPostgres
  const result = await query<ModelOptimizationBackfillCandidate>(
    `
      select distinct on (models.id)
        models.id as "modelId",
        models.owner_id as "ownerId",
        media.id as "mediaId",
        coalesce(media.mime_type, 'model/gltf-binary') as "mimeType",
        media.url as "sourceURL"
      from models
      inner join models_formats mf on mf._parent_id = models.id
      inner join media on media.id = mf.file_id
      left join model_optimization_jobs existing
        on existing.job_key = concat('model:', models.id, ':source:', media.id, ':mode:', $1)
      where lower(mf.format::text) = 'glb'
        and media.url is not null
        and coalesce(models.viewer_optimization_status::text, 'none') <> 'succeeded'
        and existing.id is null
        and ($3::integer is null or models.id = $3::integer)
        and ($4::integer is null or models.id > $4::integer)
      order by models.id asc, mf._order asc
      limit $2
    `,
    [args.mode, limit, modelId, afterId],
  )

  return result.rows
}

export async function backfillModelOptimizationJobs(args: {
  afterId?: null | number
  dryRun?: boolean
  limit: number
  mode?: ModelOptimizationMode
  modelId?: null | number
  req: PayloadRequest
}): Promise<ModelOptimizationBackfillResult> {
  const config = getModelOptimizationConfig()
  const mode = args.mode || config.mode
  const limit = normalizeModelOptimizationBackfillLimit(args.limit)
  const candidates = await findModelOptimizationBackfillCandidates({
    afterId: args.afterId,
    limit,
    mode,
    modelId: args.modelId,
  })

  if (args.dryRun !== false) {
    return {
      candidateCount: candidates.length,
      candidates,
      dryRun: true,
      enqueuedCount: 0,
      jobs: [],
      limit,
    }
  }

  const jobs: ModelOptimizationBackfillJob[] = []

  for (const candidate of candidates) {
    const job = await enqueueModelOptimizationJob({
      mode,
      modelId: candidate.modelId,
      req: args.req,
      sourceMediaId: candidate.mediaId,
      sourceURL: candidate.sourceURL,
    })
    const status = readJobStatus(job)

    if (status === 'pending') {
      await args.req.payload.update({
        collection: 'models',
        data: {
          viewerOptimization: {
            mode,
            sourceFile: candidate.mediaId,
            status: 'pending',
          },
        },
        id: candidate.modelId,
        overrideAccess: INTERNAL_ACCESS,
        req: args.req,
      })
    }

    jobs.push({
      jobId: readJobId((job as { id?: unknown }).id),
      modelId: candidate.modelId,
      sourceMediaId: candidate.mediaId,
      status,
    })
  }

  return {
    candidateCount: candidates.length,
    candidates,
    dryRun: false,
    enqueuedCount: jobs.filter((job) => job.status === 'pending').length,
    jobs,
    limit,
  }
}
