import type { PayloadRequest } from 'payload'

import { refundTaskCredits, reserveTaskCredits, settleReservedTaskCredits, spendTaskCredits } from '@/lib/creditLedger'
import {
  createMeshyImageTask,
  createMeshyTextPreviewTask,
  createMeshyTextRefineTask,
  getMeshyFailureReason,
  getMeshySettings,
  isMeshyConfigured,
  mapMeshyStatus,
  type MeshyImageTask,
  type MeshyTextTask,
  resolveMeshyImageURL,
  retrieveMeshyImageTask,
  retrieveMeshyTextTask,
} from '@/lib/meshyGateway'
import { isAllowedRemoteAssetURL } from '@/lib/remoteAssetSecurity'
import { defaultTaskCreditRules, getTaskBillingSettings, readTaskBillingSnapshot, resolveGenerationCredits } from '@/lib/taskBilling'

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

type SupportedProvider = 'custom' | 'meshy' | 'tripo'

type MeshySnapshot = {
  imageTaskId?: string
  mode?: 'image-to-3d' | 'text-to-3d'
  previewTaskId?: string
  refineTaskId?: string
  stage?: 'image' | 'preview' | 'refine'
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
    mode: meshy.mode === 'image-to-3d' || meshy.mode === 'text-to-3d' ? meshy.mode : undefined,
    previewTaskId: typeof meshy.previewTaskId === 'string' ? meshy.previewTaskId : undefined,
    refineTaskId: typeof meshy.refineTaskId === 'string' ? meshy.refineTaskId : undefined,
    stage: meshy.stage === 'image' || meshy.stage === 'preview' || meshy.stage === 'refine' ? meshy.stage : undefined,
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
      await settleReservedTaskCredits({
        amount: billedCredits,
        notes: `${task.taskCode} generation succeeded, reserved credits settled.`,
        req,
        taskId: task.id,
        userId,
      })
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
      ...accessOptions(req),
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

  return req.payload.create({
    collection: 'task-events',
    data: {
      eventType,
      message,
      payload,
      provider,
      task: taskId,
      user: userId,
    },
    req,
    ...accessOptions(req),
  })
}

async function createResultModel(args: {
  payloadData?: Record<string, unknown>
  req: PayloadRequest
  task: any
  userId: number
}) {
  const { payloadData, req, task, userId } = args
  const supportedFormats = ['glb', 'fbx', 'obj', 'stl', 'usdz'] as const
  const { generationPricing } = await getTaskBillingSettings(req)

  if (task.resultModel) {
    return task.resultModel
  }

  const rawModelURLs = isRecord(payloadData?.modelUrls) ? payloadData?.modelUrls : {}
  const modelURLs: Record<string, string> = {}

  for (const format of supportedFormats) {
    const candidate = rawModelURLs[format]
    if (typeof candidate !== 'string' || !candidate.trim()) {
      continue
    }

    const allowed = await isAllowedRemoteAssetURL({
      payload: req.payload,
      url: candidate,
    })

    if (allowed) {
      modelURLs[format] = candidate
      continue
    }

    req.payload.logger.warn({
      format,
      msg: 'Dropped remote model URL because the host is not on the allowlist.',
      taskId: task.id,
      url: candidate,
    })
  }

  const formats = supportedFormats
    .filter((format) => typeof modelURLs[format] === 'string' && String(modelURLs[format]).length > 0)
    .map((format) => ({
      downloadCredits: generationPricing.downloadCredits,
      file: null,
      fileSizeMb: 0,
      format,
    }))

  const model = await req.payload.create({
    collection: 'models',
    data: {
      description:
        typeof payloadData?.description === 'string'
          ? payloadData.description
          : payloadData?.provider === 'meshy'
            ? 'Generated by Meshy and synced into the local asset library.'
            : 'Local mock AI generation result.',
      formats:
        formats.length > 0
          ? formats
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
      printReady: Boolean(payloadData?.printReady ?? true),
      sourceTask: task.id,
      status: 'ready',
      title: String(payloadData?.modelTitle ?? `${task.taskCode} result model`),
      viewerUrl: `/results/${task.taskCode}`,
      visibility: 'private',
    },
    req,
    ...accessOptions(req),
  })

  await req.payload.update({
    collection: 'generation-tasks',
    data: {
      resultModel: model.id,
    },
    id: task.id,
    req,
    ...accessOptions(req),
  })

  return model.id
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

  const updated = await req.payload.update({
    collection: 'generation-tasks',
    data: {
      callbackPayload: payloadData ?? task.callbackPayload ?? null,
      completedAt: status === 'succeeded' ? new Date().toISOString() : undefined,
      failureReason:
        status === 'failed'
          ? String(payloadData?.failureReason ?? `${provider} generation failed.`)
          : status === 'timeout'
            ? 'Task timed out.'
            : undefined,
      progress,
      status,
    },
    id: task.id,
    req,
    ...accessOptions(req),
  })

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
    taskId: task.id,
    userId,
  })

  if (status === 'succeeded') {
    await createResultModel({
      payloadData,
      req,
      task: updated,
      userId,
    })
  }

  return updated
}

async function resolveSubmitProvider(args: {
  preferredProvider?: SupportedProvider
  req: PayloadRequest
}) {
  const { preferredProvider = 'custom', req } = args

  if (preferredProvider === 'meshy') {
    return 'meshy' as const
  }

  const meshySettings = await getMeshySettings(req)
  if (isMeshyConfigured(meshySettings)) {
    return 'meshy' as const
  }

  return preferredProvider
}

function assertProviderAllowedInCurrentEnv(provider: SupportedProvider) {
  const allowMockInProduction = process.env.ALLOW_MOCK_AI === 'true'
  const isProduction = process.env.NODE_ENV === 'production'

  if (isProduction && provider === 'custom' && !allowMockInProduction) {
    throw new Error('Production mode requires a real AI provider. Please configure Meshy API Key in admin settings.')
  }
}

async function createMeshyTask(args: {
  inputMode: 'hybrid' | 'image' | 'text'
  prompt?: string
  req: PayloadRequest
  sourceImage?: number
  style?: string
}) {
  const { inputMode, prompt, req, sourceImage, style } = args
  const settings = await getMeshySettings(req)

  if (!isMeshyConfigured(settings)) {
    throw new Error('Meshy API key is not configured in AI provider settings.')
  }

  if (inputMode === 'text') {
    const previewTask = await createMeshyTextPreviewTask({
      prompt: String(prompt || '').trim(),
      settings,
      style,
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

  if (!sourceImage) {
    throw new Error('Meshy image generation requires a source image.')
  }

  const imageURL = await resolveMeshyImageURL({
    mediaId: sourceImage,
    req,
  })

  const imageTask = await createMeshyImageTask({
    imageURL,
    prompt,
    settings,
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

const toMeshySuccessPayload = (args: {
  provider: 'meshy'
  task: MeshyImageTask | MeshyTextTask
  taskCode: string
}) => {
  const { provider, task, taskCode } = args
  const taskPrompt = 'prompt' in task && typeof task.prompt === 'string' ? task.prompt.trim() : ''
  const modelTitle =
    taskPrompt
      ? taskPrompt.slice(0, 80)
      : `${taskCode} Meshy result`

  return {
    description: 'Meshy generated asset synced into MiniForge.',
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
          progress: typeof refineTask.progress === 'number' ? refineTask.progress : mapped.progress,
          status: mapped.status,
        },
        id: task.id,
        req,
        overrideAccess: false,
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
          progress: 70,
          providerTaskId: refineTask.id,
          status: 'processing',
        },
        id: task.id,
        req,
        overrideAccess: false,
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
        progress: typeof previewTask.progress === 'number' ? previewTask.progress : mapped.progress,
        status: mapped.status,
      },
      id: task.id,
      req,
      overrideAccess: false,
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
      progress: typeof imageTask.progress === 'number' ? imageTask.progress : mapped.progress,
      status: mapped.status,
    },
    id: task.id,
    req,
    overrideAccess: false,
  })
}

export async function submitAITask(args: {
  inputMode: 'hybrid' | 'image' | 'text'
  parameterSnapshot?: Record<string, unknown>
  printRequested?: boolean
  prompt?: string
  provider?: SupportedProvider
  req: PayloadRequest
  sourceImage?: number
}) {
  const { inputMode, parameterSnapshot, printRequested = false, prompt, provider = 'custom', req, sourceImage } = args

  if (!req.user) {
    throw new Error('Unauthorized')
  }

  const { creditRules, generationPricing } = await getTaskBillingSettings(req)
  const configuredCredits = resolveGenerationCredits({
    inputMode,
    pricing: generationPricing,
  })

  const resolvedProvider = await resolveSubmitProvider({
    preferredProvider: provider,
    req,
  })
  assertProviderAllowedInCurrentEnv(resolvedProvider)

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
      },
      printRequested,
      progress: 5,
      prompt,
      provider: resolvedProvider,
      providerTaskId: resolvedProvider === 'custom' ? `mock-${Date.now()}` : '',
      sourceImage,
      startedAt: new Date().toISOString(),
      status: 'queued',
      taskCode: randomCode('TASK'),
      user: req.user.id,
    },
    req,
    overrideAccess: false,
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

    if (resolvedProvider === 'meshy') {
      const providerResult = await createMeshyTask({
        inputMode,
        prompt,
        req,
        sourceImage,
        style: typeof parameterSnapshot?.style === 'string' ? parameterSnapshot.style : undefined,
      })

      await req.payload.update({
        collection: 'generation-tasks',
        data: {
          parameterSnapshot: {
            ...(parameterSnapshot ?? {}),
            billing: {
              configuredCredits,
              refundOnFailure: creditRules.refundOnFailure,
              reserveOnSubmit: creditRules.reserveOnSubmit,
            },
            ...(Object.keys(providerResult.parameterSnapshotUpdate).length > 0
              ? {
                  meshy: providerResult.parameterSnapshotUpdate,
                }
              : {}),
          },
          progress: 8,
          providerTaskId: providerResult.providerTaskId,
        },
        id: task.id,
        req,
        overrideAccess: false,
      })

      await createTaskEvent({
        eventType: 'submitted',
        message: 'Task submitted to Meshy provider.',
        payload: {
          configuredCredits,
          parameterSnapshot,
          prompt,
          providerTaskId: providerResult.providerTaskId,
        },
        provider: resolvedProvider,
        req,
        taskId: task.id,
        userId: Number(req.user.id),
      })
    } else {
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
      overrideAccess: false,
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

  await createTaskEvent({
    eventType: 'polling',
    message: `${provider} task sync requested by frontend.`,
    provider,
    req,
    taskId: task.id,
    userId,
  })

  if (task.status === 'succeeded' || task.status === 'failed' || task.status === 'timeout') {
    return task
  }

  if (provider === 'meshy') {
    return syncMeshyTask({
      req,
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
      overrideAccess: false,
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
      overrideAccess: false,
    })
  }

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

  await updateTaskStatus({
    payloadData,
    progress,
    req,
    status,
    task,
    userId,
  })

  return { providerTaskId, status, taskId: task.id }
}
