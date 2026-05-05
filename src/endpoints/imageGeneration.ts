import type { PayloadRequest } from 'payload'

import { InsufficientCreditsError } from '@/lib/creditLedger'
import { rejectRateLimitedEndpoint } from '@/lib/endpointRateLimit'
import { runImageGenerationTask, submitImageGeneration } from '@/lib/imageGenerationFlow'
import { ensurePayloadRequestUser } from '@/lib/payloadAuthFallback'
import { rejectDisallowedMutationOrigin } from '@/lib/requestSecurity'

const unauthorized = () => Response.json({ message: 'Please sign in first.' }, { status: 401 })

type ImageGenerationEndpointTestHooks = {
  runImageGenerationTask?: typeof runImageGenerationTask
  scheduleAfterResponse?: (task: () => Promise<void>) => void
  submitImageGeneration?: typeof submitImageGeneration
}

let imageGenerationEndpointTestHooks: ImageGenerationEndpointTestHooks | null = null

export function __setImageGenerationEndpointTestHooks(hooks: ImageGenerationEndpointTestHooks | null) {
  imageGenerationEndpointTestHooks = hooks
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

const normalizeSourceImageAssets = (value: unknown) => {
  return Array.isArray(value) ? value.filter(isRecord) : []
}

const normalizeImageGenerationProvider = (value: unknown) => {
  if (value === 'gemini-official' || value === 'gemini-third-party' || value === 'openai-compatible') {
    return value
  }

  return undefined
}

const scheduleImageGenerationWork = (task: () => Promise<void>) => {
  if (imageGenerationEndpointTestHooks?.scheduleAfterResponse) {
    imageGenerationEndpointTestHooks.scheduleAfterResponse(task)
    return
  }

  void import('next/server')
    .then(({ after }) => {
      after(() => task())
    })
    .catch(() => {
      void task()
    })
}

const isRunnableImageGenerationStatus = (value: unknown) => {
  return value === 'queued' || value === 'processing'
}

const scheduleTaskRun = (args: { req: PayloadRequest; taskId: number }) => {
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
  })
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
      const sourceImageAssets = normalizeSourceImageAssets(body.sourceImageAssets)

      if (sourceImageAssets.length > 1) {
        return Response.json(
          { message: 'Image generation accepts one source image. Use Image to 3D for multi-image model generation.' },
          { status: 400 },
        )
      }

      const sourceImageAsset = isRecord(body.sourceImageAsset) ? body.sourceImageAsset : sourceImageAssets[0]
      const result = await (imageGenerationEndpointTestHooks?.submitImageGeneration || submitImageGeneration)({
        dispatchProvider: false,
        inputMode,
        parameterSnapshot: isRecord(body.parameterSnapshot) ? body.parameterSnapshot : undefined,
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
