import type { PayloadRequest } from 'payload'

import { createSubscriptionCheckout, createSubscriptionPortal, syncSubscriptionCheckout } from '@/lib/subscriptionFlow'
import { rejectDisallowedMutationOrigin } from '@/lib/requestSecurity'

const unauthorized = () => Response.json({ message: '请先登录' }, { status: 401 })

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message
  }

  return '订阅处理失败'
}

export const createSubscriptionCheckoutEndpoint = {
  path: '/billing/subscriptions/checkout',
  method: 'post' as const,
  handler: async (req: PayloadRequest) => {
    const blocked = rejectDisallowedMutationOrigin(req)
    if (blocked) return blocked

    if (!req.user) return unauthorized()

    try {
      const body = req.json ? await req.json() : {}
      const checkout = await createSubscriptionCheckout({
        planKey: String(body.planKey) as 'starter' | 'pro' | 'studio',
        req,
      })

      return Response.json({
        checkoutUrl: checkout.url,
        message: '订阅结算会话已创建。',
      })
    } catch (error) {
      return Response.json({ message: getErrorMessage(error) }, { status: 400 })
    }
  },
}

export const syncSubscriptionCheckoutEndpoint = {
  path: '/billing/subscriptions/sync',
  method: 'post' as const,
  handler: async (req: PayloadRequest) => {
    if (!req.user) return unauthorized()

    try {
      const body = req.json ? await req.json() : {}
      const result = await syncSubscriptionCheckout({
        req,
        sessionId: String(body.sessionId || ''),
      })

      return Response.json({
        message: '订阅状态已同步。',
        result,
      })
    } catch (error) {
      return Response.json({ message: getErrorMessage(error) }, { status: 400 })
    }
  },
}

export const createSubscriptionPortalEndpoint = {
  path: '/billing/subscriptions/portal',
  method: 'post' as const,
  handler: async (req: PayloadRequest) => {
    if (!req.user) return unauthorized()

    try {
      const portal = await createSubscriptionPortal({ req })

      return Response.json({
        message: '订阅管理入口已创建。',
        portalUrl: portal.url,
      })
    } catch (error) {
      return Response.json({ message: getErrorMessage(error) }, { status: 400 })
    }
  },
}
