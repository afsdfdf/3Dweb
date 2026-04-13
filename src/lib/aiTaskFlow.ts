import type { PayloadRequest } from 'payload'

const randomCode = (prefix: string) => {
  const date = new Date()
  const stamp = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(
    date.getDate(),
  ).padStart(2, '0')}${String(date.getHours()).padStart(2, '0')}${String(date.getMinutes()).padStart(
    2,
    '0',
  )}${String(date.getSeconds()).padStart(2, '0')}`

  return `${prefix}-${stamp}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
}

type TaskStatus = 'failed' | 'processing' | 'queued' | 'succeeded' | 'timeout'

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
  })
}

async function createMockModel(args: {
  payloadData?: Record<string, unknown>
  req: PayloadRequest
  task: any
  userId: number
}) {
  const { payloadData, req, task, userId } = args

  if (task.resultModel) {
    return task.resultModel
  }

  const model = await req.payload.create({
    collection: 'models',
    data: {
      description: '本地模拟 AI 生成的测试模型',
      formats: [
        {
          downloadCredits: 0,
          file: null,
          fileSizeMb: 1.2,
          format: 'glb',
        },
        {
          downloadCredits: 0,
          file: null,
          fileSizeMb: 0.8,
          format: 'stl',
        },
      ],
      owner: userId,
      printReady: Boolean(payloadData?.printReady ?? true),
      sourceTask: task.id,
      status: 'ready',
      title: String(payloadData?.modelTitle ?? `${task.taskCode} 模拟结果`),
      viewerUrl: `/results/${task.taskCode}`,
      visibility: 'private',
    },
    req,
  })

  await req.payload.update({
    collection: 'generation-tasks',
    data: {
      resultModel: model.id,
    },
    id: task.id,
    req,
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

  const updated = await req.payload.update({
    collection: 'generation-tasks',
    data: {
      callbackPayload: payloadData ?? task.callbackPayload ?? null,
      completedAt: status === 'succeeded' ? new Date().toISOString() : undefined,
      failureReason: status === 'failed' ? String(payloadData?.failureReason ?? '模拟生成失败') : undefined,
      progress,
      status,
    },
    id: task.id,
    req,
  })

  await createTaskEvent({
    eventType: status === 'succeeded' ? 'completed' : status === 'failed' ? 'failed' : 'callback',
    message:
      status === 'succeeded'
        ? '模拟任务已完成'
        : status === 'failed'
          ? '模拟任务失败'
          : '收到任务状态回调',
    payload: payloadData,
    provider: String(task.provider ?? 'custom'),
    req,
    taskId: task.id,
    userId,
  })

  if (status === 'succeeded') {
    await createMockModel({
      payloadData,
      req,
      task: updated,
      userId,
    })
  }

  return updated
}

export async function submitAITask(args: {
  creditsReserved?: number
  inputMode: 'hybrid' | 'image' | 'text'
  parameterSnapshot?: Record<string, unknown>
  printRequested?: boolean
  prompt?: string
  provider?: 'custom' | 'meshy' | 'tripo'
  req: PayloadRequest
  sourceImage?: number
}) {
  const {
    creditsReserved = 0,
    inputMode,
    parameterSnapshot,
    printRequested = false,
    prompt,
    provider = 'custom',
    req,
    sourceImage,
  } = args

  if (!req.user) {
    throw new Error('Unauthorized')
  }

  const task = await req.payload.create({
    collection: 'generation-tasks',
    data: {
      creditsReserved,
      inputMode,
      parameterSnapshot,
      printRequested,
      progress: 5,
      prompt,
      provider,
      providerTaskId: `mock-${Date.now()}`,
      sourceImage,
      startedAt: new Date().toISOString(),
      status: 'queued',
      taskCode: randomCode('TASK'),
      user: req.user.id,
    },
    req,
  })

  await createTaskEvent({
    eventType: 'queued',
    message: '任务已创建，等待模拟生成',
    provider,
    req,
    taskId: task.id,
    userId: Number(req.user.id),
  })

  await createTaskEvent({
    eventType: 'submitted',
    message: '已进入本地模拟 AI 生成流程',
    payload: {
      parameterSnapshot,
      prompt,
    },
    provider,
    req,
    taskId: task.id,
    userId: Number(req.user.id),
  })

  return task
}

export async function syncAITask(args: { req: PayloadRequest; taskId: number }) {
  const { req, taskId } = args
  const task = await req.payload.findByID({
    collection: 'generation-tasks',
    id: taskId,
    req,
  })

  const userId = typeof task.user === 'object' && task.user ? Number(task.user.id) : Number(task.user)

  await createTaskEvent({
    eventType: 'polling',
    message: '前端触发模拟轮询',
    provider: String(task.provider ?? 'custom'),
    req,
    taskId: task.id,
    userId,
  })

  if (task.status === 'succeeded' || task.status === 'failed' || task.status === 'timeout') {
    return task
  }

  if (task.status === 'queued') {
    return req.payload.update({
      collection: 'generation-tasks',
      data: { progress: 35, status: 'processing' },
      id: task.id,
      req,
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
    })
  }

  return updateTaskStatus({
    payloadData: {
      modelTitle: `${task.taskCode} 模拟模型`,
      printReady: true,
      progress: 100,
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
  const providerTaskId = String(payloadData.providerTaskId ?? '')
  const statusInput = String(payloadData.status ?? 'processing')
  const progress = Number(payloadData.progress ?? 0)

  const status: TaskStatus =
    statusInput === 'failed' || statusInput === 'queued' || statusInput === 'succeeded' || statusInput === 'timeout'
      ? statusInput
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

  const userId = typeof task.user === 'object' && task.user ? Number(task.user.id) : Number(task.user)

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
