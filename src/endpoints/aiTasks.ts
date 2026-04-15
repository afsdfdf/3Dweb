import type { PayloadRequest } from 'payload'

import { InsufficientCreditsError } from '@/lib/creditLedger'
import { handleAIWebhook, submitAITask, syncAITask } from '@/lib/aiTaskFlow'

const unauthorized = () => Response.json({ message: '请先登录' }, { status: 401 })

const validateWebhook = async (req: PayloadRequest) => {
  let configuredSecret = process.env.AI_WEBHOOK_SECRET || process.env.PAYLOAD_AI_WEBHOOK_SECRET || ''

  if (!configuredSecret) {
    const globalConfig = await req.payload
      .findGlobal({
        slug: 'ai-provider-settings',
      })
      .catch(() => null)

    configuredSecret = typeof globalConfig?.webhookSecret === 'string' ? globalConfig.webhookSecret.trim() : ''
  }

  if (!configuredSecret) {
    return false
  }

  const token = req.headers.get('x-webhook-secret') || req.headers.get('x-provider-signature')
  return token === configuredSecret
}

export const submitAITaskEndpoint = {
  path: '/studio/ai/tasks',
  method: 'post' as const,
  handler: async (req: PayloadRequest) => {
    if (!req.user) return unauthorized()

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
    if (!req.user) return unauthorized()

    const task = await syncAITask({ req, taskId: Number(String(req.routeParams?.taskId ?? '0')) })
    return Response.json({ message: '任务同步完成', task })
  },
}

export const aiWebhookEndpoint = {
  path: '/platform/ai/webhooks/provider',
  method: 'post' as const,
  handler: async (req: PayloadRequest) => {
    if (!(await validateWebhook(req))) {
      return Response.json({ message: 'Webhook 密钥校验失败' }, { status: 401 })
    }

    const body = req.json ? await req.json() : {}
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
