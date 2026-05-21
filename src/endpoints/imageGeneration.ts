import type { PayloadRequest } from 'payload'

import { InsufficientCreditsError } from '@/lib/creditLedger'
import { rejectRateLimitedEndpoint } from '@/lib/endpointRateLimit'
import { runImageGenerationTask, submitImageGeneration } from '@/lib/imageGenerationFlow'
import { ensurePayloadRequestUser } from '@/lib/payloadAuthFallback'
import { rejectDisallowedMutationOrigin } from '@/lib/requestSecurity'
import {
  applyWorkbenchSourceImageAssetsToSnapshot,
  validateWorkbenchSourceImageAssets,
} from '@/lib/workbenchSourceAssets'

const unauthorized = () => Response.json({ message: 'Please sign in first.' }, { status: 401 })

type ImageGenerationEndpointTestHooks = {
  runImageGenerationTask?: typeof runImageGenerationTask
  scheduleAfterResponse?: (task: () => Promise<void>) => void
  submitImageGeneration?: typeof submitImageGeneration
}

let imageGenerationEndpointTestHooks: ImageGenerationEndpointTestHooks | null = null

type ImageGenerationWorkItem = {
  reject: (error: unknown) => void
  resolve: () => void
  scheduledAt?: number
  task: () => Promise<void>
  taskId?: number
}

let activeImageGenerationWorkCount = 0
const queuedImageGenerationWork: ImageGenerationWorkItem[] = []
const scheduledImageGenerationTaskIds = new Map<number, number>()
let imageGenerationWorkConcurrencyLimit = 20
let imageGenerationWorkPumpTimer: ReturnType<typeof setTimeout> | null = null
let lastImageGenerationWorkerStartAt = 0

const DEFAULT_IMAGE_GENERATION_SCHEDULED_TASK_TTL_MS = 900_000
const DEFAULT_IMAGE_GENERATION_WORKER_START_INTERVAL_MS = 500

export function __setImageGenerationEndpointTestHooks(hooks: ImageGenerationEndpointTestHooks | null) {
  imageGenerationEndpointTestHooks = hooks
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

const normalizeImageGenerationParameterSnapshot = (args: {
  parameterSnapshot?: Record<string, unknown>
  sourceImageAsset?: Record<string, unknown>
  sourceImageAssets?: Record<string, unknown>[]
}) => {
  return applyWorkbenchSourceImageAssetsToSnapshot(args)
}

const normalizeImageGenerationProvider = (value: unknown) => {
  if (value === 'gemini-official' || value === 'gemini-third-party' || value === 'openai-compatible') {
    return value
  }

  return undefined
}

const getImageGenerationWorkConcurrencyLimit = () => {
  const configuredValue = Number(imageGenerationWorkConcurrencyLimit || process.env.IMAGE_GENERATION_MAX_CONCURRENT_TASKS || 20)
  return Number.isFinite(configuredValue) && configuredValue > 0 ? Math.max(1, Math.floor(configuredValue)) : 20
}

const readPositiveInteger = (value: unknown, fallback: number) => {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) && numberValue > 0 ? Math.max(1, Math.floor(numberValue)) : fallback
}

const readNonNegativeInteger = (value: unknown, fallback: number) => {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) && numberValue >= 0 ? Math.floor(numberValue) : fallback
}

const getImageGenerationScheduledTaskTTL = () => {
  return readNonNegativeInteger(
    process.env.IMAGE_GENERATION_SCHEDULED_TASK_TTL_MS,
    DEFAULT_IMAGE_GENERATION_SCHEDULED_TASK_TTL_MS,
  )
}

const getImageGenerationWorkerStartIntervalMs = () => {
  return readNonNegativeInteger(
    process.env.IMAGE_GENERATION_WORKER_START_INTERVAL_MS,
    DEFAULT_IMAGE_GENERATION_WORKER_START_INTERVAL_MS,
  )
}

const resolveImageGenerationWorkConcurrencyLimit = async (req: PayloadRequest) => {
  const envFallback = readPositiveInteger(process.env.IMAGE_GENERATION_MAX_CONCURRENT_TASKS, 20)
  const payload = req.payload as PayloadRequest['payload'] & {
    findGlobal?: PayloadRequest['payload']['findGlobal']
  }

  if (typeof payload.findGlobal !== 'function') {
    return envFallback
  }

  const config = await payload
    .findGlobal({
      overrideAccess: true,
      slug: 'ai-provider-settings',
    })
    .catch(() => null)
  const imageGeneration = isRecord(config?.imageGeneration) ? config.imageGeneration : {}

  return readPositiveInteger(imageGeneration.maxConcurrentTasks, envFallback)
}

const refreshImageGenerationWorkConcurrencyLimit = async (req: PayloadRequest) => {
  imageGenerationWorkConcurrencyLimit = await resolveImageGenerationWorkConcurrencyLimit(req)
  pumpImageGenerationWorkQueue()
}

const scheduleImageGenerationWorkPump = (delayMs = 0) => {
  if (imageGenerationWorkPumpTimer) return

  imageGenerationWorkPumpTimer = setTimeout(() => {
    imageGenerationWorkPumpTimer = null
    pumpImageGenerationWorkQueue()
  }, Math.max(0, delayMs))
}

const pumpImageGenerationWorkQueue = () => {
  const limit = getImageGenerationWorkConcurrencyLimit()

  while (activeImageGenerationWorkCount < limit && queuedImageGenerationWork.length > 0) {
    const startIntervalMs = getImageGenerationWorkerStartIntervalMs()
    const nextStartDelayMs =
      startIntervalMs > 0 && lastImageGenerationWorkerStartAt > 0
        ? startIntervalMs - (Date.now() - lastImageGenerationWorkerStartAt)
        : 0

    if (nextStartDelayMs > 0) {
      scheduleImageGenerationWorkPump(nextStartDelayMs)
      return
    }

    const item = queuedImageGenerationWork.shift()
    if (!item) return

    activeImageGenerationWorkCount += 1
    lastImageGenerationWorkerStartAt = Date.now()
    void item
      .task()
      .then(item.resolve, item.reject)
      .finally(() => {
        activeImageGenerationWorkCount = Math.max(0, activeImageGenerationWorkCount - 1)
        if (item.taskId && scheduledImageGenerationTaskIds.get(item.taskId) === item.scheduledAt) {
          scheduledImageGenerationTaskIds.delete(item.taskId)
        }
        pumpImageGenerationWorkQueue()
      })
  }
}

const isImageGenerationTaskAlreadyScheduled = (taskId: number) => {
  const scheduledAt = scheduledImageGenerationTaskIds.get(taskId)
  if (!scheduledAt) return false

  if (Date.now() - scheduledAt > getImageGenerationScheduledTaskTTL()) {
    scheduledImageGenerationTaskIds.delete(taskId)
    return false
  }

  return true
}

const enqueueImageGenerationWork = (task: () => Promise<void>, taskId?: number) => {
  if (taskId && isImageGenerationTaskAlreadyScheduled(taskId)) {
    return Promise.resolve()
  }

  const scheduledAt = Date.now()
  if (taskId) {
    scheduledImageGenerationTaskIds.set(taskId, scheduledAt)
  }

  return new Promise<void>((resolve, reject) => {
    queuedImageGenerationWork.push({
      reject,
      resolve,
      scheduledAt,
      task,
      taskId,
    })
    scheduleImageGenerationWorkPump()
  })
}

const scheduleImageGenerationWork = (task: () => Promise<void>, taskId?: number) => {
  const queuedTask = () => enqueueImageGenerationWork(task, taskId)

  if (imageGenerationEndpointTestHooks?.scheduleAfterResponse) {
    imageGenerationEndpointTestHooks.scheduleAfterResponse(queuedTask)
    return
  }

  let started = false
  const runOnce = () => {
    if (started) return
    started = true
    void queuedTask()
  }
  const fallbackTimer = setTimeout(runOnce, 0)

  void import('next/server')
    .then(({ after }) => {
      after(() => {
        clearTimeout(fallbackTimer)
        runOnce()
      })
    })
    .catch(() => {
      clearTimeout(fallbackTimer)
      runOnce()
    })
}

const isRunnableImageGenerationStatus = (value: unknown) => {
  return value === 'queued' || value === 'processing'
}

const scheduleTaskRun = (args: { req: PayloadRequest; taskId: number }) => {
  void refreshImageGenerationWorkConcurrencyLimit(args.req).catch((error) => {
    args.req.payload.logger.warn(
      {
        err: error,
        taskId: args.taskId,
      },
      'Image generation worker concurrency refresh failed; using current limit.',
    )
  })

  scheduleImageGenerationWork(async () => {
    try {
      await (imageGenerationEndpointTestHooks?.runImageGenerationTask || runImageGenerationTask)({
        req: args.req,
        taskId: args.taskId,
      })
    } catch (error) {
      args.req.payload.logger.error(
        {
          err: error,
          taskId: args.taskId,
        },
        'Image generation background worker failed.',
      )
    }
  }, args.taskId)
}

export const submitImageGenerationEndpoint = {
  path: '/studio/ai/images',
  method: 'post' as const,
  handler: async (req: PayloadRequest) => {
    const blocked = await rejectDisallowedMutationOrigin(req)
    if (blocked) return blocked

    await ensurePayloadRequestUser(req)
    if (!req.user) return unauthorized()

    const rateLimited = await rejectRateLimitedEndpoint({
      req,
      scope: 'ai-image-submit',
    })
    if (rateLimited) return rateLimited

    try {
      const body = req.json ? await req.json() : {}
      const inputMode = body.inputMode === 'image' ? 'image' : 'text'
      const { sourceImageAsset, sourceImageAssets } = await validateWorkbenchSourceImageAssets({
        maxAssets: 1,
        req,
        sourceImageAsset: body.sourceImageAsset,
        sourceImageAssets: body.sourceImageAssets,
      })
      const parameterSnapshot = normalizeImageGenerationParameterSnapshot({
        parameterSnapshot: isRecord(body.parameterSnapshot) ? body.parameterSnapshot : undefined,
        sourceImageAsset,
        sourceImageAssets,
      })
      const result = await (imageGenerationEndpointTestHooks?.submitImageGeneration || submitImageGeneration)({
        dispatchProvider: false,
        inputMode,
        parameterSnapshot,
        prompt: String(body.prompt || ''),
        provider: normalizeImageGenerationProvider(body.provider),
        req,
        sourceImage: typeof body.sourceImage === 'number' ? body.sourceImage : undefined,
        sourceImageAsset,
      })

      const taskId = readNumber((result.task as unknown as Record<string, unknown>)?.id)
      if (!taskId) {
        return Response.json({ message: 'Image generation task was not created.' }, { status: 400 })
      }

      if (!imageGenerationEndpointTestHooks?.submitImageGeneration || imageGenerationEndpointTestHooks.runImageGenerationTask) {
        scheduleTaskRun({ req, taskId })
      }

      return Response.json(
        {
          media: result.media,
          message: 'Image generation task submitted.',
          next: {
            syncEndpoint: `/api/studio/ai/images/${taskId}/sync`,
          },
          task: result.task,
        },
        { status: 202 },
      )
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Image generation failed.'
      const status = error instanceof InsufficientCreditsError ? 402 : 400
      return Response.json({ message }, { status })
    }
  },
}

export const syncImageGenerationEndpoint = {
  path: '/studio/ai/images/:taskId/sync',
  method: 'post' as const,
  handler: async (req: PayloadRequest) => {
    const blocked = await rejectDisallowedMutationOrigin(req)
    if (blocked) return blocked

    await ensurePayloadRequestUser(req)
    if (!req.user) return unauthorized()

    const rateLimited = await rejectRateLimitedEndpoint({
      req,
      scope: 'ai-sync',
    })
    if (rateLimited) return rateLimited

    const taskId = Number(String(req.routeParams?.taskId ?? '0'))
    const tasks = await req.payload.find({
      collection: 'generation-tasks',
      depth: 0,
      limit: 1,
      overrideAccess: false,
      pagination: false,
      req,
      user: req.user,
      where: {
        and: [
          {
            id: {
              equals: taskId,
            },
          },
          {
            user: {
              equals: req.user.id,
            },
          },
        ],
      },
    })

    const task = tasks.docs[0] as unknown as Record<string, unknown> | undefined
    if (!task) {
      return Response.json({ message: 'Task not found.' }, { status: 404 })
    }

    const mediaId = getResultMediaId(task)
    const media = mediaId
      ? await req.payload
          .findByID({
            collection: 'media',
            depth: 0,
            id: mediaId,
            overrideAccess: false,
            req,
            user: req.user,
          })
          .catch(() => null)
      : null

    if (!media && isRunnableImageGenerationStatus(task.status)) {
      scheduleTaskRun({ req, taskId })
    }

    return Response.json({
      media,
      message: 'Image generation task sync completed.',
      task,
    })
  },
}

const readNumber = (value: unknown) => {
  const numberValue = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : 0
}

const readString = (value: unknown) => {
  return typeof value === 'string' && value.trim() ? value.trim() : ''
}

type ImageMediaRecord = Record<string, unknown>

const getResultMediaId = (task: Record<string, unknown>) => {
  const callbackPayload = isRecord(task.callbackPayload) ? task.callbackPayload : {}
  const imageGeneration = isRecord(callbackPayload.imageGeneration) ? callbackPayload.imageGeneration : {}
  return readNumber(imageGeneration.resultMediaId)
}

export const listImageGenerationAssetsEndpoint = {
  path: '/studio/ai/images',
  method: 'get' as const,
  handler: async (req: PayloadRequest) => {
    await ensurePayloadRequestUser(req)
    if (!req.user) return unauthorized()

    const tasks = await req.payload.find({
      collection: 'generation-tasks',
      depth: 0,
      limit: 24,
      overrideAccess: false,
      pagination: false,
      req,
      sort: '-updatedAt',
      user: req.user,
      where: {
        and: [
          {
            user: {
              equals: req.user.id,
            },
          },
          {
            status: {
              equals: 'succeeded',
            },
          },
          {
            provider: {
              in: ['gemini-official', 'gemini-third-party', 'openai-compatible'],
            },
          },
        ],
      },
    })

    const mediaById = new Map<number, ImageMediaRecord>()
    await Promise.all(
      tasks.docs.map(async (task) => {
        const mediaId = getResultMediaId(task as unknown as Record<string, unknown>)
        if (!mediaId || mediaById.has(mediaId)) return

        const media = await req.payload
          .findByID({
            collection: 'media',
            depth: 0,
            id: mediaId,
            overrideAccess: false,
            req,
            user: req.user,
          })
          .catch(() => null)

        if (media) {
          mediaById.set(mediaId, media as unknown as ImageMediaRecord)
        }
      }),
    )

    const assets = tasks.docs
      .map((task) => {
        const taskRecord = task as unknown as Record<string, unknown>
        const mediaId = getResultMediaId(taskRecord)
        const media = mediaById.get(mediaId)
        const publicUrl = readString(media?.url) || readString(media?.thumbnailURL)

        if (!media || !publicUrl) return null

        return {
          createdAt: readString(taskRecord.createdAt) || readString(media.createdAt),
          media: {
            id: mediaId,
            filename: readString(media.filename) || `image-${mediaId}.png`,
            mimeType: readString(media.mimeType) || 'image/png',
            thumbnailURL: readString(media.thumbnailURL) || publicUrl,
            url: publicUrl,
          },
          taskId: readNumber(taskRecord.id),
        }
      })
      .filter(Boolean)

    return Response.json({ assets })
  },
}
