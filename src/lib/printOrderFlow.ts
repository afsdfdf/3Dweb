import type { PayloadRequest } from 'payload'
import type Stripe from 'stripe'

import { writeAuditLog } from '@/lib/auditLog'
import { sendOrderPaidEmail } from '@/lib/businessEmails'
import { getCanonicalAppURL } from '@/lib/getCanonicalAppURL'
import { createUserNotification } from '@/lib/notificationService'
import {
  getPaymentProviderKey,
  getPaymentSessionId,
  PAYMENT_LEGACY_FIELD_NAMES,
  setPaymentLegacyFields,
} from '@/lib/paymentRecords'
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

const requireNonEmptyString = (value: string | undefined, fieldLabel: string) => {
  if (!value || !value.trim()) {
    throw new Error(`${fieldLabel} is required.`)
  }

  return value.trim()
}

const assertModelCanBePrinted = (args: {
  currentUserId: number | string
  model: {
    owner?: number | string | { id?: number | string | null } | null
    printReady?: boolean | null
  }
}) => {
  const ownerId =
    typeof args.model.owner === 'object' && args.model.owner ? args.model.owner.id : args.model.owner

  if (String(ownerId || '') !== String(args.currentUserId)) {
    throw new Error('You can only print models that belong to your own account.')
  }

  if (!args.model.printReady) {
    throw new Error('This model is not marked as print-ready yet.')
  }
}

const buildOrderUrl = (orderId: number | string, query: Record<string, string> = {}) => {
  const url = new URL('/account', getCanonicalAppURL())
  url.searchParams.set('section', 'orders')

  Object.entries(query).forEach(([key, value]) => {
    url.searchParams.set(key, value)
  })

  return url.toString()
}

const getUserEmail = (req: PayloadRequest) => {
  const email = req.user && typeof req.user === 'object' && 'email' in req.user ? req.user.email : undefined
  return typeof email === 'string' ? email : undefined
}

const getRelationId = (value: unknown) => {
  if (typeof value === 'number' || typeof value === 'string') return Number(value)
  if (value && typeof value === 'object' && 'id' in value) return Number((value as { id?: unknown }).id)
  return 0
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
      [PAYMENT_LEGACY_FIELD_NAMES.sessionId]: {
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

  if (checkoutSession.payment_status !== 'paid') {
    return order
  }

  const paidOrder = await req.payload.update({
    collection: 'print-orders',
    id: order.id,
    data: {
      internalNotes: 'Stripe payment confirmed. Order is now marked as paid.',
      paymentStatus: 'paid',
      status: 'paid',
    },
    overrideAccess: INTERNAL_ACCESS,
    req,
  })

  writeAuditLog({
    details: {
      fromStatus: order.status,
      paymentStatus: checkoutSession.payment_status,
      toStatus: paidOrder.status,
    },
    eventType: 'print_order.status_change',
    orderId: paidOrder.id,
    provider: 'stripe',
    req,
    sessionId: checkoutSession.id,
    status: 'completed',
    userId: typeof req.user?.id === 'number' || typeof req.user?.id === 'string' ? req.user.id : undefined,
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

  const paidOrderUserId = getRelationId(paidOrder.user) || getRelationId(order.user)
  if (paidOrderUserId) {
    await createUserNotification({
      body: `${paidOrder.orderNumber || `Order ${paidOrder.id}`} has been paid and moved to the next processing stage.`,
      href: '/account?section=orders',
      metadata: {
        orderNumber: paidOrder.orderNumber || null,
        status: paidOrder.status,
      },
      req,
      severity: 'success',
      sourceKey: `print-order:${paidOrder.id}:paid`,
      sourceOrderId: paidOrder.id,
      title: 'Order payment received',
      type: 'order_paid',
      userId: paidOrderUserId,
    }).catch((error) => {
      req.payload.logger?.error?.({
        err: error,
        msg: `Failed to create notification for paid order ${paidOrder.id}.`,
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
    shippingAddress,
    shippingName,
    shippingPhone,
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

  assertModelCanBePrinted({
    currentUserId: req.user.id,
    model,
  })

  const normalizedShippingName = requireNonEmptyString(shippingName, 'Shipping name')
  const normalizedShippingPhone = requireNonEmptyString(shippingPhone, 'Shipping phone')
  const normalizedShippingAddress = requireNonEmptyString(shippingAddress, 'Shipping address')

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
      paymentStatus: 'pending',
      shippingAddress: normalizedShippingAddress,
      shippingName: normalizedShippingName,
      shippingPhone: normalizedShippingPhone,
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
    cancelUrl: buildOrderUrl(order.id, { checkout: 'cancelled' }),
    currency: 'USD',
    customerEmail: getUserEmail(req),
    modelTitle: typeof model.title === 'string' ? model.title : undefined,
    orderId: order.id,
    orderNumber,
    successUrl: buildOrderUrl(order.id, {
      checkout: 'success',
      session_id: '{CHECKOUT_SESSION_ID}',
    }),
  })

  const updatedOrder = await req.payload.update({
    collection: 'print-orders',
    id: order.id,
    data: {
      internalNotes: 'Stripe checkout created. Waiting for customer payment.',
      ...setPaymentLegacyFields({
        checkoutUrl: checkout.checkoutUrl,
      }),
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
      status: 'pending',
      user: req.user.id,
      ...setPaymentLegacyFields({
        sessionId: checkout.sessionId,
      }),
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

  const provider = getPaymentProviderKey(payment.rawWebhookPayload)
  const sessionId = getPaymentSessionId(payment)

  if (!sessionId || provider !== 'stripe') {
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
    sessionId,
  })
}
