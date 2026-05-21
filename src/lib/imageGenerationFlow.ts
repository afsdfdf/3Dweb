import type { PayloadRequest } from 'payload'

import {
  assertTaskCreditsAvailable,
  refundTaskCredits,
  reserveTaskCredits,
  settleReservedTaskCredits,
  spendTaskCredits,
} from '@/lib/creditLedger'
import {
  generateProviderImage,
  resolveImageGenerationProvider,
  type ImageGenerationProvider,
} from '@/lib/geminiImageGateway'
import { createGenerationTaskNotification } from '@/lib/notificationService'
import { uploadToSupabaseStorage, getRuntimeStorageSettings } from '@/lib/supabase/storage'
import {
  defaultTaskCreditRules,
  getTaskBillingSettings,
  readTaskBillingSnapshot,
  resolveGenerationCredits,
} from '@/lib/taskBilling'

type SubmitImageGenerationArgs = {
  dispatchProvider?: boolean
  inputMode: 'image' | 'text'
  parameterSnapshot?: Record<string, unknown>
  prompt: string
  provider?: ImageGenerationProvider
  req: PayloadRequest
  sourceImage?: number
  sourceImageAsset?: Record<string, unknown>
}

type RunImageGenerationTaskArgs = {
  req: PayloadRequest
  taskId: number
}

type GenerateProviderImageArgs = Parameters<typeof generateProviderImage>[0]
type GeneratedProviderImage = Awaited<ReturnType<typeof generateProviderImage>>

const imageGenerationTaskLocks = new Set<number>()
const INTERNAL_ACCESS = true
const IMAGE_GENERATION_PROVIDER_MAX_ATTEMPTS = 2
const DEFAULT_IMAGE_GENERATION_PROVIDER_RETRY_DELAY_MS = 15_000
const DEFAULT_IMAGE_GENERATION_DISPATCH_STALE_MS = 900_000

const accessOptions = (req: PayloadRequest) => {
  return req.user ? { overrideAccess: false as const } : {}
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

const readString = (value: unknown) => {
  return typeof value === 'string' && value.trim() ? value.trim() : ''
}

const readNumber = (value: unknown) => {
  const numberValue = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : 0
}

const readErrorMessage = (error: unknown) => {
  return error instanceof Error ? error.message : String(error || 'Image generation failed.')
}

const getImageGenerationRetryDelayMs = () => {
  const configuredValue = Number(
    process.env.IMAGE_GENERATION_PROVIDER_RETRY_DELAY_MS || DEFAULT_IMAGE_GENERATION_PROVIDER_RETRY_DELAY_MS,
  )
  return Number.isFinite(configuredValue) ? Math.max(0, configuredValue) : DEFAULT_IMAGE_GENERATION_PROVIDER_RETRY_DELAY_MS
}

const sleep = (delayMs: number) => {
  if (delayMs <= 0) return Promise.resolve()
  return new Promise((resolve) => setTimeout(resolve, delayMs))
}

const isRetryableImageGenerationError = (error: unknown) => {
  const name = error instanceof Error ? error.name : ''
  const message = readErrorMessage(error)
  const errorText = `${name} ${message}`.toLowerCase()

  if (
    /api key is not configured|base url is not configured|model is not configured/.test(errorText) ||
    /prompt is required|requires a source image|source image fetch|accessible url/.test(errorText) ||
    /unauthorized|forbidden|permission denied|invalid api key|authentication/.test(errorText) ||
    /\b(?:400|401|403|404)\b/.test(errorText)
  ) {
    return false
  }

  return (
    /timeout|timed out|abort|temporarily unavailable|try again later|overloaded|server error|server_error|internal_server_error/.test(errorText) ||
    /stream.*(?:disconnect|closed|ended|aborted)|disconnect(?:ed)? before completion|connection.*(?:reset|closed)|terminated/.test(errorText) ||
    /rate limit|rate_limit|too many requests|concurrent|concurrency/.test(errorText) ||
    /\b(?:408|429|500|502|503|504)\b/.test(errorText) ||
    /econnreset|etimedout|eai_again|socket hang up|network error|fetch failed/.test(errorText)
  )
}

const readTaskUserId = (task: { user?: unknown }) => {
  if (isRecord(task.user)) {
    return readNumber(task.user.id)
  }

  return readNumber(task.user)
}

const readImageGenerationSnapshot = (parameterSnapshot: unknown) => {
  if (!isRecord(parameterSnapshot)) return {}
  return isRecord(parameterSnapshot.imageGeneration) ? parameterSnapshot.imageGeneration : {}
}

const readImageGenerationEffectivePrompt = (parameterSnapshot: unknown) => {
  const imageGeneration = readImageGenerationSnapshot(parameterSnapshot)
  return readString(imageGeneration.effectivePrompt)
}

const getImageGenerationDispatchStaleMs = () => {
  const configuredValue = Number(process.env.IMAGE_GENERATION_DISPATCH_STALE_MS || DEFAULT_IMAGE_GENERATION_DISPATCH_STALE_MS)
  return Number.isFinite(configuredValue)
    ? Math.max(60_000, configuredValue)
    : DEFAULT_IMAGE_GENERATION_DISPATCH_STALE_MS
}

const hasRecentImageGenerationDispatch = (task: Record<string, unknown>) => {
  if (task.status !== 'processing') return false

  const imageGeneration = readImageGenerationSnapshot(task.parameterSnapshot)
  const dispatchStartedAt = readString(imageGeneration.dispatchStartedAt)
  if (!dispatchStartedAt) return false

  const dispatchStartedAtMs = new Date(dispatchStartedAt).getTime()
  if (!Number.isFinite(dispatchStartedAtMs) || dispatchStartedAtMs <= 0) return false

  return Date.now() - dispatchStartedAtMs < getImageGenerationDispatchStaleMs()
}

const USER_PROMPT_PLACEHOLDER = '{user_prompt}'
const EMPTY_IMAGE_PROMPT_SUBJECT = 'the provided reference image'

const buildEffectiveImagePrompt = (args: { defaultPrompt: string; prompt: string }) => {
  const defaultPrompt = args.defaultPrompt.trim()
  const prompt = args.prompt.trim()

  if (!defaultPrompt) return prompt
  if (defaultPrompt.includes(USER_PROMPT_PLACEHOLDER)) {
    return defaultPrompt.replaceAll(USER_PROMPT_PLACEHOLDER, prompt || EMPTY_IMAGE_PROMPT_SUBJECT)
  }
  if (!prompt) return defaultPrompt

  return `${defaultPrompt}\n\nUser prompt:\n${prompt}`
}

const sanitizePathPart = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

const randomCode = (prefix: string) => {
  const date = new Date()
  const stamp = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(
    2,
    '0',
  )}${String(date.getHours()).padStart(2, '0')}${String(date.getMinutes()).padStart(2, '0')}${String(date.getSeconds()).padStart(2, '0')}`

  return `${prefix}-${stamp}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
}

const getImageExtension = (mimeType: string) => {
  const normalized = mimeType.toLowerCase()
  if (normalized === 'image/jpeg') return 'jpg'
  if (normalized === 'image/webp') return 'webp'
  return 'png'
}

async function createTaskEvent(args: {
  eventType: 'completed' | 'failed' | 'queued' | 'submitted'
  message: string
  payload?: Record<string, unknown>
  provider: string
  req: PayloadRequest
  taskId: number
  userId: number
}) {
  await args.req.payload.create({
    collection: 'task-events',
    data: {
      eventType: args.eventType,
      message: args.message,
      payload: args.payload,
      provider: args.provider,
      task: args.taskId,
      user: args.userId,
    },
    overrideAccess: INTERNAL_ACCESS,
    req: args.req,
  })

  if (args.eventType === 'completed' || args.eventType === 'failed') {
    await createGenerationTaskNotification({
      eventType: args.eventType,
      message: args.message,
      req: args.req,
      taskId: args.taskId,
      userId: args.userId,
    }).catch((error) => {
      args.req.payload.logger?.error?.({
        err: error,
        msg: `Failed to create notification for image task ${args.taskId}.`,
      })
    })
  }
}

async function generateProviderImageWithRetry(args: {
  dispatchStartedAt: string
  generationArgs: GenerateProviderImageArgs
  imageGenerationSnapshot: Record<string, unknown>
  provider: string
  req: PayloadRequest
  snapshot: Record<string, unknown>
  task: { id: number; progress?: unknown }
  userId: number
}): Promise<GeneratedProviderImage> {
  const retryDelayMs = getImageGenerationRetryDelayMs()
  let lastError: unknown

  for (let attempt = 1; attempt <= IMAGE_GENERATION_PROVIDER_MAX_ATTEMPTS; attempt += 1) {
    try {
      return await generateProviderImage(args.generationArgs)
    } catch (error) {
      lastError = error
      const canRetry = attempt < IMAGE_GENERATION_PROVIDER_MAX_ATTEMPTS && isRetryableImageGenerationError(error)

      if (!canRetry) {
        throw error
      }

      const retryReason = readErrorMessage(error)
      const retryAt = new Date().toISOString()

      args.req.payload.logger?.warn?.({
        err: error,
        msg: `Image generation provider attempt ${attempt} failed; retrying task ${args.task.id}.`,
        taskId: args.task.id,
      })

      await args.req.payload.update({
        collection: 'generation-tasks',
        data: {
          parameterSnapshot: {
            ...args.snapshot,
            imageGeneration: {
              ...args.imageGenerationSnapshot,
              dispatchStartedAt: args.dispatchStartedAt,
              lastRetryAt: retryAt,
              lastRetryReason: retryReason,
              retryCount: attempt,
              taskType: 'image-generation',
            },
          },
          progress: Math.max(readNumber(args.task.progress), 35),
          status: 'processing',
        },
        id: args.task.id,
        req: args.req,
        overrideAccess: INTERNAL_ACCESS,
      })

      await createTaskEvent({
        eventType: 'submitted',
        message: 'Image generation provider failed transiently; retrying once.',
        payload: {
          attempt,
          maxAttempts: IMAGE_GENERATION_PROVIDER_MAX_ATTEMPTS,
          retryDelayMs,
          retryReason,
        },
        provider: args.provider,
        req: args.req,
        taskId: args.task.id,
        userId: args.userId,
      })

      await sleep(retryDelayMs)
    }
  }

  throw lastError instanceof Error ? lastError : new Error(readErrorMessage(lastError))
}

async function readImageGenerationDefaultPrompt(req: PayloadRequest) {
  const config = await req.payload
    .findGlobal({
      slug: 'ai-provider-settings',
      overrideAccess: true,
    })
    .catch(() => null)
  const imageGeneration = isRecord(config?.imageGeneration) ? config.imageGeneration : {}

  return readString(imageGeneration.defaultPrompt)
}

async function uploadGeneratedImage(args: {
  buffer: Buffer
  contentType: string
  taskCode: string
  userId: number
}) {
  const storage = await getRuntimeStorageSettings()
  const safeTaskCode = sanitizePathPart(args.taskCode) || 'image-task'
  const safeUserId = sanitizePathPart(`user-${args.userId}`) || 'user'
  const extension = getImageExtension(args.contentType)
  const objectPath = `${storage.prefix.replace(/^\/+|\/+$/g, '')}/generated-images/${safeUserId}/${safeTaskCode}/${safeTaskCode}.${extension}`

  return uploadToSupabaseStorage({
    bucket: storage.bucket,
    contentType: args.contentType,
    path: objectPath,
    upsert: true,
    value: args.buffer,
  })
}

async function createGeneratedMediaRecord(args: {
  contentType: string
  fileSize: number
  filename: string
  req: PayloadRequest
  url: string
  userId: number
}) {
  return args.req.payload.create({
    collection: 'media',
    data: {
      alt: args.filename,
      filename: args.filename,
      filesize: args.fileSize,
      mimeType: args.contentType,
      owner: args.userId,
      publicAccess: false,
      purpose: 'asset',
      thumbnailURL: args.url,
      url: args.url,
    },
    req: args.req,
    ...accessOptions(args.req),
  })
}

export async function createImageGenerationTask(args: SubmitImageGenerationArgs) {
  const { inputMode, parameterSnapshot, prompt, provider, req, sourceImage, sourceImageAsset } = args

  if (!req.user) {
    throw new Error('Unauthorized')
  }

  const trimmedPrompt = prompt.trim()
  if (inputMode === 'image' && !sourceImage && !sourceImageAsset) {
    throw new Error('Image-to-image generation requires a source image.')
  }
  if (inputMode === 'text' && !trimmedPrompt) {
    throw new Error('Prompt is required.')
  }

  const taskCode = randomCode('IMG')
  const { creditRules, generationPricing } = await getTaskBillingSettings(req)
  const configuredCredits = resolveGenerationCredits({
    inputMode,
    pricing: generationPricing,
  })
  const selectedProvider = await resolveImageGenerationProvider({
    preferredProvider: provider,
    req,
  })
  const defaultPrompt = await readImageGenerationDefaultPrompt(req)
  const effectivePrompt = buildEffectiveImagePrompt({
    defaultPrompt,
    prompt: trimmedPrompt,
  })
  if (!effectivePrompt) {
    throw new Error('Prompt is required.')
  }

  const baseSnapshot = isRecord(parameterSnapshot) ? parameterSnapshot : {}
  const imageGenerationSnapshot = readImageGenerationSnapshot(baseSnapshot)

  if ((creditRules || defaultTaskCreditRules).reserveOnSubmit && configuredCredits > 0) {
    await assertTaskCreditsAvailable({
      amount: configuredCredits,
      req,
      userId: Number(req.user.id),
    })
  }

  const task = await req.payload.create({
    collection: 'generation-tasks',
    data: {
      callbackPayload: null,
      creditsReserved: creditRules.reserveOnSubmit ? configuredCredits : 0,
      creditsSpent: 0,
      inputMode,
      parameterSnapshot: {
        ...baseSnapshot,
        billing: {
          configuredCredits,
          refundOnFailure: creditRules.refundOnFailure,
          reserveOnSubmit: creditRules.reserveOnSubmit,
        },
        imageGeneration: {
          ...imageGenerationSnapshot,
          defaultPrompt,
          effectivePrompt,
          originalPrompt: trimmedPrompt,
          provider: selectedProvider,
          taskType: 'image-generation',
        },
        ...(sourceImageAsset ? { sourceImageAsset } : {}),
      },
      printRequested: false,
      progress: 5,
      prompt: trimmedPrompt,
      provider: selectedProvider,
      providerTaskId: '',
      sourceImage,
      startedAt: new Date().toISOString(),
      status: 'queued',
      taskType: 'image-generation',
      taskCode,
      user: req.user.id,
    },
    req,
    overrideAccess: INTERNAL_ACCESS,
  })

  try {
    if ((creditRules || defaultTaskCreditRules).reserveOnSubmit && configuredCredits > 0) {
      await reserveTaskCredits({
        amount: configuredCredits,
        notes: `${task.taskCode} image generation submitted, credits reserved.`,
        req,
        taskId: task.id,
        userId: Number(req.user.id),
      })
    }

    await createTaskEvent({
      eventType: 'queued',
      message: 'Image generation task queued.',
      payload: {
        configuredCredits,
        inputMode,
      },
      provider: selectedProvider,
      req,
      taskId: task.id,
      userId: Number(req.user.id),
    })

    return {
      task,
    }
  } catch (error) {
    await req.payload
      .update({
        collection: 'generation-tasks',
        data: {
          completedAt: new Date().toISOString(),
          failureReason: error instanceof Error ? error.message : 'Image generation failed.',
          progress: 100,
          status: 'failed',
        },
        id: task.id,
        req,
        overrideAccess: INTERNAL_ACCESS,
      })
      .catch(() => null)

    if ((creditRules || defaultTaskCreditRules).reserveOnSubmit && configuredCredits > 0 && creditRules.refundOnFailure) {
      await refundTaskCredits({
        amount: configuredCredits,
        notes: `${task.taskCode} image generation failed and reserved credits were refunded.`,
        req,
        taskId: task.id,
        userId: Number(req.user.id),
      }).catch(() => null)
    }

    await createTaskEvent({
      eventType: 'failed',
      message: error instanceof Error ? error.message : 'Image generation failed.',
      payload: {
        configuredCredits,
      },
      provider: selectedProvider,
      req,
      taskId: task.id,
      userId: Number(req.user.id),
    }).catch(() => null)

    throw error
  }
}

async function readGeneratedMediaRecord(args: {
  mediaId: number
  req: PayloadRequest
}) {
  if (!args.mediaId) return null

  return args.req.payload
    .findByID({
      collection: 'media',
      depth: 0,
      id: args.mediaId,
      req: args.req,
      ...accessOptions(args.req),
    })
    .catch(() => null)
}

export async function runImageGenerationTask(args: RunImageGenerationTaskArgs) {
  const { req, taskId } = args
  if (imageGenerationTaskLocks.has(taskId)) {
    const lockedTask = await req.payload.findByID({
      collection: 'generation-tasks',
      depth: 0,
      id: taskId,
      req,
      ...accessOptions(req),
    })

    return {
      media: null,
      task: lockedTask,
    }
  }

  const task = await req.payload.findByID({
    collection: 'generation-tasks',
    depth: 0,
    id: taskId,
    req,
    ...accessOptions(req),
  })
  const taskRecord = task as unknown as Record<string, unknown>
  const userId = readTaskUserId(taskRecord)

  if (!userId) {
    throw new Error('Image generation task is missing a user.')
  }

  if (taskRecord.status === 'succeeded') {
    const callbackPayload = isRecord(taskRecord.callbackPayload) ? taskRecord.callbackPayload : {}
    const imageGeneration = isRecord(callbackPayload.imageGeneration) ? callbackPayload.imageGeneration : {}
    const mediaId = readNumber(imageGeneration.resultMediaId)

    return {
      media: await readGeneratedMediaRecord({ mediaId, req }),
      task,
    }
  }

  if (taskRecord.status === 'failed' || taskRecord.status === 'timeout') {
    return {
      media: null,
      task,
    }
  }

  if (hasRecentImageGenerationDispatch(taskRecord)) {
    return {
      media: null,
      task,
    }
  }

  const inputMode = taskRecord.inputMode === 'image' ? 'image' : 'text'
  const selectedProvider =
    taskRecord.provider === 'gemini-official' ||
    taskRecord.provider === 'gemini-third-party' ||
    taskRecord.provider === 'openai-compatible'
      ? taskRecord.provider
      : undefined
  const configuredBilling = readTaskBillingSnapshot(taskRecord.parameterSnapshot) || {
    configuredCredits: 0,
    refundOnFailure: defaultTaskCreditRules.refundOnFailure,
    reserveOnSubmit: defaultTaskCreditRules.reserveOnSubmit,
  }
  const effectivePrompt = readImageGenerationEffectivePrompt(taskRecord.parameterSnapshot) || readString(taskRecord.prompt)
  const snapshot = isRecord(taskRecord.parameterSnapshot) ? taskRecord.parameterSnapshot : {}
  const imageGenerationSnapshot = readImageGenerationSnapshot(snapshot)
  const sourceImageAsset = isRecord(snapshot.sourceImageAsset) ? snapshot.sourceImageAsset : undefined

  imageGenerationTaskLocks.add(taskId)

  try {
    const dispatchStartedAt = new Date().toISOString()

    await req.payload.update({
      collection: 'generation-tasks',
      data: {
        parameterSnapshot: {
          ...snapshot,
          imageGeneration: {
            ...imageGenerationSnapshot,
            dispatchStartedAt,
            taskType: 'image-generation',
          },
        },
        progress: Math.max(readNumber(taskRecord.progress), 25),
        status: 'processing',
      },
      id: task.id,
      req,
      overrideAccess: INTERNAL_ACCESS,
    })

    await createTaskEvent({
      eventType: 'submitted',
      message: 'Image generation request dispatched to provider.',
      provider: selectedProvider || String(taskRecord.provider || 'image'),
      req,
      taskId: task.id,
      userId,
    })

    const providerLabel = selectedProvider || String(taskRecord.provider || 'image')
    const generated = await generateProviderImageWithRetry({
      dispatchStartedAt,
      generationArgs: {
        inputMode,
        prompt: effectivePrompt,
        provider: selectedProvider,
        req,
        sourceImage: readNumber(taskRecord.sourceImage),
        sourceImageAsset,
      },
      imageGenerationSnapshot,
      provider: providerLabel,
      req,
      snapshot,
      task,
      userId,
    })

    const buffer = Buffer.from(generated.image.data, 'base64')
    if (buffer.byteLength === 0) {
      throw new Error('The image provider returned an empty image.')
    }

    const extension = getImageExtension(generated.image.mimeType)
    const filename = `${sanitizePathPart(task.taskCode) || 'image-task'}.${extension}`
    const uploaded = await uploadGeneratedImage({
      buffer,
      contentType: generated.image.mimeType,
      taskCode: task.taskCode,
      userId,
    })
    const media = await createGeneratedMediaRecord({
      contentType: generated.image.mimeType,
      fileSize: buffer.byteLength,
      filename,
      req,
      url: uploaded.publicUrl,
      userId,
    })

    if (configuredBilling.reserveOnSubmit && configuredBilling.configuredCredits > 0) {
      await settleReservedTaskCredits({
        amount: configuredBilling.configuredCredits,
        notes: `${task.taskCode} image generation completed and reserved credits were settled.`,
        req,
        taskId: task.id,
        userId,
      })
    } else if (configuredBilling.configuredCredits > 0) {
      await spendTaskCredits({
        amount: configuredBilling.configuredCredits,
        notes: `${task.taskCode} image generation completed and credits were charged.`,
        req,
        taskId: task.id,
        userId,
      })
    }

    const completedTask = await req.payload.update({
      collection: 'generation-tasks',
      data: {
        callbackPayload: {
          imageGeneration: {
            providerModel: generated.providerModel,
            resultMediaId: media.id,
            resultMediaUrl: media.url,
          },
        },
        completedAt: new Date().toISOString(),
        creditsSpent: configuredBilling.configuredCredits,
        progress: 100,
        status: 'succeeded',
      },
      id: task.id,
      req,
      overrideAccess: INTERNAL_ACCESS,
    })

    await createTaskEvent({
      eventType: 'completed',
      message: 'Image generation completed successfully.',
      payload: {
        mediaId: media.id,
        providerModel: generated.providerModel,
      },
      provider: generated.provider,
      req,
      taskId: task.id,
      userId,
    })

    return {
      media,
      task: completedTask,
    }
  } catch (error) {
    await req.payload.update({
      collection: 'generation-tasks',
      data: {
        completedAt: new Date().toISOString(),
        failureReason: error instanceof Error ? error.message : 'Image generation failed.',
        progress: 100,
        status: 'failed',
      },
      id: task.id,
      req,
      overrideAccess: INTERNAL_ACCESS,
    })

    if (
      configuredBilling.reserveOnSubmit &&
      configuredBilling.configuredCredits > 0 &&
      configuredBilling.refundOnFailure
    ) {
      await refundTaskCredits({
        amount: configuredBilling.configuredCredits,
        notes: `${task.taskCode} image generation failed and reserved credits were refunded.`,
        req,
        taskId: task.id,
        userId,
      }).catch(() => null)
    }

    await createTaskEvent({
      eventType: 'failed',
      message: error instanceof Error ? error.message : 'Image generation failed.',
      payload: {
        configuredCredits: configuredBilling.configuredCredits,
      },
      provider: selectedProvider || String(taskRecord.provider || 'image'),
      req,
      taskId: task.id,
      userId,
    }).catch(() => null)

    throw error
  } finally {
    imageGenerationTaskLocks.delete(taskId)
  }
}

export async function submitImageGeneration(args: SubmitImageGenerationArgs) {
  const { task } = await createImageGenerationTask(args)

  if (args.dispatchProvider === false) {
    return {
      media: null,
      task,
    }
  }

  return runImageGenerationTask({
    req: args.req,
    taskId: Number(task.id),
  })
}
