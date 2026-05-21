import type { PayloadRequest } from 'payload'

import {
  assertTaskCreditsAvailable,
  refundTaskCredits,
  reserveTaskCredits,
  settleReservedTaskCredits,
  spendTaskCredits,
} from '@/lib/creditLedger'
import { createGenerationTaskNotification } from '@/lib/notificationService'
import {
  createMeshyImageTask,
  createMeshyMultiImageTask,
  createMeshyTextPreviewTask,
  createMeshyTextRefineTask,
  getMeshyFailureReason,
  getMeshySettings,
  isMeshyConfigured,
  isMeshyConcurrencyError,
  mapMeshyStatus,
  type MeshyImageTask,
  type MeshyMultiImageTask,
  type MeshyTextTask,
  resolveMeshyImageURL,
  retrieveMeshyImageTask,
  retrieveMeshyMultiImageTask,
  retrieveMeshyTextTask,
} from '@/lib/meshyGateway'
import { isAllowedRemoteAssetURL } from '@/lib/remoteAssetSecurity'
import { getRuntimeStorageSettings, uploadToSupabaseStorage } from '@/lib/supabase/storage'
import {
  defaultTaskCreditRules,
  getTaskBillingSettings,
  readTaskBillingSnapshot,
  resolveGenerationCredits,
  resolveMeshyGenerationCredits,
} from '@/lib/taskBilling'

const randomCode = (prefix: string) => {
  const date = new Date()
  const stamp = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(
    date.getDate(),
  ).padStart(2, '0')}${String(date.getHours()).padStart(2, '0')}${String(date.getMinutes()).padStart(2, '0')}${String(
    date.getSeconds(),
  ).padStart(2, '0')}`

  return `${prefix}-${stamp}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
}

type TaskStatus = 'failed' | 'processing' | 'queued' | 'succeeded' | 'timeout'

type SupportedProvider = 'custom' | 'gemini-official' | 'gemini-third-party' | 'openai-compatible' | 'meshy' | 'tripo'

type SupportedModelFormat = '3mf' | 'fbx' | 'glb' | 'obj' | 'stl' | 'usdz'

type ResolvedThumbnailAsset = {
  contentType: string
  fileSize: number
  filename: string
  publicUrl: string
}

type SourceImageAsset = {
  bucket?: string | null
  mediaId?: number | null
  path?: string | null
  publicUrl?: string | null
}

type AITaskFlowStorageTestHooks = {
  getRuntimeStorageSettings?: typeof getRuntimeStorageSettings
  uploadToSupabaseStorage?: typeof uploadToSupabaseStorage
}

let aiTaskFlowStorageTestHooks: AITaskFlowStorageTestHooks | null = null
const meshyDispatchLocks = new Set<number>()
const taskFinalizationLocks = new Set<number>()
const INTERNAL_ACCESS = true

export function __setAITaskFlowStorageTestHooks(hooks: AITaskFlowStorageTestHooks | null) {
  aiTaskFlowStorageTestHooks = hooks
}

const isProductionRuntime = () => process.env.NODE_ENV === 'production'

const isExplicitMockAIResultsEnabled = () => {
  return !isProductionRuntime() && process.env.ENABLE_AI_MOCK_RESULTS === 'true'
}

type MeshySnapshot = {
  imageTaskId?: string
  mode?: 'image-to-3d' | 'multi-image-to-3d' | 'text-to-3d'
  multiImageTaskId?: string
  previewTaskId?: string
  refineTaskId?: string
  stage?: 'image' | 'multi-image' | 'preview' | 'refine'
}

const accessOptions = (req: PayloadRequest) => {
  return req.user ? { overrideAccess: false as const } : {}
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

const getTaskUserId = (task: { user?: number | { id?: number | string | null } | null }) => {
  return typeof task.user === 'object' && task.user ? Number(task.user.id) : Number(task.user)
}

const getTaskBilledCredits = (task: {
  creditsReserved?: number | null
  parameterSnapshot?: unknown
}) => {
  const snapshot = readTaskBillingSnapshot(task.parameterSnapshot ?? null)

  if (snapshot && snapshot.configuredCredits > 0) {
    return snapshot.configuredCredits
  }

  return Math.max(0, Number(task.creditsReserved || 0))
}

const getMeshySnapshot = (parameterSnapshot: unknown): MeshySnapshot => {
  if (!isRecord(parameterSnapshot)) return {}
  const meshy = parameterSnapshot.meshy
  if (!isRecord(meshy)) return {}

  return {
    imageTaskId: typeof meshy.imageTaskId === 'string' ? meshy.imageTaskId : undefined,
    mode:
      meshy.mode === 'image-to-3d' || meshy.mode === 'multi-image-to-3d' || meshy.mode === 'text-to-3d'
        ? meshy.mode
        : undefined,
    multiImageTaskId: typeof meshy.multiImageTaskId === 'string' ? meshy.multiImageTaskId : undefined,
    previewTaskId: typeof meshy.previewTaskId === 'string' ? meshy.previewTaskId : undefined,
    refineTaskId: typeof meshy.refineTaskId === 'string' ? meshy.refineTaskId : undefined,
    stage:
      meshy.stage === 'image' || meshy.stage === 'multi-image' || meshy.stage === 'preview' || meshy.stage === 'refine'
        ? meshy.stage
        : undefined,
  }
}

const mergeTaskParameterSnapshot = (args: {
  current: unknown
  updates: Record<string, unknown>
}) => {
  const current = isRecord(args.current) ? args.current : {}
  const currentMeshy = isRecord(current.meshy) ? current.meshy : {}

  return {
    ...current,
    meshy: {
      ...currentMeshy,
      ...args.updates,
    },
  }
}

const getTaskProvider = (task: { provider?: SupportedProvider | null }) => {
  return (task.provider || 'custom') as SupportedProvider
}

const isTerminalTaskStatus = (status?: string | null) => {
  return status === 'succeeded' || status === 'failed' || status === 'timeout'
}

const MODEL_FORMAT_MIME_TYPES: Record<SupportedModelFormat, string> = {
  '3mf': 'model/3mf',
  fbx: 'application/octet-stream',
  glb: 'model/gltf-binary',
  obj: 'text/plain',
  stl: 'application/vnd.ms-pki.stl',
  usdz: 'model/vnd.usdz+zip',
}

const FALLBACK_THUMBNAIL_CONTENT_TYPE = 'image/png'

const readRuntimeStorageSettings = () => (aiTaskFlowStorageTestHooks?.getRuntimeStorageSettings || getRuntimeStorageSettings)()

const uploadRuntimeAsset = (args: Parameters<typeof uploadToSupabaseStorage>[0]) =>
  (aiTaskFlowStorageTestHooks?.uploadToSupabaseStorage || uploadToSupabaseStorage)(args)

const sanitizeFilenamePart = (value: string) => {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

const getModelMimeType = (format: SupportedModelFormat, response: Response) => {
  const headerValue = response.headers.get('content-type') || ''
  if (headerValue.trim()) {
    return headerValue.split(';')[0]?.trim() || MODEL_FORMAT_MIME_TYPES[format]
  }

  return MODEL_FORMAT_MIME_TYPES[format]
}

async function ingestRemoteModelAsset(args: {
  downloadURL: string
  format: SupportedModelFormat
  taskCode: string
  userId: number
}) {
  const { downloadURL, format, taskCode, userId } = args
  const response = await fetch(downloadURL)

  if (!response.ok) {
    throw new Error(`Remote asset fetch failed with ${response.status}.`)
  }

  const arrayBuffer = await response.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  if (buffer.byteLength === 0) {
    throw new Error('Remote asset fetch returned an empty file.')
  }

  const safeTaskCode = sanitizeFilenamePart(taskCode) || 'task-result'
  const safeUserId = sanitizeFilenamePart(`user-${userId}`) || 'user'
  const filename = `${safeTaskCode}-${format}.${format}`
  const storage = await readRuntimeStorageSettings()
  const uploaded = await uploadRuntimeAsset({
    bucket: storage.bucket,
    contentType: getModelMimeType(format, response),
    path: `${storage.prefix.replace(/^\/+|\/+$/g, '')}/generated/${safeUserId}/${safeTaskCode}/${filename}`,
    upsert: true,
    value: buffer,
  })

  return {
    contentType: getModelMimeType(format, response),
    filename,
    fileSizeMb: Number((buffer.byteLength / (1024 * 1024)).toFixed(3)),
    fileSize: buffer.byteLength,
    publicUrl: uploaded.publicUrl,
  }
}

async function createGeneratedMediaRecord(args: {
  alt: string
  contentType: string
  fileSize: number
  filename: string
  ownerId: number
  publicAccess?: boolean
  purpose: 'asset' | 'model' | 'preview'
  req: PayloadRequest
  url: string
}) {
  return args.req.payload.create({
    collection: 'media',
    data: {
      alt: args.alt,
      filename: args.filename,
      filesize: args.fileSize,
      mimeType: args.contentType,
      owner: args.ownerId,
      publicAccess: Boolean(args.publicAccess),
      purpose: args.purpose,
      thumbnailURL: args.url,
      url: args.url,
    },
    req: args.req,
    context: {
      allowManagedMediaVisibility: true,
    },
    overrideAccess: INTERNAL_ACCESS,
  })
}

const getThumbnailExtension = (response: Response, downloadURL: string) => {
  const headerValue = response.headers.get('content-type') || ''
  const contentType = headerValue.split(';')[0]?.trim().toLowerCase() || ''

  if (contentType === 'image/jpeg') return 'jpg'
  if (contentType === 'image/webp') return 'webp'
  if (contentType === 'image/png') return 'png'

  try {
    const pathname = new URL(downloadURL).pathname.toLowerCase()
    const match = pathname.match(/\.(png|jpg|jpeg|webp)$/)
    if (match?.[1]) {
      return match[1] === 'jpeg' ? 'jpg' : match[1]
    }
  } catch {
    // Ignore invalid URLs and use a safe default.
  }

  return 'png'
}

const normalizeTextureURLEntries = (value: unknown) => {
  const entries: Array<[string, string | null]> = []

  if (isRecord(value)) {
    for (const [key, url] of Object.entries(value)) {
      if (url === null || typeof url === 'string') {
        entries.push([key, url])
      }
    }

    return entries
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      if (item === null || typeof item === 'string') {
        entries.push([`texture-${index + 1}`, item])
        return
      }

      if (isRecord(item)) {
        for (const [key, url] of Object.entries(item)) {
          if (url === null || typeof url === 'string') {
            entries.push([`${index + 1}-${key}`, url])
          }
        }
      }
    })
  }

  return entries
}

async function ingestRemoteThumbnailAsset(args: {
  downloadURL: string
  taskCode: string
  userId: number
}) {
  const { downloadURL, taskCode, userId } = args
  const response = await fetch(downloadURL)

  if (!response.ok) {
    throw new Error(`Remote thumbnail fetch failed with ${response.status}.`)
  }

  const arrayBuffer = await response.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  if (buffer.byteLength === 0) {
    throw new Error('Remote thumbnail fetch returned an empty file.')
  }

  const safeTaskCode = sanitizeFilenamePart(taskCode) || 'task-result'
  const safeUserId = sanitizeFilenamePart(`user-${userId}`) || 'user'
  const extension = getThumbnailExtension(response, downloadURL)
  const contentType = response.headers.get('content-type') || FALLBACK_THUMBNAIL_CONTENT_TYPE
  const filename = `${safeTaskCode}-thumbnail.${extension}`
  const storage = await readRuntimeStorageSettings()
  const uploaded = await uploadRuntimeAsset({
    bucket: storage.bucket,
    contentType,
    path: `${storage.prefix.replace(/^\/+|\/+$/g, '')}/generated/${safeUserId}/${safeTaskCode}/${filename}`,
    upsert: true,
    value: buffer,
  })

  return {
    contentType,
    fileSize: buffer.byteLength,
    filename,
    publicUrl: uploaded.publicUrl,
  } satisfies ResolvedThumbnailAsset
}

async function ingestRemoteTextureAsset(args: {
  downloadURL: string
  textureKey: string
  taskCode: string
  userId: number
}) {
  const { downloadURL, taskCode, textureKey, userId } = args
  const response = await fetch(downloadURL)

  if (!response.ok) {
    throw new Error(`Remote texture fetch failed with ${response.status}.`)
  }

  const arrayBuffer = await response.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  if (buffer.byteLength === 0) {
    throw new Error('Remote texture fetch returned an empty file.')
  }

  const safeTaskCode = sanitizeFilenamePart(taskCode) || 'task-result'
  const safeTextureKey = sanitizeFilenamePart(textureKey) || 'texture'
  const safeUserId = sanitizeFilenamePart(`user-${userId}`) || 'user'
  const extension = getThumbnailExtension(response, downloadURL)
  const storage = await readRuntimeStorageSettings()
  const uploaded = await uploadRuntimeAsset({
    bucket: storage.bucket,
    contentType: response.headers.get('content-type') || FALLBACK_THUMBNAIL_CONTENT_TYPE,
    path: `${storage.prefix.replace(/^\/+|\/+$/g, '')}/generated/${safeUserId}/${safeTaskCode}/textures/${safeTaskCode}-${safeTextureKey}.${extension}`,
    upsert: true,
    value: buffer,
  })

  return uploaded.publicUrl
}

export async function resolveModelFormatAssets(args: {
  generationPricingDownloadCredits: number
  payloadData?: Record<string, unknown>
  requireLocalIngestion?: boolean
  req: PayloadRequest
  taskCode: string
  taskId: number
  userId: number
}) {
  const { generationPricingDownloadCredits, payloadData, requireLocalIngestion = false, req, taskCode, taskId, userId } = args
  const supportedFormats: SupportedModelFormat[] = ['glb', 'fbx', 'obj', 'stl', 'usdz', '3mf']
  const rawModelURLs = isRecord(payloadData?.modelUrls) ? payloadData?.modelUrls : {}
  const thumbnailCandidate = typeof payloadData?.thumbnailUrl === 'string' ? payloadData.thumbnailUrl.trim() : ''
  const formats: Array<{
    downloadCredits: number
    file: null | number
    fileSizeMb: number
    format: SupportedModelFormat
  }> = []
  const modelUrls: Record<string, string> = {}
  const textureUrls: Record<string, string | null> = {}
  let thumbnailAsset: ResolvedThumbnailAsset | null = null
  let thumbnailUrl: string | null = null

  for (const format of supportedFormats) {
    const candidate = rawModelURLs[format]
    if (typeof candidate !== 'string' || !candidate.trim()) {
      continue
    }

    const allowed = await isAllowedRemoteAssetURL({
      payload: req.payload,
      url: candidate,
    })

    if (!allowed) {
      req.payload.logger.warn({
        format,
        msg: 'Dropped remote model URL because the host is not on the allowlist.',
        taskId,
        url: candidate,
      })
      if (requireLocalIngestion) {
        throw new Error(`Remote ${format.toUpperCase()} model URL is not allowed for local ingestion.`)
      }
      continue
    }

    try {
      const ingested = await ingestRemoteModelAsset({
        downloadURL: candidate,
        format,
        taskCode,
        userId,
      })
      const media = await createGeneratedMediaRecord({
        alt: `${taskCode} ${format.toUpperCase()} model`,
        contentType: ingested.contentType,
        fileSize: ingested.fileSize,
        filename: ingested.filename,
        ownerId: userId,
        purpose: 'model',
        req,
        url: ingested.publicUrl,
      })

      formats.push({
        downloadCredits: generationPricingDownloadCredits,
        file: Number(media.id),
        fileSizeMb: ingested.fileSizeMb,
        format,
      })
      modelUrls[format] = ingested.publicUrl
    } catch (error) {
      req.payload.logger.warn({
        err: error,
        format,
        msg: 'AI result asset ingestion fell back to remote URL because local media storage failed.',
        taskId,
        url: candidate,
      })

      if (requireLocalIngestion) {
        throw error
      }

      formats.push({
        downloadCredits: generationPricingDownloadCredits,
        file: null,
        fileSizeMb: 0,
        format,
      })
      modelUrls[format] = candidate
    }
  }

  for (const [textureKey, rawTextureURL] of normalizeTextureURLEntries(payloadData?.textureUrls)) {
    if (rawTextureURL === null) {
      textureUrls[textureKey] = null
      continue
    }

    if (typeof rawTextureURL !== 'string' || !rawTextureURL.trim()) {
      continue
    }

    const allowed = await isAllowedRemoteAssetURL({
      payload: req.payload,
      url: rawTextureURL,
    })

    if (!allowed) {
      req.payload.logger.warn({
        msg: 'Dropped remote texture URL because the host is not on the allowlist.',
        taskId,
        textureKey,
        url: rawTextureURL,
      })
      if (requireLocalIngestion) {
        throw new Error(`Remote texture URL is not allowed for local ingestion: ${textureKey}.`)
      }
      continue
    }

    try {
      textureUrls[textureKey] = await ingestRemoteTextureAsset({
        downloadURL: rawTextureURL,
        taskCode,
        textureKey,
        userId,
      })
    } catch (error) {
      req.payload.logger.warn({
        err: error,
        msg: 'AI texture ingestion fell back to remote URL because Supabase Storage upload failed.',
        taskId,
        textureKey,
        url: rawTextureURL,
      })

      if (requireLocalIngestion) {
        throw error
      }

      textureUrls[textureKey] = rawTextureURL
    }
  }

  if (thumbnailCandidate) {
    const allowed = await isAllowedRemoteAssetURL({
      payload: req.payload,
      url: thumbnailCandidate,
    })

    if (!allowed) {
      req.payload.logger.warn({
        msg: 'Dropped remote thumbnail URL because the host is not on the allowlist.',
        taskId,
        url: thumbnailCandidate,
      })
      if (requireLocalIngestion) {
        throw new Error('Remote thumbnail URL is not allowed for local ingestion.')
      }
    } else {
      try {
        thumbnailAsset = await ingestRemoteThumbnailAsset({
          downloadURL: thumbnailCandidate,
          taskCode,
          userId,
        })
        thumbnailUrl = thumbnailAsset.publicUrl
      } catch (error) {
        req.payload.logger.warn({
          err: error,
          msg: 'AI thumbnail ingestion fell back to remote URL because Supabase Storage upload failed.',
          taskId,
          url: thumbnailCandidate,
        })

        if (requireLocalIngestion) {
          throw error
        }

        thumbnailUrl = thumbnailCandidate
      }
    }
  }

  if (requireLocalIngestion && formats.length === 0) {
    throw new Error('Meshy did not provide an ingestible model file.')
  }

  return {
    formats,
    modelUrls,
    thumbnailAsset,
    textureUrls,
    thumbnailUrl,
  }
}

async function finalizeTaskBilling(args: {
  req: PayloadRequest
  status: TaskStatus
  task: {
    creditsReserved?: number | null
    id: number
    parameterSnapshot?: unknown
    taskCode: string
  }
  userId: number
}) {
  const { req, status, task, userId } = args
  const snapshot = readTaskBillingSnapshot(task.parameterSnapshot ?? null)
  const billedCredits = getTaskBilledCredits(task)

  if (billedCredits <= 0) {
    return
  }

  const reserveOnSubmit = snapshot?.reserveOnSubmit ?? defaultTaskCreditRules.reserveOnSubmit
  const refundOnFailure = snapshot?.refundOnFailure ?? defaultTaskCreditRules.refundOnFailure

  if (status === 'succeeded') {
    if (reserveOnSubmit) {
      try {
        await settleReservedTaskCredits({
          amount: billedCredits,
          notes: `${task.taskCode} generation succeeded, reserved credits settled.`,
          req,
          taskId: task.id,
          userId,
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : ''
        const missingReservedBalance = message.includes('Reserved balance is insufficient')

        if (!missingReservedBalance) {
          throw error
        }

        await spendTaskCredits({
          amount: billedCredits,
          notes: `${task.taskCode} generation succeeded after prior timeout/refund, credits charged directly.`,
          req,
          taskId: task.id,
          userId,
        })
      }
    } else {
      await spendTaskCredits({
        amount: billedCredits,
        notes: `${task.taskCode} generation succeeded, credits charged.`,
        req,
        taskId: task.id,
        userId,
      })
    }

    await req.payload.update({
      collection: 'generation-tasks',
      id: task.id,
      data: {
        creditsSpent: billedCredits,
      },
      req,
      overrideAccess: INTERNAL_ACCESS,
    })
  }

  if ((status === 'failed' || status === 'timeout') && reserveOnSubmit && refundOnFailure) {
    await refundTaskCredits({
      amount: billedCredits,
      notes: `${task.taskCode} generation failed, reserved credits refunded.`,
      req,
      taskId: task.id,
      userId,
    })
  }
}

export async function createTaskEvent(args: {
  eventType: 'callback' | 'completed' | 'failed' | 'polling' | 'queued' | 'submitted'
  message?: string
  payload?: Record<string, unknown>
  provider?: string
  req: PayloadRequest
  taskId: number
  userId: number
}) {
  const { eventType, message, payload, provider, req, taskId, userId } = args

  const taskEvent = await req.payload.create({
    collection: 'task-events',
    data: {
      eventType,
      message,
      payload,
      provider,
      task: taskId,
      user: userId,
    },
    overrideAccess: INTERNAL_ACCESS,
    req,
  })

  if (eventType === 'completed' || eventType === 'failed') {
    await createGenerationTaskNotification({
      eventType,
      message,
      req,
      taskId,
      userId,
    }).catch((error) => {
      req.payload.logger?.error?.({
        err: error,
        msg: `Failed to create notification for task ${taskId}.`,
      })
    })
  }

  return taskEvent
}

async function maybeCreatePollingTaskEvent(args: {
  provider: string
  req: PayloadRequest
  taskId: number
  userId: number
}) {
  const { provider, req, taskId, userId } = args

  const recentPollingEvents = await req.payload.find({
    collection: 'task-events',
    depth: 0,
    limit: 1,
    pagination: false,
    req,
    sort: '-createdAt',
    where: {
      and: [
        {
          eventType: {
            equals: 'polling',
          },
        },
        {
          task: {
            equals: taskId,
          },
        },
      ],
    },
    ...accessOptions(req),
  })

  const lastEvent = recentPollingEvents.docs[0]
  const lastCreatedAt = lastEvent?.createdAt ? new Date(lastEvent.createdAt).getTime() : 0
  const createdRecently = lastCreatedAt > 0 && Date.now() - lastCreatedAt < 60_000

  if (createdRecently) {
    return null
  }

  return createTaskEvent({
    eventType: 'polling',
    message: `${provider} task sync requested by frontend.`,
    provider,
    req,
    taskId,
    userId,
  })
}

async function createResultModel(args: {
  payloadData?: Record<string, unknown>
  req: PayloadRequest
  task: any
  userId: number
}) {
  const { payloadData, req, task, userId } = args
  const provider = String(payloadData?.provider ?? task.provider ?? 'custom')
  const { generationPricing } = await getTaskBillingSettings(req)
  const workbenchSnapshot = readWorkbenchSnapshot(task.parameterSnapshot)
  const existingModelId =
    typeof task.resultModel === 'object' && task.resultModel
      ? Number(task.resultModel.id)
      : task.resultModel
        ? Number(task.resultModel)
        : null

  const resolvedAssets = await resolveModelFormatAssets({
    generationPricingDownloadCredits: generationPricing.downloadCredits,
    payloadData,
    requireLocalIngestion: payloadData?.provider === 'meshy',
    req,
    taskCode: task.taskCode,
    taskId: task.id,
    userId,
  })
  const useMockResultFallback = provider === 'custom' && isExplicitMockAIResultsEnabled()

  if (resolvedAssets.formats.length === 0 && !useMockResultFallback) {
    throw new Error('AI provider completed without a downloadable model asset.')
  }

  if (isProductionRuntime() && resolvedAssets.formats.some((format) => format.file === null)) {
    throw new Error('AI provider result must be ingested into managed storage before creating a result model.')
  }

  let modelId = existingModelId
  const previewMedia =
    resolvedAssets.thumbnailAsset && !existingModelId
      ? await createGeneratedMediaRecord({
          alt: `${task.taskCode} preview`,
          contentType: resolvedAssets.thumbnailAsset.contentType,
          fileSize: resolvedAssets.thumbnailAsset.fileSize,
          filename: resolvedAssets.thumbnailAsset.filename,
          ownerId: userId,
          publicAccess: workbenchSnapshot.visibility === 'public',
          purpose: workbenchSnapshot.visibility === 'public' ? 'preview' : 'asset',
          req,
          url: resolvedAssets.thumbnailAsset.publicUrl,
        })
      : null
  const finalVisibility = workbenchSnapshot.visibility === 'public' && previewMedia ? 'public' : 'private'

  if (!modelId) {
    const existingModels = await req.payload.find({
      collection: 'models',
      depth: 0,
      limit: 1,
      pagination: false,
      req,
      where: {
        sourceTask: {
          equals: task.id,
        },
      },
      ...accessOptions(req),
    })
    const existingModel = existingModels.docs[0]

    if (existingModel?.id) {
      modelId = Number(existingModel.id)
    }
  }

  if (!modelId) {
    const model = await req.payload.create({
      collection: 'models',
      data: {
        description:
          typeof payloadData?.description === 'string'
            ? payloadData.description
            : provider === 'meshy'
              ? 'Generated by Meshy and synced into the local asset library.'
              : useMockResultFallback
                ? 'Local mock AI generation result.'
                : `Generated by ${provider} and synced into the local asset library.`,
        formats:
          resolvedAssets.formats.length > 0
            ? resolvedAssets.formats
            : [
                {
                  downloadCredits: generationPricing.downloadCredits,
                  file: null,
                  fileSizeMb: 1.2,
                  format: 'glb',
                },
                {
                  downloadCredits: generationPricing.downloadCredits,
                  file: null,
                  fileSizeMb: 0.8,
                  format: 'stl',
                },
              ],
        owner: userId,
        previewImage: previewMedia?.id,
        printReady: Boolean(payloadData?.printReady ?? true),
        sourceTask: task.id,
        status: 'ready',
        tags: workbenchSnapshot.tags.map((label) => ({ label })),
        title:
          workbenchSnapshot.requestedTitle ||
          String(payloadData?.modelTitle ?? `${task.taskCode} result model`),
        viewerUrl: `/results/${task.taskCode}`,
        visibility: finalVisibility,
      },
      req,
      overrideAccess: INTERNAL_ACCESS,
    })

    modelId = model.id
  }

  await req.payload.update({
    collection: 'generation-tasks',
    data: {
      callbackPayload: {
        ...(task.callbackPayload && typeof task.callbackPayload === 'object' ? task.callbackPayload : {}),
        ...(payloadData && typeof payloadData === 'object' ? payloadData : {}),
        modelUrls: Object.keys(resolvedAssets.modelUrls).length > 0 ? resolvedAssets.modelUrls : payloadData?.modelUrls,
        textureUrls: Object.keys(resolvedAssets.textureUrls).length > 0 ? resolvedAssets.textureUrls : payloadData?.textureUrls,
        thumbnailUrl: resolvedAssets.thumbnailUrl || payloadData?.thumbnailUrl || null,
      },
      resultModel: modelId,
    },
    id: task.id,
    req,
    overrideAccess: INTERNAL_ACCESS,
  })

  return modelId
}

async function updateTaskStatus(args: {
  payloadData?: Record<string, unknown>
  progress: number
  req: PayloadRequest
  status: TaskStatus
  task: any
  userId: number
}) {
  const { payloadData, progress, req, status, task, userId } = args
  const provider = String(task.provider ?? payloadData?.provider ?? 'custom')
  const taskId = Number(task.id)
  const terminalUpdate = isTerminalTaskStatus(status)

  if (terminalUpdate && taskFinalizationLocks.has(taskId)) {
    return req.payload.findByID({
      collection: 'generation-tasks',
      depth: 0,
      id: task.id,
      req,
      ...accessOptions(req),
    })
  }

  if (terminalUpdate) {
    taskFinalizationLocks.add(taskId)
  }

  try {
    const currentTask = terminalUpdate
      ? await req.payload
          .findByID({
            collection: 'generation-tasks',
            depth: 0,
            id: task.id,
            req,
            ...accessOptions(req),
          })
          .catch(() => task)
      : task

    if (terminalUpdate && isTerminalTaskStatus(currentTask.status)) {
      return currentTask
    }

    const updated = await req.payload.update({
      collection: 'generation-tasks',
      data: {
        callbackPayload: payloadData ?? currentTask.callbackPayload ?? null,
        completedAt: status === 'succeeded' ? new Date().toISOString() : undefined,
        failureReason:
          status === 'failed'
            ? String(payloadData?.failureReason ?? `${provider} generation failed.`)
            : status === 'timeout'
              ? 'Task timed out.'
              : null,
        progress,
        status,
      },
      id: currentTask.id,
      req,
      overrideAccess: INTERNAL_ACCESS,
    })

    if (status === 'succeeded') {
      try {
        await createResultModel({
          payloadData,
          req,
          task: updated,
          userId,
        })
      } catch (error) {
        const failedTask = await req.payload.update({
          collection: 'generation-tasks',
          data: {
            completedAt: new Date().toISOString(),
            failureReason: error instanceof Error ? error.message : 'Result asset ingestion failed.',
            progress: 100,
            status: 'failed',
          },
          id: updated.id,
          req,
          overrideAccess: INTERNAL_ACCESS,
        })

        await finalizeTaskBilling({
          req,
          status: 'failed',
          task: failedTask,
          userId,
        })

        await createTaskEvent({
          eventType: 'failed',
          message: 'Result asset ingestion failed.',
          payload: {
            error: error instanceof Error ? error.message : 'Result asset ingestion failed.',
            provider,
          },
          provider,
          req,
          taskId: currentTask.id,
          userId,
        })

        return failedTask
      }
    }

    await finalizeTaskBilling({
      req,
      status,
      task: updated,
      userId,
    })

    await createTaskEvent({
      eventType: status === 'succeeded' ? 'completed' : status === 'failed' ? 'failed' : 'callback',
      message:
        status === 'succeeded'
          ? `${provider} task completed`
          : status === 'failed'
            ? `${provider} task failed`
            : `${provider} task status updated`,
      payload: payloadData,
      provider,
      req,
      taskId: currentTask.id,
      userId,
    })

    return updated
  } finally {
    if (terminalUpdate) {
      taskFinalizationLocks.delete(taskId)
    }
  }
}

async function resolveSubmitProvider(args: {
  preferredProvider?: SupportedProvider
  req: PayloadRequest
}) {
  const { preferredProvider = 'custom', req } = args
  const envProvider = String(process.env.AI_PROVIDER || '')
    .trim()
    .toLowerCase()

  if (preferredProvider === 'meshy') {
    return 'meshy' as const
  }

  if (preferredProvider === 'custom' && envProvider === 'meshy') {
    return 'meshy' as const
  }

  const meshySettings = await getMeshySettings(req)
  if (isMeshyConfigured(meshySettings)) {
    return 'meshy' as const
  }

  return preferredProvider
}

const getMeshyProviderConcurrencyLimit = async (req: PayloadRequest) => {
  const settings = await getMeshySettings(req)
  const configuredValue = Number(settings.maxConcurrentTasks || process.env.MESHY_MAX_CONCURRENT_TASKS || 20)
  return Number.isFinite(configuredValue) && configuredValue > 0 ? Math.max(1, Math.floor(configuredValue)) : 20
}

const getMeshyDispatchStaleMs = () => Math.max(30_000, Number(process.env.MESHY_DISPATCH_STALE_MS || 120_000))

const resolveMeshyTargetFormats = (parameterSnapshot?: Record<string, unknown>) => {
  const supportedFormats = new Set<SupportedModelFormat>(['3mf', 'fbx', 'glb', 'obj', 'stl', 'usdz'])
  const requestedFormat = typeof parameterSnapshot?.format === 'string' ? parameterSnapshot.format.toLowerCase().trim() : ''
  const requestedFormats = Array.isArray(parameterSnapshot?.targetFormats)
    ? parameterSnapshot.targetFormats
    : Array.isArray(parameterSnapshot?.formats)
      ? parameterSnapshot.formats
      : []
  const formats = new Set<SupportedModelFormat>(['glb'])

  if (supportedFormats.has(requestedFormat as SupportedModelFormat)) {
    formats.add(requestedFormat as SupportedModelFormat)
  }

  requestedFormats.forEach((format) => {
    if (typeof format !== 'string') return
    const normalized = format.toLowerCase().trim()
    if (supportedFormats.has(normalized as SupportedModelFormat)) {
      formats.add(normalized as SupportedModelFormat)
    }
  })

  return Array.from(formats)
}

const normalizeSourceImageAssets = (value: unknown): SourceImageAsset[] => {
  const items = Array.isArray(value) ? value : isRecord(value) ? [value] : []
  return items
    .map((item): SourceImageAsset | null => {
      if (!isRecord(item)) return null

      const publicUrl = typeof item.publicUrl === 'string' && item.publicUrl.trim() ? item.publicUrl.trim() : null
      const bucket = typeof item.bucket === 'string' && item.bucket.trim() ? item.bucket.trim() : null
      const path = typeof item.path === 'string' && item.path.trim() ? item.path.trim() : null
      const mediaId = typeof item.mediaId === 'number' ? item.mediaId : Number(item.mediaId) || null

      if (!publicUrl && (!bucket || !path) && !mediaId) return null

      return { bucket, mediaId, path, publicUrl }
    })
    .filter((item): item is SourceImageAsset => Boolean(item))
}

const dedupeSourceImageAssets = (assets: SourceImageAsset[]) => {
  const seen = new Set<string>()
  const unique: SourceImageAsset[] = []

  for (const asset of assets) {
    const key = asset.mediaId ? `media:${asset.mediaId}` : asset.bucket && asset.path ? `${asset.bucket}:${asset.path}` : asset.publicUrl || ''
    if (!key || seen.has(key)) continue
    seen.add(key)
    unique.push(asset)
  }

  return unique
}

const readWorkbenchSnapshot = (value: unknown) => {
  const snapshot = isRecord(value) ? value : {}
  const workbench = isRecord(snapshot.workbench) ? snapshot.workbench : {}
  const requestedTitle =
    typeof workbench.requestedTitle === 'string' && workbench.requestedTitle.trim()
      ? workbench.requestedTitle.trim()
      : typeof snapshot.requestedTitle === 'string' && snapshot.requestedTitle.trim()
        ? snapshot.requestedTitle.trim()
        : ''
  const rawVisibility =
    typeof workbench.license === 'string'
      ? workbench.license
      : typeof snapshot.visibility === 'string'
        ? snapshot.visibility
        : 'private'
  const visibility = rawVisibility.toLowerCase() === 'public' ? 'public' : 'private'
  const rawTags = Array.isArray(workbench.tags) ? workbench.tags : Array.isArray(snapshot.tags) ? snapshot.tags : []
  const tags = Array.from(
    new Set(
      rawTags
        .map((tag) => (typeof tag === 'string' ? tag.trim().replace(/^#+\s*/, '') : ''))
        .filter(Boolean)
        .slice(0, 5),
    ),
  )

  return {
    requestedTitle,
    tags,
    visibility,
  }
}

const getRecentMeshyDispatchStartedAt = (task: { parameterSnapshot?: unknown }) => {
  if (!isRecord(task.parameterSnapshot)) return 0
  const meshy = isRecord(task.parameterSnapshot.meshy) ? task.parameterSnapshot.meshy : null
  const dispatchStartedAt = typeof meshy?.dispatchStartedAt === 'string' ? meshy.dispatchStartedAt : ''

  return dispatchStartedAt ? new Date(dispatchStartedAt).getTime() : 0
}

async function getActiveMeshyDispatchCount(args: { excludeTaskId?: number; req: PayloadRequest }) {
  const { excludeTaskId, req } = args
  const activeTasks = await req.payload.find({
    collection: 'generation-tasks',
    depth: 0,
    limit: 100,
    pagination: false,
    req,
    where: {
      and: [
        {
          provider: {
            equals: 'meshy',
          },
        },
        {
          status: {
            equals: 'processing',
          },
        },
      ],
    },
  })
  const staleThreshold = Date.now() - getMeshyDispatchStaleMs()

  return activeTasks.docs.filter((task) => {
    if (excludeTaskId && Number(task.id) === excludeTaskId) return false
    if (task.providerTaskId) return true

    const dispatchStartedAtMs = getRecentMeshyDispatchStartedAt(task)
    return dispatchStartedAtMs > staleThreshold
  }).length
}

async function hasMeshyDispatchCapacity(args: { excludeTaskId?: number; req: PayloadRequest }) {
  return (await getActiveMeshyDispatchCount(args)) < (await getMeshyProviderConcurrencyLimit(args.req))
}

function assertProviderAllowedInCurrentEnv(provider: SupportedProvider) {
  if (provider === 'custom' && !isExplicitMockAIResultsEnabled()) {
    throw new Error(
      'The custom mock AI provider requires ENABLE_AI_MOCK_RESULTS=true outside production. Configure Meshy for real model generation.',
    )
  }
}

async function createMeshyTask(args: {
  inputMode: 'hybrid' | 'image' | 'text'
  parameterSnapshot?: Record<string, unknown>
  prompt?: string
  req: PayloadRequest
  sourceImageAsset?: Record<string, unknown>
  sourceImageAssets?: Record<string, unknown>[]
  sourceImage?: number
  style?: string
}) {
  const { inputMode, parameterSnapshot, prompt, req, sourceImage, sourceImageAsset, sourceImageAssets, style } = args
  const settings = await getMeshySettings(req)
  const targetFormats = Array.from(new Set([...settings.targetFormats, ...resolveMeshyTargetFormats(parameterSnapshot)]))

  if (!isMeshyConfigured(settings)) {
    throw new Error('Meshy API key is not configured in AI provider settings.')
  }

  const snapshotSourceAssets = normalizeSourceImageAssets(parameterSnapshot?.sourceImageAssets)
  const sourceAssets = normalizeSourceImageAssets(sourceImageAssets)
  const legacySourceAsset = normalizeSourceImageAssets(sourceImageAsset)
  const imageAssets = dedupeSourceImageAssets([...sourceAssets, ...snapshotSourceAssets, ...legacySourceAsset]).slice(0, 4)
  const workbenchSnapshot = isRecord(parameterSnapshot?.workbench) ? parameterSnapshot.workbench : null
  const multiViewEnabled = workbenchSnapshot?.multiViewEnabled === true

  if (inputMode === 'text' || (imageAssets.length === 0 && !sourceImage)) {
    const previewTask = await createMeshyTextPreviewTask({
      prompt: String(prompt || '').trim(),
      settings,
      style,
      targetFormats,
    })

    return {
      parameterSnapshotUpdate: {
        mode: 'text-to-3d',
        previewTaskId: previewTask.id,
        stage: 'preview',
      },
      providerTaskId: previewTask.id,
    }
  }

  if (imageAssets.length > 1 && multiViewEnabled) {
    if (!settings.multiImageEnabled) {
      throw new Error('Meshy Multi Image to 3D is disabled in backend settings.')
    }

    const imageURLs = await Promise.all(
      imageAssets.map((asset) =>
        resolveMeshyImageURL({
          mediaId: asset.mediaId ?? undefined,
          req,
          sourceImageAsset: asset,
        }),
      ),
    )

    const multiImageTask = await createMeshyMultiImageTask({
      imageURLs,
      prompt,
      settings,
      targetFormats,
    })

    return {
      parameterSnapshotUpdate: {
        mode: 'multi-image-to-3d',
        multiImageTaskId: multiImageTask.id,
        sourceImageCount: imageAssets.length,
        stage: 'multi-image',
      },
      providerTaskId: multiImageTask.id,
    }
  }

  const firstSourceImageAsset = imageAssets[0]
  const sourceImagePublicUrl = firstSourceImageAsset?.publicUrl || ''

  if (!sourceImage && !firstSourceImageAsset) {
    throw new Error('Meshy image generation requires a source image.')
  }

  const imageURL = await resolveMeshyImageURL({
    mediaId: sourceImage,
    req,
    sourceImageAsset: firstSourceImageAsset || { publicUrl: sourceImagePublicUrl || null },
  })

  const imageTask = await createMeshyImageTask({
    imageURL,
    prompt,
    settings,
    targetFormats,
  })

  return {
    parameterSnapshotUpdate: {
      imageTaskId: imageTask.id,
      mode: 'image-to-3d',
      stage: 'image',
    },
    providerTaskId: imageTask.id,
  }
}

async function dispatchMeshyTask(args: {
  configuredCredits?: number
  creditRules?: Awaited<ReturnType<typeof getTaskBillingSettings>>['creditRules']
  inputMode: 'hybrid' | 'image' | 'text'
  parameterSnapshot?: Record<string, unknown>
  prompt?: string | null
  req: PayloadRequest
  sourceImageAsset?: Record<string, unknown>
  sourceImageAssets?: Record<string, unknown>[]
  sourceImage?: number | null
  task: any
  userId: number
}) {
  const { inputMode, parameterSnapshot, prompt, req, sourceImage, sourceImageAsset, sourceImageAssets, task, userId } = args

  if (task.providerTaskId || task.status === 'succeeded' || task.status === 'failed' || task.status === 'timeout') {
    return task
  }

  const taskId = Number(task.id)
  if (meshyDispatchLocks.has(taskId)) {
    return task
  }

  const currentSnapshot = isRecord(task.parameterSnapshot)
    ? task.parameterSnapshot
    : parameterSnapshot && isRecord(parameterSnapshot)
      ? parameterSnapshot
      : {}
  const currentMeshy = isRecord(currentSnapshot.meshy) ? currentSnapshot.meshy : {}
  const dispatchStartedAt = typeof currentMeshy.dispatchStartedAt === 'string' ? currentMeshy.dispatchStartedAt : ''
  const dispatchStartedAtMs = dispatchStartedAt ? new Date(dispatchStartedAt).getTime() : 0
  const dispatchInProgress =
    task.status === 'processing' &&
    !task.providerTaskId &&
    dispatchStartedAtMs > 0 &&
    Date.now() - dispatchStartedAtMs < Math.max(30_000, Number(process.env.MESHY_DISPATCH_STALE_MS || 120_000))

  if (dispatchInProgress) {
    return task
  }

  meshyDispatchLocks.add(taskId)

  if (!(await hasMeshyDispatchCapacity({ excludeTaskId: taskId, req }))) {
    req.payload.logger.info(
      {
        limit: await getMeshyProviderConcurrencyLimit(req),
        taskId: task.id,
      },
      'Meshy dispatch deferred because provider concurrency is at capacity.',
    )
    meshyDispatchLocks.delete(taskId)
    return task
  }

  const startedAt = new Date().toISOString()
  const sourceImageAssetFromSnapshot = isRecord(currentSnapshot.sourceImageAsset) ? currentSnapshot.sourceImageAsset : undefined
  const sourceImageAssetsFromSnapshot = Array.isArray(currentSnapshot.sourceImageAssets)
    ? (currentSnapshot.sourceImageAssets.filter(isRecord) as Record<string, unknown>[])
    : undefined
  const sourceImageId =
    typeof sourceImage === 'number'
      ? sourceImage
      : typeof task.sourceImage === 'number'
        ? task.sourceImage
        : task.sourceImage && typeof task.sourceImage === 'object'
          ? Number(task.sourceImage.id)
          : undefined

  const dispatchingTask = await req.payload.update({
    collection: 'generation-tasks',
    data: {
      parameterSnapshot: {
        ...currentSnapshot,
        meshy: {
          ...currentMeshy,
          dispatchStartedAt: startedAt,
        },
      },
      progress: Math.max(7, Number(task.progress || 0)),
      status: 'processing',
    },
    id: task.id,
    req,
    overrideAccess: INTERNAL_ACCESS,
  })

  try {
    const providerResult = await createMeshyTask({
      inputMode,
      parameterSnapshot: currentSnapshot,
      prompt: prompt ?? undefined,
      req,
      sourceImage: sourceImageId,
      sourceImageAsset: sourceImageAsset || sourceImageAssetFromSnapshot,
      sourceImageAssets: sourceImageAssets || sourceImageAssetsFromSnapshot,
      style: typeof currentSnapshot.style === 'string' ? currentSnapshot.style : undefined,
    })

    const updated = await req.payload.update({
      collection: 'generation-tasks',
      data: {
        parameterSnapshot: {
          ...currentSnapshot,
          meshy: {
            ...currentMeshy,
            ...providerResult.parameterSnapshotUpdate,
            dispatchedAt: new Date().toISOString(),
            dispatchStartedAt: startedAt,
          },
        },
        progress: 8,
        providerTaskId: providerResult.providerTaskId,
        status: 'processing',
      },
      id: task.id,
      req,
      overrideAccess: INTERNAL_ACCESS,
    })

    await createTaskEvent({
      eventType: 'submitted',
      message: 'Task submitted to Meshy provider.',
      payload: {
        configuredCredits: args.configuredCredits,
        parameterSnapshot: currentSnapshot,
        prompt,
        providerTaskId: providerResult.providerTaskId,
      },
      provider: 'meshy',
      req,
      taskId: task.id,
      userId,
    })

    return updated
  } catch (error) {
    if (isMeshyConcurrencyError(error)) {
      const deferredTask = await req.payload.update({
        collection: 'generation-tasks',
        data: {
          failureReason: null,
          parameterSnapshot: {
            ...currentSnapshot,
            meshy: {
              ...currentMeshy,
              dispatchDeferredAt: new Date().toISOString(),
              dispatchDeferReason: 'Meshy provider concurrency limit reached.',
              dispatchStartedAt: null,
            },
          },
          progress: Math.max(5, Number(task.progress || 0)),
          status: 'queued',
        },
        id: task.id,
        req,
        overrideAccess: INTERNAL_ACCESS,
      })

      await createTaskEvent({
        eventType: 'queued',
        message: 'Meshy concurrency is full; task deferred for the next sync.',
        payload: {
          detail: error.detail,
          provider: 'meshy',
          status: error.status,
        },
        provider: 'meshy',
        req,
        taskId: task.id,
        userId,
      })

      return deferredTask
    }

    const { creditRules } = args.creditRules ? { creditRules: args.creditRules } : await getTaskBillingSettings(req)
    const configuredCredits = args.configuredCredits ?? getTaskBilledCredits(dispatchingTask)

    await req.payload.update({
      collection: 'generation-tasks',
      data: {
        failureReason: error instanceof Error ? error.message : 'Task submission failed.',
        progress: 100,
        status: 'failed',
      },
      id: task.id,
      req,
      overrideAccess: INTERNAL_ACCESS,
    })

    if (creditRules.reserveOnSubmit && configuredCredits > 0 && creditRules.refundOnFailure) {
      await refundTaskCredits({
        amount: configuredCredits,
        notes: `${task.taskCode} provider dispatch failed, reserved credits refunded.`,
        req,
        taskId: task.id,
        userId,
      }).catch(() => null)
    }

    await createTaskEvent({
      eventType: 'failed',
      message: error instanceof Error ? error.message : 'Task submission failed.',
      payload: {
        configuredCredits,
        provider: 'meshy',
      },
      provider: 'meshy',
      req,
      taskId: task.id,
      userId,
    })

    throw error
  } finally {
    meshyDispatchLocks.delete(taskId)
  }
}

async function dispatchQueuedMeshyTasks(args: { req: PayloadRequest }) {
  const { req } = args
  const concurrencyLimit = await getMeshyProviderConcurrencyLimit(req)
  const availableSlots = concurrencyLimit - (await getActiveMeshyDispatchCount({ req }))

  if (availableSlots <= 0) {
    return
  }

  const queuedTasks = await req.payload.find({
    collection: 'generation-tasks',
    depth: 0,
    limit: Math.min(availableSlots, concurrencyLimit),
    pagination: false,
    req,
    sort: 'createdAt',
    where: {
      and: [
        {
          provider: {
            equals: 'meshy',
          },
        },
        {
          status: {
            equals: 'queued',
          },
        },
      ],
    },
  })

  for (const queuedTask of queuedTasks.docs) {
    if (queuedTask.providerTaskId) {
      continue
    }

    if (queuedTask.inputMode !== 'hybrid' && queuedTask.inputMode !== 'image' && queuedTask.inputMode !== 'text') {
      continue
    }

    await dispatchMeshyTask({
      inputMode: queuedTask.inputMode,
      prompt: queuedTask.prompt,
      req,
      task: queuedTask,
      userId: getTaskUserId(queuedTask),
    })
  }
}

const toMeshySuccessPayload = (args: {
  provider: 'meshy'
  task: MeshyImageTask | MeshyMultiImageTask | MeshyTextTask
  taskCode: string
}) => {
  const { provider, task, taskCode } = args
  const taskPrompt = 'prompt' in task && typeof task.prompt === 'string' ? task.prompt.trim() : ''
  const modelTitle =
    taskPrompt
      ? taskPrompt.slice(0, 80)
      : `${taskCode} Meshy result`

  return {
    description: 'Meshy generated asset synced into Thorns Tavern.',
    meshyTaskId: task.id,
    modelTitle,
    modelUrls: task.model_urls || {},
    printReady: Boolean(task.model_urls?.stl || task.model_urls?.obj || task.model_urls?.glb),
    progress: 100,
    provider,
    providerTaskId: task.id,
    status: 'succeeded',
    textureUrls: task.texture_urls || {},
    thumbnailUrl: task.thumbnail_url || null,
  }
}

const clampTaskProgress = (value: number, min: number, max: number) => {
  if (!Number.isFinite(value)) return min
  return Math.max(min, Math.min(max, Math.round(value)))
}

const mapProviderProgressToRange = (args: {
  fallback: number
  max: number
  min: number
  providerProgress?: number | null
}) => {
  const rawProgress = typeof args.providerProgress === 'number' ? args.providerProgress : args.fallback
  const providerProgress = clampTaskProgress(rawProgress, 0, 100)
  const scaled = args.min + (providerProgress / 100) * (args.max - args.min)

  return clampTaskProgress(scaled, args.min, args.max)
}

const getMeshyStageProgress = (args: {
  fallback: number
  providerProgress?: number | null
  stage: 'image' | 'multi-image' | 'preview' | 'refine'
}) => {
  switch (args.stage) {
    case 'preview':
      return mapProviderProgressToRange({
        fallback: args.fallback,
        max: 55,
        min: 12,
        providerProgress: args.providerProgress,
      })
    case 'refine':
      return mapProviderProgressToRange({
        fallback: args.fallback,
        max: 96,
        min: 60,
        providerProgress: args.providerProgress,
      })
    case 'image':
    case 'multi-image':
    default:
      return mapProviderProgressToRange({
        fallback: args.fallback,
        max: 96,
        min: 12,
        providerProgress: args.providerProgress,
      })
  }
}

async function syncMeshyTask(args: { req: PayloadRequest; task: any; userId: number }) {
  const { req, task, userId } = args
  const settings = await getMeshySettings(req)

  if (!isMeshyConfigured(settings)) {
    throw new Error('Meshy API key is not configured in AI provider settings.')
  }

  const snapshot = getMeshySnapshot(task.parameterSnapshot)

  if (snapshot.mode === 'text-to-3d') {
    if (snapshot.refineTaskId) {
      const refineTask = await retrieveMeshyTextTask({
        settings,
        taskId: snapshot.refineTaskId,
      })
      const mapped = mapMeshyStatus(refineTask.status)

      if (mapped.status === 'succeeded') {
        return updateTaskStatus({
          payloadData: toMeshySuccessPayload({
            provider: 'meshy',
            task: refineTask,
            taskCode: task.taskCode,
          }),
          progress: 100,
          req,
          status: 'succeeded',
          task,
          userId,
        })
      }

      if (mapped.status === 'failed') {
        return updateTaskStatus({
          payloadData: {
            failureReason: getMeshyFailureReason(refineTask),
            provider: 'meshy',
            providerTaskId: refineTask.id,
            status: 'failed',
          },
          progress: 100,
          req,
          status: 'failed',
          task,
          userId,
        })
      }

      return req.payload.update({
        collection: 'generation-tasks',
        data: {
          callbackPayload: {
            provider: 'meshy',
            providerTaskId: refineTask.id,
            stage: 'refine',
            task: refineTask,
          },
          progress: getMeshyStageProgress({
            fallback: mapped.progress,
            providerProgress: refineTask.progress,
            stage: 'refine',
          }),
          status: mapped.status,
        },
        id: task.id,
        req,
        overrideAccess: INTERNAL_ACCESS,
      })
    }

    const previewTaskId = snapshot.previewTaskId || task.providerTaskId
    const previewTask = await retrieveMeshyTextTask({
      settings,
      taskId: String(previewTaskId),
    })
    const mapped = mapMeshyStatus(previewTask.status)

    if (mapped.status === 'succeeded') {
      const refineTask = await createMeshyTextRefineTask({
        previewTaskId: previewTask.id,
        prompt: task.prompt || undefined,
        settings,
        targetFormats: resolveMeshyTargetFormats(isRecord(task.parameterSnapshot) ? task.parameterSnapshot : undefined),
      })

      await createTaskEvent({
        eventType: 'callback',
        message: 'Meshy preview task completed, refine task created.',
        payload: {
          previewTaskId: previewTask.id,
          refineTaskId: refineTask.id,
        },
        provider: 'meshy',
        req,
        taskId: task.id,
        userId,
      })

      return req.payload.update({
        collection: 'generation-tasks',
        data: {
          callbackPayload: {
            previewTask,
            provider: 'meshy',
            refineTaskId: refineTask.id,
            stage: 'refine',
          },
          parameterSnapshot: mergeTaskParameterSnapshot({
            current: task.parameterSnapshot,
            updates: {
              previewTaskId: previewTask.id,
              refineTaskId: refineTask.id,
              stage: 'refine',
            },
          }),
          progress: 60,
          providerTaskId: refineTask.id,
          status: 'processing',
        },
        id: task.id,
        req,
        overrideAccess: INTERNAL_ACCESS,
      })
    }

    if (mapped.status === 'failed') {
      return updateTaskStatus({
        payloadData: {
          failureReason: getMeshyFailureReason(previewTask),
          provider: 'meshy',
          providerTaskId: previewTask.id,
          status: 'failed',
        },
        progress: 100,
        req,
        status: 'failed',
        task,
        userId,
      })
    }

    return req.payload.update({
      collection: 'generation-tasks',
      data: {
        callbackPayload: {
          provider: 'meshy',
          providerTaskId: previewTask.id,
          stage: 'preview',
          task: previewTask,
        },
        progress: getMeshyStageProgress({
          fallback: mapped.progress,
          providerProgress: previewTask.progress,
          stage: 'preview',
        }),
        status: mapped.status,
      },
      id: task.id,
      req,
      overrideAccess: INTERNAL_ACCESS,
    })
  }

  if (snapshot.mode === 'multi-image-to-3d') {
    const multiImageTaskId = snapshot.multiImageTaskId || task.providerTaskId
    const multiImageTask = await retrieveMeshyMultiImageTask({
      settings,
      taskId: String(multiImageTaskId),
    })
    const mapped = mapMeshyStatus(multiImageTask.status)

    if (mapped.status === 'succeeded') {
      return updateTaskStatus({
        payloadData: toMeshySuccessPayload({
          provider: 'meshy',
          task: multiImageTask,
          taskCode: task.taskCode,
        }),
        progress: 100,
        req,
        status: 'succeeded',
        task,
        userId,
      })
    }

    if (mapped.status === 'failed') {
      return updateTaskStatus({
        payloadData: {
          failureReason: getMeshyFailureReason(multiImageTask),
          provider: 'meshy',
          providerTaskId: multiImageTask.id,
          status: 'failed',
        },
        progress: 100,
        req,
        status: 'failed',
        task,
        userId,
      })
    }

    return req.payload.update({
      collection: 'generation-tasks',
      data: {
        callbackPayload: {
          provider: 'meshy',
          providerTaskId: multiImageTask.id,
          stage: 'multi-image',
          task: multiImageTask,
        },
        progress: getMeshyStageProgress({
          fallback: mapped.progress,
          providerProgress: multiImageTask.progress,
          stage: 'multi-image',
        }),
        status: mapped.status,
      },
      id: task.id,
      req,
      overrideAccess: INTERNAL_ACCESS,
    })
  }

  const imageTaskId = snapshot.imageTaskId || task.providerTaskId
  const imageTask = await retrieveMeshyImageTask({
    settings,
    taskId: String(imageTaskId),
  })
  const mapped = mapMeshyStatus(imageTask.status)

  if (mapped.status === 'succeeded') {
    return updateTaskStatus({
      payloadData: toMeshySuccessPayload({
        provider: 'meshy',
        task: imageTask,
        taskCode: task.taskCode,
      }),
      progress: 100,
      req,
      status: 'succeeded',
      task,
      userId,
    })
  }

  if (mapped.status === 'failed') {
    return updateTaskStatus({
      payloadData: {
        failureReason: getMeshyFailureReason(imageTask),
        provider: 'meshy',
        providerTaskId: imageTask.id,
        status: 'failed',
      },
      progress: 100,
      req,
      status: 'failed',
      task,
      userId,
    })
  }

  return req.payload.update({
    collection: 'generation-tasks',
    data: {
      callbackPayload: {
        provider: 'meshy',
        providerTaskId: imageTask.id,
        stage: 'image',
        task: imageTask,
      },
      progress: getMeshyStageProgress({
        fallback: mapped.progress,
        providerProgress: imageTask.progress,
        stage: 'image',
      }),
      status: mapped.status,
    },
    id: task.id,
    req,
    overrideAccess: INTERNAL_ACCESS,
  })
}

export async function submitAITask(args: {
  dispatchProvider?: boolean
  inputMode: 'hybrid' | 'image' | 'text'
  parameterSnapshot?: Record<string, unknown>
  printRequested?: boolean
  prompt?: string
  provider?: SupportedProvider
  req: PayloadRequest
  sourceImageAsset?: Record<string, unknown>
  sourceImageAssets?: Record<string, unknown>[]
  sourceImage?: number
}) {
  const {
    dispatchProvider = true,
    inputMode,
    parameterSnapshot,
    printRequested = false,
    prompt,
    provider = 'custom',
    req,
    sourceImage,
    sourceImageAsset,
    sourceImageAssets,
  } = args

  if (!req.user) {
    throw new Error('Unauthorized')
  }

  const { creditRules, generationPricing, meshyPricing } = await getTaskBillingSettings(req)

  const resolvedProvider = await resolveSubmitProvider({
    preferredProvider: provider,
    req,
  })
  assertProviderAllowedInCurrentEnv(resolvedProvider)
  const configuredCredits =
    resolvedProvider === 'meshy'
      ? resolveMeshyGenerationCredits({
          inputMode,
          pricing: meshyPricing,
          sourceImage,
          sourceImageAsset,
          sourceImageAssets,
        })
      : resolveGenerationCredits({
          inputMode,
          pricing: generationPricing,
        })

  if (creditRules.reserveOnSubmit && configuredCredits > 0) {
    await assertTaskCreditsAvailable({
      amount: configuredCredits,
      req,
      userId: Number(req.user.id),
    })
  }

  const task = await req.payload.create({
    collection: 'generation-tasks',
    data: {
      creditsReserved: creditRules.reserveOnSubmit ? configuredCredits : 0,
      creditsSpent: 0,
      inputMode,
      parameterSnapshot: {
        ...(parameterSnapshot ?? {}),
        billing: {
          configuredCredits,
          refundOnFailure: creditRules.refundOnFailure,
          reserveOnSubmit: creditRules.reserveOnSubmit,
        },
        ...(sourceImageAsset ? { sourceImageAsset } : {}),
        ...(sourceImageAssets?.length ? { sourceImageAssets } : {}),
      },
      printRequested,
      progress: 5,
      prompt,
      provider: resolvedProvider,
      providerTaskId: resolvedProvider === 'custom' ? `mock-${Date.now()}` : '',
      sourceImage,
      startedAt: new Date().toISOString(),
      status: 'queued',
      taskType: 'model-generation',
      taskCode: randomCode('TASK'),
      user: req.user.id,
    },
    req,
    overrideAccess: INTERNAL_ACCESS,
  })

  try {
    if (creditRules.reserveOnSubmit && configuredCredits > 0) {
      await reserveTaskCredits({
        amount: configuredCredits,
        notes: `${task.taskCode} submitted, credits reserved.`,
        req,
        taskId: task.id,
        userId: Number(req.user.id),
      })
    }
    await createTaskEvent({
      eventType: 'queued',
      message:
        resolvedProvider === 'meshy'
          ? 'Task created locally and credits reserved. Waiting to dispatch to Meshy.'
          : 'Task created in local mock mode.',
      provider: resolvedProvider,
      req,
      taskId: task.id,
      userId: Number(req.user.id),
    })

    const meshyDispatchArgs = {
      configuredCredits,
      creditRules,
      inputMode,
      parameterSnapshot,
      prompt,
      req,
      sourceImageAsset,
      sourceImageAssets,
      sourceImage,
      task,
      userId: Number(req.user.id),
    }

    if (resolvedProvider === 'meshy' && dispatchProvider) {
      await dispatchMeshyTask(meshyDispatchArgs)
    } else if (resolvedProvider === 'meshy') {
      void dispatchMeshyTask(meshyDispatchArgs).catch((error) => {
        req.payload.logger.error(
          {
            err: error,
            taskId: task.id,
          },
          'Background Meshy dispatch failed.',
        )
      })
    } else if (resolvedProvider === 'custom') {
      await createTaskEvent({
        eventType: 'submitted',
        message: 'Task entered local mock generation flow.',
        payload: {
          configuredCredits,
          parameterSnapshot,
          prompt,
          providerTaskId: task.providerTaskId,
        },
        provider: resolvedProvider,
        req,
        taskId: task.id,
        userId: Number(req.user.id),
      })
    }
  } catch (error) {
    await req.payload.update({
      collection: 'generation-tasks',
      data: {
        failureReason: error instanceof Error ? error.message : 'Task submission failed.',
        progress: 100,
        status: 'failed',
      },
      id: task.id,
      req,
      overrideAccess: INTERNAL_ACCESS,
    })

    if (creditRules.reserveOnSubmit && configuredCredits > 0 && creditRules.refundOnFailure) {
      await refundTaskCredits({
        amount: configuredCredits,
        notes: `${task.taskCode} provider dispatch failed, reserved credits refunded.`,
        req,
        taskId: task.id,
        userId: Number(req.user.id),
      }).catch(() => null)
    }

    await createTaskEvent({
      eventType: 'failed',
      message: error instanceof Error ? error.message : 'Task submission failed.',
      payload: {
        configuredCredits,
        provider: resolvedProvider,
      },
      provider: resolvedProvider,
      req,
      taskId: task.id,
      userId: Number(req.user.id),
    })

    throw error
  }

  return task
}

export async function syncAITask(args: { req: PayloadRequest; taskId: number }) {
  const { req, taskId } = args

  if (!req.user) {
    throw new Error('Unauthorized')
  }

  const task = await req.payload.findByID({
    collection: 'generation-tasks',
    id: taskId,
    req,
    overrideAccess: false,
  })

  const userId = getTaskUserId(task)
  const provider = getTaskProvider(task)
  const taskTimeoutMs = Math.max(60_000, Number(process.env.TASK_TIMEOUT_MS || 900000))
  const startedAtMs = task.startedAt ? new Date(task.startedAt).getTime() : 0
  const timeoutReached = startedAtMs > 0 && Date.now() - startedAtMs >= taskTimeoutMs

  await maybeCreatePollingTaskEvent({
    provider,
    req,
    taskId: task.id,
    userId,
  })

  if (provider === 'meshy' && !task.providerTaskId) {
    return dispatchMeshyTask({
      inputMode: task.inputMode,
      prompt: task.prompt,
      req,
      task,
      userId,
    })
  }

  if (provider === 'meshy' && task.providerTaskId) {
    const syncedTask = await syncMeshyTask({
      req,
      task,
      userId,
    })

    if (timeoutReached && syncedTask.status !== 'succeeded' && syncedTask.status !== 'failed' && syncedTask.status !== 'timeout') {
      return updateTaskStatus({
        payloadData: {
          failureReason: `Task timed out after ${taskTimeoutMs}ms.`,
          provider,
          providerTaskId: task.providerTaskId,
          status: 'timeout',
        },
        progress: 100,
        req,
        status: 'timeout',
        task: syncedTask,
        userId,
      })
    }

    return syncedTask
  }

  if (task.status === 'succeeded' || task.status === 'failed' || task.status === 'timeout') {
    return task
  }

  if (timeoutReached) {
    return updateTaskStatus({
      payloadData: {
        failureReason: `Task timed out after ${taskTimeoutMs}ms.`,
        provider,
        providerTaskId: task.providerTaskId,
        status: 'timeout',
      },
      progress: 100,
      req,
      status: 'timeout',
      task,
      userId,
    })
  }

  if (task.status === 'queued') {
    return req.payload.update({
      collection: 'generation-tasks',
      data: { progress: 35, status: 'processing' },
      id: task.id,
      req,
      overrideAccess: INTERNAL_ACCESS,
    })
  }

  if (task.status === 'processing' && (task.progress ?? 0) < 85) {
    return req.payload.update({
      collection: 'generation-tasks',
      data: {
        progress: Math.min(85, (task.progress ?? 0) + 30),
        status: 'processing',
      },
      id: task.id,
      req,
      overrideAccess: INTERNAL_ACCESS,
    })
  }

  if (provider === 'custom' && isExplicitMockAIResultsEnabled()) {
    return updateTaskStatus({
      payloadData: {
        modelTitle: `${task.taskCode} mock result`,
        printReady: true,
        progress: 100,
        provider: 'custom',
        providerTaskId: task.providerTaskId,
        status: 'succeeded',
      },
      progress: 100,
      req,
      status: 'succeeded',
      task,
      userId,
    })
  }

  return updateTaskStatus({
    payloadData: {
      failureReason: `${provider} did not return a completed model asset payload.`,
      provider,
      providerTaskId: task.providerTaskId,
      status: 'failed',
    },
    progress: 100,
    req,
    status: 'failed',
    task,
    userId,
  })
}

const extractMeshyWebhookTaskId = (payloadData: Record<string, unknown>) => {
  const candidates = [
    payloadData.id,
    payloadData.task_id,
    payloadData.taskId,
    payloadData.providerTaskId,
    payloadData.result,
  ]

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim()
    }
  }

  return ''
}

export async function handleMeshyWebhook(args: { payloadData: Record<string, unknown>; req: PayloadRequest }) {
  const { payloadData, req } = args
  const providerTaskId = extractMeshyWebhookTaskId(payloadData)

  if (!providerTaskId) {
    throw new Error('Meshy webhook payload did not include a task ID.')
  }

  const tasks = await req.payload.find({
    collection: 'generation-tasks',
    depth: 0,
    limit: 1,
    pagination: false,
    req,
    where: {
      and: [
        {
          provider: {
            equals: 'meshy',
          },
        },
        {
          providerTaskId: {
            equals: providerTaskId,
          },
        },
      ],
    },
  })
  const task = tasks.docs[0]

  if (!task) {
    throw new Error(`Task not found for Meshy providerTaskId: ${providerTaskId}`)
  }

  if (task.status === 'succeeded' || task.status === 'failed' || task.status === 'timeout') {
    return {
      providerTaskId,
      status: task.status,
      taskId: task.id,
    }
  }

  const userId = getTaskUserId(task)
  const syncedTask = await syncMeshyTask({
    req,
    task,
    userId,
  })

  if (isTerminalTaskStatus(syncedTask.status)) {
    await dispatchQueuedMeshyTasks({ req }).catch((error) => {
      req.payload.logger.error(
        {
          err: error,
          providerTaskId,
        },
        'Meshy queued task dispatch pump failed.',
      )
    })
  }

  return {
    providerTaskId,
    status: syncedTask.status,
    taskId: syncedTask.id,
  }
}

export async function handleAIWebhook(args: { payloadData: Record<string, unknown>; req: PayloadRequest }) {
  const { payloadData, req } = args
  const providerTaskId = String(payloadData.providerTaskId ?? payloadData.id ?? '')
  const statusInput = String(payloadData.status ?? 'processing')
  const progress = Number(payloadData.progress ?? 0)

  const status: TaskStatus =
    statusInput === 'failed' || statusInput === 'queued' || statusInput === 'succeeded' || statusInput === 'timeout'
      ? statusInput
      : String(statusInput).toUpperCase() === 'SUCCEEDED'
        ? 'succeeded'
        : String(statusInput).toUpperCase() === 'FAILED'
          ? 'failed'
          : 'processing'

  const tasks = await req.payload.find({
    collection: 'generation-tasks',
    limit: 1,
    pagination: false,
    req,
    where: {
      providerTaskId: {
        equals: providerTaskId,
      },
    },
  })

  const task = tasks.docs[0]

  if (!task) {
    throw new Error(`Task not found for providerTaskId: ${providerTaskId}`)
  }

  const userId = getTaskUserId(task)

  const updatedTask = await updateTaskStatus({
    payloadData,
    progress,
    req,
    status,
    task,
    userId,
  })

  return { providerTaskId, status: updatedTask.status, taskId: task.id }
}
