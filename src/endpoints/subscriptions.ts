import type { PayloadRequest } from 'payload'

import { rejectRateLimitedEndpoint } from '@/lib/endpointRateLimit'
import { ensurePayloadRequestUser } from '@/lib/payloadAuthFallback'
import {
  createSubscriptionCheckout,
  createSubscriptionPortal,
  syncSubscriptionCheckout,
} from '@/lib/subscriptionFlow'
import { rejectDisallowedMutationOrigin } from '@/lib/requestSecurity'

const unauthorized = () => Response.json({ message: 'Please sign in first.' }, { status: 401 })

const VALID_PLAN_KEYS = ['starter', 'pro', 'studio'] as const
type ValidPlanKey = (typeof VALID_PLAN_KEYS)[number]

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message
  }

  return 'Subscription request failed.'
}

export const createSubscriptionCheckoutEndpoint = {
  path: '/billing/subscriptions/checkout',
  method: 'post' as const,
  handler: async (req: PayloadRequest) => {
    const blocked = await rejectDisallowedMutationOrigin(req)
    if (blocked) return blocked

    await ensurePayloadRequestUser(req)
    if (!req.user) return unauthorized()

    const rateLimited = await rejectRateLimitedEndpoint({
      req,
      scope: 'subscription-checkout',
    })
    if (rateLimited) return rateLimited

    try {
      const body = req.json ? await req.json() : {}
      const planKey = VALID_PLAN_KEYS.find((key) => key === body.planKey)
      if (!planKey) {
        return Response.json({ message: 'Invalid plan key.' }, { status: 400 })
      }

      const checkout = await createSubscriptionCheckout({
        planKey: planKey as ValidPlanKey,
        req,
      })

      return Response.json({
        checkoutUrl: checkout.url,
        message: 'Subscription checkout session created.',
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
    const blocked = await rejectDisallowedMutationOrigin(req)
    if (blocked) return blocked

    await ensurePayloadRequestUser(req)
    if (!req.user) return unauthorized()

    const rateLimited = await rejectRateLimitedEndpoint({
      req,
      scope: 'subscription-sync',
    })
    if (rateLimited) return rateLimited

    try {
      const body = req.json ? await req.json() : {}
      const result = await syncSubscriptionCheckout({
        req,
        sessionId: String(body.sessionId || ''),
      })

      return Response.json({
        message: 'Subscription state synced.',
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
    const blocked = await rejectDisallowedMutationOrigin(req)
    if (blocked) return blocked

    await ensurePayloadRequestUser(req)
    if (!req.user) return unauthorized()

    const rateLimited = await rejectRateLimitedEndpoint({
      req,
      scope: 'subscription-portal',
    })
    if (rateLimited) return rateLimited

    try {
      const portal = await createSubscriptionPortal({ req })

      return Response.json({
        message: 'Subscription management portal created.',
        portalUrl: portal.url,
      })
    } catch (error) {
      return Response.json({ message: getErrorMessage(error) }, { status: 400 })
    }
  },
}
