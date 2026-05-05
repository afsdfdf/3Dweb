import type Stripe from 'stripe'
import type { PayloadRequest } from 'payload'

import { writeAuditLog } from '@/lib/auditLog'
import { finalizeCreditTopupCheckoutSession } from '@/lib/creditTopupFlow'
import { finalizePrintOrderCheckoutSession } from '@/lib/printOrderFlow'
import { constructStripeWebhookEvent } from '@/lib/stripeGateway'
import { finalizeSubscriptionCheckoutSession, syncStripeSubscriptionState } from '@/lib/subscriptionFlow'

type StripeWebhookTestHooks = {
  constructStripeWebhookEvent?: typeof constructStripeWebhookEvent
  finalizeCreditTopupCheckoutSession?: typeof finalizeCreditTopupCheckoutSession
  finalizePrintOrderCheckoutSession?: typeof finalizePrintOrderCheckoutSession
  finalizeSubscriptionCheckoutSession?: typeof finalizeSubscriptionCheckoutSession
  syncStripeSubscriptionState?: typeof syncStripeSubscriptionState
}

let stripeWebhookTestHooks: null | StripeWebhookTestHooks = null

export function __setStripeWebhookTestHooks(hooks: null | StripeWebhookTestHooks) {
  stripeWebhookTestHooks = hooks
}

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message
  }

  return 'Stripe webhook handling failed'
}

const getNestedString = (value: unknown, path: string[]) => {
  let current: unknown = value

  for (const key of path) {
    if (!current || typeof current !== 'object' || !(key in current)) {
      return ''
    }

    current = (current as Record<string, unknown>)[key]
  }

  return typeof current === 'string' ? current : ''
}

const getEventObjectId = (value: unknown) => {
  return value && typeof value === 'object' && 'id' in value && typeof value.id === 'string' ? value.id : undefined
}

async function handleStripeEvent(args: { event: Stripe.Event; req: PayloadRequest }) {
  const { event, req } = args

  switch (event.type) {
    case 'checkout.session.completed':
    case 'checkout.session.async_payment_succeeded': {
      const session = event.data.object as Stripe.Checkout.Session

      if (session.mode === 'payment') {
        if (session.metadata?.paymentType === 'credit-topup') {
          await (stripeWebhookTestHooks?.finalizeCreditTopupCheckoutSession || finalizeCreditTopupCheckoutSession)({
            req,
            session,
            sessionId: session.id,
          })
          return { ok: true, type: event.type }
        }

        await (stripeWebhookTestHooks?.finalizePrintOrderCheckoutSession || finalizePrintOrderCheckoutSession)({
          req,
          session,
          sessionId: session.id,
        })
        return { ok: true, type: event.type }
      }

      if (session.mode === 'subscription') {
        await (stripeWebhookTestHooks?.finalizeSubscriptionCheckoutSession || finalizeSubscriptionCheckoutSession)({
          req,
          sessionId: session.id,
        })
        return { ok: true, type: event.type }
      }

      return { ignored: true, reason: `Unsupported checkout mode ${session.mode}`, type: event.type }
    }

    case 'invoice.paid': {
      const invoice = event.data.object as Stripe.Invoice
      const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id
      const subscriptionId =
        getNestedString(invoice, ['parent', 'subscription_details', 'subscription']) ||
        getNestedString(invoice, ['lines', 'data', '0', 'parent', 'subscription_item_details', 'subscription'])

      if (!subscriptionId) {
        return { ignored: true, reason: 'Missing invoice subscription id', type: event.type }
      }

      await (stripeWebhookTestHooks?.syncStripeSubscriptionState || syncStripeSubscriptionState)({
        customerId: customerId || undefined,
        req,
        subscriptionId,
      })
      return { ok: true, type: event.type }
    }

    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      const customerId =
        typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id

      await (stripeWebhookTestHooks?.syncStripeSubscriptionState || syncStripeSubscriptionState)({
        customerId: customerId || undefined,
        req,
        subscriptionId: subscription.id,
      })
      return { ok: true, type: event.type }
    }

    default:
      return { ignored: true, type: event.type }
  }
}

export const stripeWebhookEndpoint = {
  path: '/platform/billing/webhooks/stripe',
  method: 'post' as const,
  handler: async (req: PayloadRequest) => {
    const signature = req.headers.get('stripe-signature') || ''
    if (!signature) {
      return Response.json({ message: 'Missing Stripe signature' }, { status: 400 })
    }

    const rawBody = req.text ? await req.text() : ''
    if (!rawBody) {
      return Response.json({ message: 'Empty Stripe payload' }, { status: 400 })
    }

    try {
      const event = (stripeWebhookTestHooks?.constructStripeWebhookEvent || constructStripeWebhookEvent)({
        payload: rawBody,
        signature,
      })

      const result = await handleStripeEvent({
        event,
        req,
      })

      writeAuditLog({
        details: {
          stripeEventType: event.type,
          webhookResult: result,
        },
        eventType: 'stripe.webhook',
        provider: 'stripe',
        req,
        sessionId: event.type.includes('checkout.session') ? getEventObjectId(event.data.object) : undefined,
        status: result.ok ? 'completed' : 'ignored',
        subscriptionId:
          'subscription' in event.data.object && typeof event.data.object.subscription === 'string'
            ? event.data.object.subscription
            : undefined,
      })

      return Response.json({ received: true, result })
    } catch (error) {
      writeAuditLog({
        details: {
          message: getErrorMessage(error),
        },
        eventType: 'stripe.webhook',
        level: 'error',
        provider: 'stripe',
        req,
        status: 'failed',
      })

      req.payload.logger.error({
        err: error,
        msg: 'Stripe webhook processing failed',
      })

      return Response.json({ message: getErrorMessage(error) }, { status: 400 })
    }
  },
}
