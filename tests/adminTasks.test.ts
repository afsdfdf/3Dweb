import assert from 'node:assert/strict'
import test from 'node:test'

import {
  __setAdminTasksTestHooks,
  exportAdminTaskDetail,
  getAdminTaskWorkspace,
  markAdminTaskFailed,
  reingestAdminTaskResult,
  resyncAdminTaskStatus,
  retryAdminTask,
} from '../src/lib/adminTasks.ts'

const createTaskRequest = (role: 'admin' | 'customer' | 'operator') => {
  const state = {
    createdEvents: [] as Array<Record<string, unknown>>,
    updates: [] as Array<{ collection: string; data: Record<string, unknown>; id: number }>,
  }

  const baseTask = {
    callbackPayload: {
      modelTitle: 'Task Result',
      provider: 'meshy',
      providerTaskId: 'provider-task-1',
      status: 'succeeded',
    },
    creditsReserved: 5,
    creditsSpent: 5,
    failureReason: 'old error',
    id: 21,
    inputMode: 'text',
    parameterSnapshot: {
      billing: { configuredCredits: 5 },
      foo: 'bar',
      meshy: { previewTaskId: 'old-preview' },
    },
    printRequested: false,
    progress: 100,
    prompt: 'make a dragon',
    provider: 'meshy',
    providerTaskId: 'provider-task-1',
    resultModel: 91,
    sourceImage: null,
    status: 'failed',
    taskCode: 'TASK-021',
    user: {
      email: 'task-user@example.com',
      id: 9,
      role: 'customer',
    },
  }

  const payload = {
    create: async ({ collection, data }: { collection: string; data: Record<string, unknown> }) => {
      if (collection === 'task-events') {
        state.createdEvents.push(data)
        return {
          id: state.createdEvents.length,
          ...data,
        }
      }

      throw new Error(`Unsupported create collection: ${collection}`)
    },
    find: async ({ collection }: { collection: string }) => {
      if (collection === 'task-events') {
        return {
          docs: [{ id: 101, task: 21 }],
        }
      }

      if (collection === 'credit-transactions') {
        return {
          docs: [{ id: 201, sourceTask: 21 }],
        }
      }

      throw new Error(`Unsupported find collection: ${collection}`)
    },
    findByID: async ({ collection }: { collection: string }) => {
      if (collection === 'generation-tasks') {
        return { ...baseTask }
      }

      if (collection === 'models') {
        return { id: 91, title: 'Task Result Model' }
      }

      throw new Error(`Unsupported findByID collection: ${collection}`)
    },
    logger: {
      error: () => undefined,
      info: () => undefined,
      warn: () => undefined,
    },
    update: async ({ collection, data, id }: { collection: string; data: Record<string, unknown>; id: number }) => {
      state.updates.push({ collection, data, id })
      return {
        ...baseTask,
        ...data,
        id,
      }
    },
  }

  return {
    req: {
      payload,
      user: {
        id: 1,
        role,
      },
    } as never,
    state,
  }
}

test('getAdminTaskWorkspace aggregates task detail modules for staff', async () => {
  const { req } = createTaskRequest('operator')

  const workspace = await getAdminTaskWorkspace({
    req,
    taskId: 21,
  })

  assert.equal(workspace.summary.provider, 'meshy')
  assert.equal(workspace.summary.hasFailureReason, true)
  assert.equal(workspace.summary.hasResultModel, true)
  assert.equal(workspace.sections.taskEvents.length, 1)
  assert.equal(workspace.sections.creditTransactions.length, 1)
  assert.equal(workspace.sections.resultModel?.id, 91)
})

test('customer cannot operate admin task actions', async () => {
  const { req } = createTaskRequest('customer')

  await assert.rejects(() => resyncAdminTaskStatus({ req, taskId: 21 }), /Forbidden/)
  await assert.rejects(() => markAdminTaskFailed({ reason: 'x', req, taskId: 21 }), /Forbidden/)
  await assert.rejects(() => retryAdminTask({ reason: 'x', req, taskId: 21 }), /Forbidden/)
})

test('staff can manually mark task as failed', async () => {
  const { req, state } = createTaskRequest('operator')

  const task = await markAdminTaskFailed({
    reason: 'provider returned invalid payload',
    req,
    taskId: 21,
  })

  assert.equal(task.status, 'failed')
  assert.equal(task.failureReason, 'provider returned invalid payload')
  assert.equal(state.updates[0]?.collection, 'generation-tasks')
  assert.equal(state.createdEvents.length, 1)
})

test('staff can resync task status through existing sync flow', async () => {
  const { req } = createTaskRequest('operator')
  let syncCalls = 0

  __setAdminTasksTestHooks({
    syncAITask: async () => {
      syncCalls += 1
      return {
        id: 21,
        status: 'processing',
        user: { id: 9 },
      } as never
    },
  })

  try {
    const task = await resyncAdminTaskStatus({
      req,
      taskId: 21,
    })

    assert.equal(syncCalls, 1)
    assert.equal(task.status, 'processing')
  } finally {
    __setAdminTasksTestHooks(null)
  }
})

test('staff can retry a failed task and sanitize runtime-only snapshot fields', async () => {
  const { req, state } = createTaskRequest('operator')
  let submitInput: Record<string, unknown> | null = null

  __setAdminTasksTestHooks({
    submitAITask: async (input) => {
      submitInput = input as unknown as Record<string, unknown>
      return {
        id: 88,
      } as never
    },
  })

  try {
    const newTask = await retryAdminTask({
      reason: 'manual retry',
      req,
      taskId: 21,
    })

    assert.equal(newTask.id, 88)
    assert.ok(submitInput)
    assert.equal((submitInput as any)?.prompt, 'make a dragon')
    assert.deepEqual((submitInput as any)?.parameterSnapshot, { foo: 'bar' })
    assert.equal(state.createdEvents.length, 1)
  } finally {
    __setAdminTasksTestHooks(null)
  }
})

test('staff can re-trigger result ingestion', async () => {
  const { req, state } = createTaskRequest('operator')
  let reingestCalls = 0

  __setAdminTasksTestHooks({
    ensureTaskResultModel: async () => {
      reingestCalls += 1
      return 91
    },
  })

  try {
    const resultModel = await reingestAdminTaskResult({
      req,
      taskId: 21,
    })

    assert.equal(resultModel, 91)
    assert.equal(reingestCalls, 1)
    assert.equal(state.createdEvents.length, 1)
  } finally {
    __setAdminTasksTestHooks(null)
  }
})

test('staff can export task detail as JSON', async () => {
  const { req } = createTaskRequest('operator')

  const payload = await exportAdminTaskDetail({
    req,
    taskId: 21,
  })

  const parsed = JSON.parse(payload)
  assert.equal(parsed.summary.providerTaskId, 'provider-task-1')
  assert.equal(parsed.sections.task.taskCode, 'TASK-021')
})
