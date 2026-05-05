import type { PayloadRequest } from 'payload'

import { handleAIWebhook, handleMeshyWebhook, submitAITask, syncAITask } from '@/lib/aiTaskFlow'
import { writeAuditLog } from '@/lib/auditLog'
import { InsufficientCreditsError } from '@/lib/creditLedger'
import { rejectRateLimitedEndpoint } from '@/lib/endpointRateLimit'
import { ensurePayloadRequestUser } from '@/lib/payloadAuthFallback'
import { rejectDisallowedMutationOrigin } from '@/lib/requestSecurity'
import { verifyWebhookSignature } from '@/lib/webhookSignature'

type AITasksEndpointTestHooks = {
  handleAIWebhook?: typeof handleAIWebhook
  handleMeshyWebhook?: typeof handleMeshyWebhook
  scheduleAfterResponse?: (task: () => Promise<void>) => void
  verifyWebhookSignature?: typeof verifyWebhookSignature
}

let aiTasksEndpointTestHooks: AITasksEndpointTestHooks | null = null

export function __setAITasksEndpointTestHooks(hooks: AITasksEndpointTestHooks | null) {
  aiTasksEndpointTestHooks = hooks
}

const unauthorized = () => Response.json({ message: 'Please sign in first.' }, { status: 401 })

const getMeshyWebhookSecret = () =>
  (process.env.MESHY_WEBHOOK_TOKEN || process.env.AI_WEBHOOK_SECRET || process.env.PAYLOAD_AI_WEBHOOK_SECRET || '').trim()

const getMeshyWebhookToken = (req: PayloadRequest) => {
  const headerToken = req.headers.get('x-meshy-webhook-token') || req.headers.get('x-webhook-token')

  if (headerToken?.trim()) {
    return headerToken.trim()
  }

  try {
    return new URL(String((req as PayloadRequest & { url?: string }).url || 'http://localhost')).searchParams.get('token')?.trim() || ''
  } catch {
    return ''
  }
}

const extractMeshyProviderTaskId = (body: Record<string, unknown>) => {
  const candidates = [body.id, body.task_id, body.taskId, body.providerTaskId, body.result]

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim()
    }
  }

  return ''
}

const scheduleWebhookWork = (task: () => Promise<void>) => {
  if (aiTasksEndpointTestHooks?.scheduleAfterResponse) {
    aiTasksEndpointTestHooks.scheduleAfterResponse(task)
    return
  }

  void import('next/server')
    .then(({ after }) => {
      after(() => {
        void task()
      })
    })
    .catch(() => {
      void task()
    })
}

const validateWebhook = async (args: { payload: string; req: PayloadRequest }) => {
  const { payload, req } = args
  const configuredSecret = process.env.AI_WEBHOOK_SECRET || process.env.PAYLOAD_AI_WEBHOOK_SECRET || ''
  const signature = req.headers.get('x-provider-signature') || req.headers.get('x-webhook-signature')
  const timestamp = req.headers.get('x-webhook-timestamp')

  return (aiTasksEndpointTestHooks?.verifyWebhookSignature || verifyWebhookSignature)({
    payload,
    secret: configuredSecret,
    signature,
    timestamp,
  })
}

export const submitAITaskEndpoint = {
  path: '/studio/ai/tasks',
  method: 'post' as const,
  handler: async (req: PayloadRequest) => {
    const blocked = await rejectDisallowedMutationOrigin(req)
    if (blocked) return blocked

    await ensurePayloadRequestUser(req)
    if (!req.user) return unauthorized()

    const rateLimited = await rejectRateLimitedEndpoint({
      req,
      scope: 'ai-submit',
    })
    if (rateLimited) return rateLimited

    try {
      const body = req.json ? await req.json() : {}
      const task = await submitAITask({
        dispatchProvider: false,
        inputMode: body.inputMode ?? 'text',
        parameterSnapshot: body.parameterSnapshot ?? {},
        printRequested: Boolean(body.printRequested ?? false),
        prompt: body.prompt,
        provider: body.provider ?? 'custom',
        req,
        sourceImageAsset: body.sourceImageAsset ?? undefined,
        sourceImageAssets: Array.isArray(body.sourceImageAssets)
          ? (body.sourceImageAssets.filter(
              (item: unknown) => item && typeof item === 'object' && !Array.isArray(item),
            ) as Record<string, unknown>[])
          : undefined,
        sourceImage: body.sourceImage,
      })

      return Response.json({
        message: 'Task submitted successfully.',
        next: {
          syncEndpoint: `/api/studio/ai/tasks/${task.id}/sync`,
          webhookEndpoint: '/api/platform/ai/webhooks/provider',
        },
        task,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Task submission failed.'
      const status = error instanceof InsufficientCreditsError ? 402 : 400
      return Response.json({ message }, { status })
    }
  },
}

export const syncAITaskEndpoint = {
  path: '/studio/ai/tasks/:taskId/sync',
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

    if (!tasks.docs[0]) {
      return Response.json({ message: 'Task not found.' }, { status: 404 })
    }

    const task = await syncAITask({ req, taskId })
    const responseTask =
      task.status === 'succeeded'
        ? await req.payload.findByID({
            collection: 'generation-tasks',
            depth: 0,
            id: taskId,
            overrideAccess: false,
            req,
            user: req.user,
          })
        : task

    return Response.json({ message: 'Task sync completed.', task: responseTask })
  },
}

export const meshyWebhookEndpoint = {
  path: '/platform/ai/webhooks/meshy',
  method: 'post' as const,
  handler: async (req: PayloadRequest) => {
    const expectedToken = getMeshyWebhookSecret()

    if (!expectedToken) {
      return Response.json({ message: 'Meshy webhook token is not configured.' }, { status: 503 })
    }

    if (getMeshyWebhookToken(req) !== expectedToken) {
      writeAuditLog({
        eventType: 'ai.webhook.verification',
        provider: 'meshy',
        req,
        status: 'rejected',
      })

      return Response.json({ message: 'Meshy webhook token verification failed.' }, { status: 401 })
    }

    const rawBody = req.text ? await req.text() : ''
    let body: Record<string, unknown> = {}

    try {
      body = rawBody ? (JSON.parse(rawBody) as Record<string, unknown>) : {}
    } catch {
      return Response.json({ message: 'Invalid Meshy webhook JSON payload.' }, { status: 400 })
    }

    const providerTaskId = extractMeshyProviderTaskId(body)

    if (!providerTaskId) {
      return Response.json({ message: 'Meshy task ID is required.' }, { status: 400 })
    }

    scheduleWebhookWork(async () => {
      try {
        const result = await (aiTasksEndpointTestHooks?.handleMeshyWebhook || handleMeshyWebhook)({
          payloadData: body,
          req,
        })

        writeAuditLog({
          details: {
            providerTaskId,
          },
          eventType: 'ai.webhook.processing',
          provider: 'meshy',
          req,
          status: 'completed',
          taskId: result.taskId,
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Meshy webhook processing failed.'

        writeAuditLog({
          details: {
            message,
            providerTaskId,
          },
          eventType: 'ai.webhook.processing',
          level: 'error',
          provider: 'meshy',
          req,
          status: 'failed',
        })

        req.payload.logger.error(
          {
            err: error,
            providerTaskId,
          },
          'Meshy webhook processing failed.',
        )
      }
    })

    return Response.json({ message: 'Meshy webhook accepted.' }, { status: 202 })
  },
}

export const aiWebhookEndpoint = {
  path: '/platform/ai/webhooks/provider',
  method: 'post' as const,
  handler: async (req: PayloadRequest) => {
    const rawBody = req.text ? await req.text() : ''
    const verification = await validateWebhook({ payload: rawBody, req })

    if (!verification.ok) {
      writeAuditLog({
        details: {
          verificationCode: verification.code,
        },
        eventType: 'ai.webhook.verification',
        provider: 'ai',
        req,
        status: verification.code === 'REPLAY' ? 'rejected' : 'failed',
      })

      if (verification.code === 'REPLAY') {
        return Response.json({ message: 'Webhook replay detected.' }, { status: 409 })
      }

      return Response.json({ message: `Webhook verification failed: ${verification.code}` }, { status: 401 })
    }

    let body: Record<string, unknown> = {}
    try {
      body = rawBody ? (JSON.parse(rawBody) as Record<string, unknown>) : {}
    } catch {
      return Response.json({ message: 'Invalid webhook JSON payload.' }, { status: 400 })
    }

    const providerTaskId = String(body?.providerTaskId ?? '').trim()

    if (!providerTaskId) {
      return Response.json({ message: 'providerTaskId is required.' }, { status: 400 })
    }

    try {
      const result = await (aiTasksEndpointTestHooks?.handleAIWebhook || handleAIWebhook)({ payloadData: body, req })
      writeAuditLog({
        details: {
          providerTaskId,
        },
        eventType: 'ai.webhook.processing',
        provider: String(body.provider ?? 'custom'),
        req,
        status: 'completed',
        taskId: result.taskId,
      })

      return Response.json({ message: 'Webhook processed successfully.', result })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Webhook processing failed.'
      writeAuditLog({
        details: {
          message,
          providerTaskId,
        },
        eventType: 'ai.webhook.processing',
        level: 'error',
        provider: String(body.provider ?? 'custom'),
        req,
        status: 'failed',
      })

      if (message.includes('Task not found')) {
        return Response.json({ message }, { status: 404 })
      }

      return Response.json({ message }, { status: 400 })
    }
  },
}
