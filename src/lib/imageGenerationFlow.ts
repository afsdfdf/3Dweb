import type { PayloadRequest } from 'payload'

import {
  assertTaskCreditsAvailable,
  refundTaskCredits,
  reserveTaskCredits,
  settleReservedTaskCredits,
  spendTaskCredits,
} from '@/lib/creditLedger'
import { generateGeminiImage } from '@/lib/geminiImageGateway'
import { uploadToSupabaseStorage, getRuntimeStorageSettings } from '@/lib/supabase/storage'
import { defaultTaskCreditRules, getTaskBillingSettings, resolveGenerationCredits } from '@/lib/taskBilling'

type ImageTaskProvider = 'gemini-official' | 'gemini-third-party'

type SubmitImageGenerationArgs = {
  inputMode: 'image' | 'text'
  prompt: string
  provider?: ImageTaskProvider
  req: PayloadRequest
  sourceImage?: number
  sourceImageAsset?: Record<string, unknown>
}

const accessOptions = (req: PayloadRequest) => {
  return req.user ? { overrideAccess: false as const } : {}
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
    req: args.req,
    ...accessOptions(args.req),
  })
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
}) {
  return args.req.payload.create({
    collection: 'media',
    data: {
      alt: args.filename,
      filename: args.filename,
      filesize: args.fileSize,
      mimeType: args.contentType,
      owner: args.req.user?.id,
      publicAccess: false,
      purpose: 'asset',
      thumbnailURL: args.url,
      url: args.url,
    },
    req: args.req,
    ...accessOptions(args.req),
  })
}

export async function submitImageGeneration(args: SubmitImageGenerationArgs) {
  const { inputMode, prompt, provider, req, sourceImage, sourceImageAsset } = args

  if (!req.user) {
    throw new Error('Unauthorized')
  }

  const trimmedPrompt = prompt.trim()
  if (!trimmedPrompt) {
    throw new Error('Prompt is required.')
  }

  if (inputMode === 'image' && !sourceImage && !sourceImageAsset) {
    throw new Error('Image-to-image generation requires a source image.')
  }

  const taskCode = randomCode('IMG')
  const { creditRules, generationPricing } = await getTaskBillingSettings(req)
  const configuredCredits = resolveGenerationCredits({
    inputMode,
    pricing: generationPricing,
  })
  const selectedProvider = provider || 'gemini-official'

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
        billing: {
          configuredCredits,
          refundOnFailure: creditRules.refundOnFailure,
          reserveOnSubmit: creditRules.reserveOnSubmit,
        },
        imageGeneration: {
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
      taskCode,
      user: req.user.id,
    },
    req,
    ...accessOptions(req),
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

    await req.payload.update({
      collection: 'generation-tasks',
      data: {
        progress: 25,
        status: 'processing',
      },
      id: task.id,
      req,
      ...accessOptions(req),
    })

    await createTaskEvent({
      eventType: 'submitted',
      message: 'Image generation request dispatched to Gemini.',
      provider: selectedProvider,
      req,
      taskId: task.id,
      userId: Number(req.user.id),
    })

    const generated = await generateGeminiImage({
      inputMode,
      prompt: trimmedPrompt,
      provider: selectedProvider,
      req,
      sourceImage,
      sourceImageAsset,
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
      userId: Number(req.user.id),
    })
    const media = await createGeneratedMediaRecord({
      contentType: generated.image.mimeType,
      fileSize: buffer.byteLength,
      filename,
      req,
      url: uploaded.publicUrl,
    })

    if ((creditRules || defaultTaskCreditRules).reserveOnSubmit && configuredCredits > 0) {
      await settleReservedTaskCredits({
        amount: configuredCredits,
        notes: `${task.taskCode} image generation completed and reserved credits were settled.`,
        req,
        taskId: task.id,
        userId: Number(req.user.id),
      })
    } else if (configuredCredits > 0) {
      await spendTaskCredits({
        amount: configuredCredits,
        notes: `${task.taskCode} image generation completed and credits were charged.`,
        req,
        taskId: task.id,
        userId: Number(req.user.id),
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
        creditsSpent: configuredCredits,
        progress: 100,
        status: 'succeeded',
      },
      id: task.id,
      req,
      ...accessOptions(req),
    })

    await createTaskEvent({
      eventType: 'completed',
      message: 'Image generation completed successfully.',
      payload: {
        mediaId: media.id,
        providerModel: generated.providerModel,
      },
      provider: selectedProvider,
      req,
      taskId: task.id,
      userId: Number(req.user.id),
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
      ...accessOptions(req),
    })

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
