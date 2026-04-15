import type { PayloadRequest } from 'payload'
import type Stripe from 'stripe'

import { sendOrderPaidEmail } from '@/lib/businessEmails'
import { getPaymentProviderSettings } from '@/lib/paymentProviders'
import { getStripeGateway } from '@/lib/stripeGateway'

const INTERNAL_ACCESS = true

const randomCode = (prefix: string) => {
  const date = new Date()
  const stamp = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(
    date.getDate(),
  ).padStart(2, '0')}${String(date.getHours()).padStart(2, '0')}${String(date.getMinutes()).padStart(2, '0')}${String(
    date.getSeconds(),
  ).padStart(2, '0')}`

  return `${prefix}-${stamp}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
}

const ORDER_PRICE_MAP: Record<string, number> = {
  premium: 79.9,
  standard: 39.9,
}

const MATERIAL_PRICE_MAP: Record<string, number> = {
  resin: 10,
  plastic: 0,
}

const getAppOrigin = (req: PayloadRequest) => {
  const origin = req.headers?.get?.('origin')
  if (origin) return origin

  const forwardedHost = req.headers?.get?.('x-forwarded-host')
  const host = forwardedHost || req.headers?.get?.('host')
  const proto = req.headers?.get?.('x-forwarded-proto') || 'http'

  if (host) {
    return `${proto}://${host}`
  }

  return process.env.NEXT_PUBLIC_APP_URL || 'http://127.0.0.1:3000'
}

const buildOrderUrl = (req: PayloadRequest, orderId: number | string, query: Record<string, string> = {}) => {
  const url = new URL(`/dashboard/orders/${orderId}`, getAppOrigin(req))

  Object.entries(query).forEach(([key, value]) => {
    url.searchParams.set(key, value)
  })

  return url.toString()
}

const getUserEmail = (req: PayloadRequest) => {
  const email = req.user && typeof req.user === 'object' && 'email' in req.user ? req.user.email : undefined
  return typeof email === 'string' ? email : undefined
}

const getProviderFromPayload = (value: unknown) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null
  }

  return typeof (value as Record<string, unknown>).provider === 'string'
    ? String((value as Record<string, unknown>).provider)
    : null
}

async function finalizePrintOrderPayment(args: {
  checkoutSession: Stripe.Checkout.Session
  req: PayloadRequest
}) {
  const { checkoutSession, req } = args

  const payments = await req.payload.find({
    collection: 'shopify-payments',
    depth: 0,
    limit: 1,
    overrideAccess: INTERNAL_ACCESS,
    pagination: false,
    req,
    where: {
      shopifyCheckoutId: {
        equals: checkoutSession.id,
      },
    },
  })

  const payment = payments.docs[0]
  if (!payment) {
    throw new Error(`Payment record not found for Stripe session ${checkoutSession.id}`)
  }

  const linkedOrderId =
    typeof payment.linkedOrder === 'object' && payment.linkedOrder ? payment.linkedOrder.id : payment.linkedOrder

  if (!linkedOrderId) {
    throw new Error(`Linked order is missing for Stripe session ${checkoutSession.id}`)
  }

  const order = await req.payload.findByID({
    collection: 'print-orders',
    depth: 1,
    id: Number(linkedOrderId),
    overrideAccess: INTERNAL_ACCESS,
    req,
  })

  const rawPayload =
    payment.rawWebhookPayload && typeof payment.rawWebhookPayload === 'object' && !Array.isArray(payment.rawWebhookPayload)
      ? payment.rawWebhookPayload
      : {}

  await req.payload.update({
    collection: 'shopify-payments',
    id: payment.id,
    data: {
      rawWebhookPayload: {
        ...rawPayload,
        checkoutSessionCompletedAt: new Date().toISOString(),
        paymentIntentId:
          typeof checkoutSession.payment_intent === 'string'
            ? checkoutSession.payment_intent
            : checkoutSession.payment_intent?.id,
        provider: 'stripe',
        sessionId: checkoutSession.id,
        sessionStatus: checkoutSession.status,
        stage: checkoutSession.payment_status === 'paid' ? 'paid' : 'pending',
      },
      status: checkoutSession.payment_status === 'paid' ? 'paid' : payment.status,
    },
    overrideAccess: INTERNAL_ACCESS,
    req,
  })

  if (String(order.status) !== 'pending-payment') {
    return order
  }

  if (checkoutSession.payment_status !== 'paid' && checkoutSession.status !== 'complete') {
    return order
  }

  const paidOrder = await req.payload.update({
    collection: 'print-orders',
    id: order.id,
    data: {
      internalNotes: 'Stripe payment confirmed. Order is now marked as paid.',
      status: 'paid',
    },
    overrideAccess: INTERNAL_ACCESS,
    req,
  })

  const email = getUserEmail(req)
  if (email) {
    await sendOrderPaidEmail({
      amount: Number(paidOrder.amount || 0),
      currency: paidOrder.currency,
      email,
      modelTitle: typeof order.model === 'object' && order.model && 'title' in order.model ? String(order.model.title || '') : undefined,
      orderId: paidOrder.id,
      orderNumber: paidOrder.orderNumber,
      req,
    }).catch((error) => {
      req.payload.logger.error({
        err: error,
        msg: `Failed to send order paid email to ${email}`,
      })
    })
  }

  return paidOrder
}

export async function createPrintOrder(args: {
  materialOption?: string
  modelId: number
  req: PayloadRequest
  shippingAddress?: string
  shippingName?: string
  shippingPhone?: string
  sizeOption?: string
  sourceTaskId?: number
}) {
  const {
    materialOption = 'plastic',
    modelId,
    req,
    shippingAddress = 'Test address pending confirmation',
    shippingName = 'Test recipient',
    shippingPhone = '13800000000',
    sizeOption = 'standard',
    sourceTaskId,
  } = args

  if (!req.user) {
    throw new Error('Unauthorized')
  }

  const providers = await getPaymentProviderSettings(req)
  if (providers.orderProvider !== 'stripe') {
    throw new Error('Order payments are currently set to Shopify reserved mode, so Stripe print-order checkout is disabled.')
  }

  const model = await req.payload.findByID({
    collection: 'models',
    depth: 0,
    id: modelId,
    overrideAccess: false,
    req,
  })

  const amount = (ORDER_PRICE_MAP[sizeOption] ?? 39.9) + (MATERIAL_PRICE_MAP[materialOption] ?? 0)
  const orderNumber = randomCode('PO')

  const order = await req.payload.create({
    collection: 'print-orders',
    data: {
      amount,
      creditsUsed: 0,
      currency: 'USD',
      internalNotes: 'Order created, waiting for Stripe checkout.',
      materialOption,
      model: modelId,
      orderNumber,
      shippingAddress,
      shippingName,
      shippingPhone,
      sizeOption,
      sourceTask: sourceTaskId,
      status: 'pending-payment',
      user: req.user.id,
    },
    overrideAccess: false,
    req,
  })

  const gateway = getStripeGateway()
  const checkout = await gateway.createCheckout({
    amount,
    cancelUrl: buildOrderUrl(req, order.id, { checkout: 'cancelled' }),
    currency: 'USD',
    customerEmail: getUserEmail(req),
    modelTitle: typeof model.title === 'string' ? model.title : undefined,
    orderId: order.id,
    orderNumber,
    successUrl: buildOrderUrl(req, order.id, {
      checkout: 'success',
      session_id: '{CHECKOUT_SESSION_ID}',
    }),
  })

  const updatedOrder = await req.payload.update({
    collection: 'print-orders',
    id: order.id,
    data: {
      internalNotes: 'Stripe checkout created. Waiting for customer payment.',
      shopifyCheckoutUrl: checkout.checkoutUrl,
    },
    overrideAccess: false,
    req,
  })

  await req.payload.create({
    collection: 'shopify-payments',
    data: {
      amount,
      checkoutReference: checkout.checkoutReference,
      currency: 'USD',
      linkedOrder: updatedOrder.id,
      paymentType: 'print-order',
      rawWebhookPayload: {
        mode: checkout.mode,
        provider: 'stripe',
        sessionId: checkout.sessionId,
        stage: 'created',
      },
      shopifyCheckoutId: checkout.sessionId,
      status: 'pending',
      user: req.user.id,
    },
    overrideAccess: INTERNAL_ACCESS,
    req,
  })

  return updatedOrder
}

export async function finalizePrintOrderCheckoutSession(args: {
  req: PayloadRequest
  session?: Stripe.Checkout.Session
  sessionId: string
}) {
  const { req, session, sessionId } = args
  const gateway = getStripeGateway()
  const checkoutSession = session ?? (await gateway.retrieveCheckout(sessionId))

  return finalizePrintOrderPayment({
    checkoutSession,
    req,
  })
}

export async function syncPrintOrder(args: { orderId: number; req: PayloadRequest }) {
  const { orderId, req } = args

  const order = await req.payload.findByID({
    collection: 'print-orders',
    id: orderId,
    overrideAccess: false,
    req,
  })

  if (!req.user) {
    throw new Error('Unauthorized')
  }

  const providers = await getPaymentProviderSettings(req)
  if (providers.orderProvider !== 'stripe') {
    throw new Error('Order payments are not using Stripe right now, so Stripe order sync is unavailable.')
  }

  if (['completed', 'cancelled'].includes(String(order.status))) {
    return order
  }

  if (order.status !== 'pending-payment') {
    return order
  }

  const payments = await req.payload.find({
    collection: 'shopify-payments',
    limit: 1,
    overrideAccess: false,
    pagination: false,
    req,
    where: {
      linkedOrder: {
        equals: order.id,
      },
    },
  })

  const payment = payments.docs[0]

  if (!payment) {
    return req.payload.update({
      collection: 'print-orders',
      id: order.id,
      data: {
        internalNotes: 'Payment record missing. Please recreate the order or contact support.',
      },
      overrideAccess: false,
      req,
    })
  }

  const provider = getProviderFromPayload(payment.rawWebhookPayload)

  if (!payment.shopifyCheckoutId || provider !== 'stripe') {
    return req.payload.update({
      collection: 'print-orders',
      id: order.id,
      data: {
        internalNotes: 'Payment record is not linked to a Stripe checkout session.',
      },
      overrideAccess: false,
      req,
    })
  }

  return finalizePrintOrderCheckoutSession({
    req,
    sessionId: String(payment.shopifyCheckoutId),
  })
}
