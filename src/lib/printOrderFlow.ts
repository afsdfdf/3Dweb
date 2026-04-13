import type { PayloadRequest } from 'payload'

import { getStripeGateway } from '@/lib/stripeGateway'

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
    shippingAddress = '??????',
    shippingName = '?????',
    shippingPhone = '13800000000',
    sizeOption = 'standard',
    sourceTaskId,
  } = args

  if (!req.user) {
    throw new Error('Unauthorized')
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
      internalNotes: '??????????? Stripe Checkout?',
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
      internalNotes: '??? Stripe Checkout ??????????',
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
    overrideAccess: false,
    req,
  })

  return updatedOrder
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

  if (['completed', 'cancelled'].includes(String(order.status))) {
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

  if (order.status === 'pending-payment') {
    const provider = getProviderFromPayload(payment?.rawWebhookPayload)

    if (payment?.shopifyCheckoutId && provider === 'stripe') {
      const gateway = getStripeGateway()
      const session = await gateway.retrieveCheckout(String(payment.shopifyCheckoutId))
      const isPaid = session.payment_status === 'paid' || session.status === 'complete'

      if (!isPaid) {
        return req.payload.update({
          collection: 'print-orders',
          id: order.id,
          data: {
            internalNotes: 'Stripe ????????????????????',
            shopifyCheckoutUrl: order.shopifyCheckoutUrl,
          },
          overrideAccess: false,
          req,
        })
      }

      await req.payload.update({
        collection: 'shopify-payments',
        id: payment.id,
        data: {
          rawWebhookPayload: {
            ...(payment.rawWebhookPayload && typeof payment.rawWebhookPayload === 'object' && !Array.isArray(payment.rawWebhookPayload)
              ? payment.rawWebhookPayload
              : {}),
            paidAt: new Date().toISOString(),
            paymentIntentId:
              typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id,
            provider: 'stripe',
            sessionId: session.id,
            sessionStatus: session.status,
            stage: 'paid',
          },
          status: 'paid',
        },
        overrideAccess: false,
        req,
      })

      return req.payload.update({
        collection: 'print-orders',
        id: order.id,
        data: {
          internalNotes: 'Stripe ???????????????',
          status: 'paid',
        },
        overrideAccess: false,
        req,
      })
    }

    if (payment) {
      await req.payload.update({
        collection: 'shopify-payments',
        id: payment.id,
        data: {
          rawWebhookPayload: { mock: true, stage: 'paid' },
          shopifyOrderId: randomCode('SHOPIFY-ORDER'),
          status: 'paid',
        },
        overrideAccess: false,
        req,
      })
    }

    return req.payload.update({
      collection: 'print-orders',
      id: order.id,
      data: {
        internalNotes: '?????????????',
        status: 'paid',
      },
      overrideAccess: false,
      req,
    })
  }

  if (order.status === 'paid') {
    return req.payload.update({
      collection: 'print-orders',
      id: order.id,
      data: {
        internalNotes: '????????',
        status: 'in-production',
      },
      overrideAccess: false,
      req,
    })
  }

  if (order.status === 'in-production') {
    return req.payload.update({
      collection: 'print-orders',
      id: order.id,
      data: {
        internalNotes: '??????',
        status: 'shipped',
        trackingNumber: randomCode('TRACK'),
      },
      overrideAccess: false,
      req,
    })
  }

  return req.payload.update({
    collection: 'print-orders',
    id: order.id,
    data: {
      internalNotes: '??????',
      status: 'completed',
    },
    overrideAccess: false,
    req,
  })
}
