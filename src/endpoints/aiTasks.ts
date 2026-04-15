import type { PayloadRequest } from 'payload'

import { InsufficientCreditsError } from '@/lib/creditLedger'
import { rejectRateLimitedEndpoint } from '@/lib/endpointRateLimit'
import { handleAIWebhook, submitAITask, syncAITask } from '@/lib/aiTaskFlow'
import { rejectDisallowedMutationOrigin } from '@/lib/requestSecurity'
import { verifyWebhookSignature } from '@/lib/webhookSignature'

const unauthorized = () => Response.json({ message: '请先登录' }, { status: 401 })

const validateWebhook = async (args: { payload: string; req: PayloadRequest }) => {
  const { payload, req } = args
  const configuredSecret = process.env.AI_WEBHOOK_SECRET || process.env.PAYLOAD_AI_WEBHOOK_SECRET || ''
  const signature = req.headers.get('x-provider-signature') || req.headers.get('x-webhook-signature')
  const timestamp = req.headers.get('x-webhook-timestamp')

  return verifyWebhookSignature({
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

    if (!req.user) return unauthorized()

    const rateLimited = await rejectRateLimitedEndpoint({
      req,
      scope: 'ai-submit',
    })
    if (rateLimited) return rateLimited

    try {
      const body = req.json ? await req.json() : {}
      const task = await submitAITask({
        inputMode: body.inputMode ?? 'text',
        parameterSnapshot: body.parameterSnapshot ?? {},
        printRequested: Boolean(body.printRequested ?? false),
        prompt: body.prompt,
        provider: body.provider ?? 'custom',
        req,
        sourceImage: body.sourceImage,
      })

      return Response.json({
        message: '任务已提交',
        next: {
          syncEndpoint: `/api/studio/ai/tasks/${task.id}/sync`,
          webhookEndpoint: '/api/platform/ai/webhooks/provider',
        },
        task,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : '任务提交失败'
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
    return Response.json({ message: '任务同步完成', task })
  },
}

export const aiWebhookEndpoint = {
  path: '/platform/ai/webhooks/provider',
  method: 'post' as const,
  handler: async (req: PayloadRequest) => {
    const rawBody = req.text ? await req.text() : ''
    const verification = await validateWebhook({ payload: rawBody, req })

    if (!verification.ok) {
      if (verification.code === 'REPLAY') {
        return Response.json({ message: 'Webhook replay detected' }, { status: 409 })
      }

      return Response.json({ message: `Webhook verification failed: ${verification.code}` }, { status: 401 })
    }

    let body: Record<string, unknown> = {}
    try {
      body = rawBody ? (JSON.parse(rawBody) as Record<string, unknown>) : {}
    } catch {
      return Response.json({ message: 'Invalid webhook JSON payload' }, { status: 400 })
    }

    const providerTaskId = String(body?.providerTaskId ?? '').trim()

    if (!providerTaskId) {
      return Response.json({ message: 'providerTaskId is required' }, { status: 400 })
    }

    try {
      const result = await handleAIWebhook({ payloadData: body, req })
      return Response.json({ message: '回调处理完成', result })
    } catch (error) {
      const message = error instanceof Error ? error.message : '回调处理失败'

      if (message.includes('Task not found')) {
        return Response.json({ message }, { status: 404 })
      }

      return Response.json({ message }, { status: 400 })
    }
  },
}
