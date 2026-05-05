import type { PayloadRequest } from 'payload'

import { createCreditTopupCheckout, syncCreditTopupCheckout } from '@/lib/creditTopupFlow'
import { rejectRateLimitedEndpoint } from '@/lib/endpointRateLimit'
import { ensurePayloadRequestUser } from '@/lib/payloadAuthFallback'
import { rejectDisallowedMutationOrigin } from '@/lib/requestSecurity'

const unauthorized = () => Response.json({ message: 'Please sign in first.' }, { status: 401 })

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message
  }

  return 'Credit purchase request failed.'
}

export const createCreditTopupCheckoutEndpoint = {
  path: '/billing/credits/checkout',
  method: 'post' as const,
  handler: async (req: PayloadRequest) => {
    const blocked = await rejectDisallowedMutationOrigin(req)
    if (blocked) return blocked

    await ensurePayloadRequestUser(req)
    if (!req.user) return unauthorized()

    const rateLimited = await rejectRateLimitedEndpoint({
      req,
      scope: 'credit-checkout',
    })
    if (rateLimited) return rateLimited

    try {
      const body = req.json ? await req.json() : {}
      const checkout = await createCreditTopupCheckout({
        productId: body.productId,
        productSlug: body.productSlug,
        req,
      })

      return Response.json({
        checkoutReference: checkout.checkoutReference,
        checkoutUrl: checkout.checkoutUrl,
        message: 'Credit checkout session created.',
      })
    } catch (error) {
      return Response.json({ message: getErrorMessage(error) }, { status: 400 })
    }
  },
}

export const syncCreditTopupCheckoutEndpoint = {
  path: '/billing/credits/sync',
  method: 'post' as const,
  handler: async (req: PayloadRequest) => {
    const blocked = await rejectDisallowedMutationOrigin(req)
    if (blocked) return blocked

    await ensurePayloadRequestUser(req)
    if (!req.user) return unauthorized()

    const rateLimited = await rejectRateLimitedEndpoint({
      req,
      scope: 'credit-sync',
    })
    if (rateLimited) return rateLimited

    try {
      const body = req.json ? await req.json() : {}
      const result = await syncCreditTopupCheckout({
        req,
        sessionId: String(body.sessionId || ''),
      })

      return Response.json({
        message: 'Credit purchase synced.',
        result,
      })
    } catch (error) {
      return Response.json({ message: getErrorMessage(error) }, { status: 400 })
    }
  },
}
