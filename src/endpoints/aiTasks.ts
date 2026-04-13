import type { PayloadRequest } from 'payload'

import { handleAIWebhook, submitAITask, syncAITask } from '@/lib/aiTaskFlow'

const unauthorized = () => Response.json({ message: '请先登录' }, { status: 401 })

const validateWebhook = (req: PayloadRequest) => {
  const configuredSecret = process.env.AI_WEBHOOK_SECRET || process.env.PAYLOAD_AI_WEBHOOK_SECRET

  if (!configuredSecret) {
    return true
  }

  const token = req.headers.get('x-webhook-secret') || req.headers.get('x-provider-signature')
  return token === configuredSecret
}

export const submitAITaskEndpoint = {
  path: '/studio/ai/tasks',
  method: 'post' as const,
  handler: async (req: PayloadRequest) => {
    if (!req.user) return unauthorized()

    const body = req.json ? await req.json() : {}
    const task = await submitAITask({
      creditsReserved: Number(body.creditsReserved ?? 0),
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
    if (!validateWebhook(req)) {
      return Response.json({ message: 'Webhook secret 校验失败' }, { status: 401 })
    }

    const body = req.json ? await req.json() : {}
    const result = await handleAIWebhook({ payloadData: body, req })
    return Response.json({ message: '回调处理完成', result })
  },
}
