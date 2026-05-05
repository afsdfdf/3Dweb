import type { PayloadRequest } from 'payload'
import type Stripe from 'stripe'

import type { CreditProduct, ShopifyPayment } from '@/payload-types'
import { writeAuditLog } from '@/lib/auditLog'
import { purchaseCredits } from '@/lib/creditLedger'
import { getCanonicalAppURL } from '@/lib/getCanonicalAppURL'
import { getPaymentProviderSettings } from '@/lib/paymentProviders'
import { PAYMENT_LEGACY_FIELD_NAMES, setPaymentLegacyFields } from '@/lib/paymentRecords'
import { ensureStripeCustomer } from '@/lib/stripeBilling'
import { getStripeClient } from '@/lib/stripeGateway'

const INTERNAL_ACCESS = true

type CreditTopupFlowTestHooks = {
  createStripeCheckoutSession?: typeof createStripeCheckoutSession
  purchaseCredits?: typeof purchaseCredits
  retrieveStripeCheckoutSession?: typeof retrieveStripeCheckoutSession
}

let creditTopupFlowTestHooks: CreditTopupFlowTestHooks | null = null

export function __setCreditTopupFlowTestHooks(hooks: CreditTopupFlowTestHooks | null) {
  creditTopupFlowTestHooks = hooks
}

const createPaymentReference = () => {
  return `TOPUP-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
}

const normalizeCurrency = (value: unknown) => {
  const currency = typeof value === 'string' && value.trim() ? value.trim().toLowerCase() : 'usd'
  return currency.length === 3 ? currency : 'usd'
}

const normalizePrice = (value: unknown) => {
  const price = Number(value || 0)
  return Number.isFinite(price) ? price : 0
}

const getRelationId = (value: unknown) => {
  if (typeof value === 'number' || typeof value === 'string') return Number(value)
  if (value && typeof value === 'object' && 'id' in value) return Number(value.id)
  return 0
}

async function resolveCreditProduct(args: { productId?: number | string; productSlug?: string; req: PayloadRequest }) {
  const { productId, productSlug, req } = args

  if (productId) {
    const product = (await req.payload.findByID({
      collection: 'credit-products',
      depth: 0,
      id: Number(productId),
      overrideAccess: INTERNAL_ACCESS,
      req,
    })) as CreditProduct

    return product
  }

  const slug = String(productSlug || '').trim()
  if (!slug) {
    throw new Error('Credit product is required.')
  }

  const result = await req.payload.find({
    collection: 'credit-products',
    depth: 0,
    limit: 1,
    overrideAccess: INTERNAL_ACCESS,
    pagination: false,
    req,
    where: {
      slug: {
        equals: slug,
      },
    },
  })

  const product = result.docs[0] as CreditProduct | undefined
  if (!product) {
    throw new Error('Credit product not found.')
  }

  return product
}

function assertPurchasableCreditProduct(product: CreditProduct) {
  if (product.productType !== 'credit-topup') {
    throw new Error('This product is not a credit top-up package.')
  }

  if (product.isActive === false) {
    throw new Error('This credit package is not active.')
  }

  if (Number(product.credits || 0) <= 0) {
    throw new Error('This credit package has no credits configured.')
  }

  if (normalizePrice(product.price) <= 0) {
    throw new Error('This credit package has no price configured.')
  }
}

async function createStripeCheckoutSession(args: {
  checkoutReference: string
  customerId: string
  product: CreditProduct
  req: PayloadRequest
}) {
  const { checkoutReference, customerId, product, req } = args
  const stripe = getStripeClient()
  const origin = getCanonicalAppURL()
  const currency = normalizeCurrency(product.currency)
  const credits = Number(product.credits || 0)

  return stripe.checkout.sessions.create({
    allow_promotion_codes: true,
    cancel_url: `${origin}/pricing?credits_checkout=cancelled`,
    client_reference_id: String(req.user?.id || ''),
    customer: customerId,
    line_items: [
      {
        price_data: {
          currency,
          product_data: {
            description: product.description || `${credits} Thorns Tavern credits`,
            metadata: {
              credits: String(credits),
              productId: String(product.id),
              productSlug: product.slug,
            },
            name: product.title,
          },
          unit_amount: Math.round(normalizePrice(product.price) * 100),
        },
        quantity: 1,
      },
    ],
    metadata: {
      checkoutReference,
      credits: String(credits),
      paymentType: 'credit-topup',
      productId: String(product.id),
      productSlug: product.slug,
      userId: String(req.user?.id || ''),
    },
    mode: 'payment',
    success_url: `${origin}/pricing?credits_checkout=success&session_id={CHECKOUT_SESSION_ID}`,
  })
}

async function retrieveStripeCheckoutSession(sessionId: string) {
  const stripe = getStripeClient()
  return stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['line_items.data.price.product'],
  })
}

async function findPaymentBySession(args: { req: PayloadRequest; sessionId: string }) {
  const { req, sessionId } = args
  const payments = await req.payload.find({
    collection: 'shopify-payments',
    depth: 0,
    limit: 1,
    overrideAccess: INTERNAL_ACCESS,
    pagination: false,
    req,
    where: {
      [PAYMENT_LEGACY_FIELD_NAMES.sessionId]: {
        equals: sessionId,
      },
    },
  })

  return (payments.docs[0] as ShopifyPayment | undefined) || null
}

export async function createCreditTopupCheckout(args: {
  productId?: number | string
  productSlug?: string
  req: PayloadRequest
}) {
  const { productId, productSlug, req } = args

  if (!req.user) {
    throw new Error('Unauthorized')
  }

  const providers = await getPaymentProviderSettings(req)
  if (providers.orderProvider !== 'stripe') {
    throw new Error('One-time credit purchases are currently available only when Stripe one-time payments are enabled.')
  }

  const product = await resolveCreditProduct({ productId, productSlug, req })
  assertPurchasableCreditProduct(product)

  const checkoutReference = createPaymentReference()
  const customerId = await ensureStripeCustomer(req)
  const session = await (creditTopupFlowTestHooks?.createStripeCheckoutSession || createStripeCheckoutSession)({
    checkoutReference,
    customerId,
    product,
    req,
  })

  if (!session.url) {
    throw new Error('Stripe did not return a usable checkout URL.')
  }

  await req.payload.create({
    collection: 'shopify-payments',
    data: {
      amount: normalizePrice(product.price),
      checkoutReference,
      creditsGranted: Number(product.credits || 0),
      currency: String(product.currency || 'USD').toUpperCase(),
      paymentType: 'credit-topup',
      rawWebhookPayload: {
        credits: Number(product.credits || 0),
        mode: 'stripe',
        productId: product.id,
        productSlug: product.slug,
        provider: 'stripe',
        sessionId: session.id,
        stage: 'created',
      },
      status: 'pending',
      user: req.user.id,
      ...setPaymentLegacyFields({
        sessionId: session.id,
      }),
    },
    overrideAccess: INTERNAL_ACCESS,
    req,
  })

  return {
    checkoutReference,
    checkoutUrl: session.url,
    product,
    sessionId: session.id,
  }
}

export async function finalizeCreditTopupCheckoutSession(args: {
  expectedUserId?: number | string
  req: PayloadRequest
  session?: Stripe.Checkout.Session
  sessionId: string
}) {
  const { expectedUserId, req, session, sessionId } = args
  const checkoutSession =
    session ?? (await (creditTopupFlowTestHooks?.retrieveStripeCheckoutSession || retrieveStripeCheckoutSession)(sessionId))

  if (checkoutSession.mode !== 'payment' || checkoutSession.metadata?.paymentType !== 'credit-topup') {
    throw new Error('The checkout session is not a credit top-up session.')
  }

  const payment = await findPaymentBySession({ req, sessionId: checkoutSession.id })
  if (!payment) {
    throw new Error(`Payment record not found for Stripe session ${checkoutSession.id}`)
  }

  const paymentUserId = getRelationId(payment.user)
  const checkoutUserId = Number(checkoutSession.metadata?.userId || checkoutSession.client_reference_id || paymentUserId)

  if (expectedUserId !== undefined && String(checkoutUserId || paymentUserId) !== String(expectedUserId)) {
    throw new Error('The checkout session does not belong to the current user.')
  }

  const existingPayload =
    payment.rawWebhookPayload && typeof payment.rawWebhookPayload === 'object' && !Array.isArray(payment.rawWebhookPayload)
      ? payment.rawWebhookPayload
      : {}

  const paid = checkoutSession.payment_status === 'paid'
  await req.payload.update({
    collection: 'shopify-payments',
    id: payment.id,
    data: {
      rawWebhookPayload: {
        ...existingPayload,
        checkoutSessionCompletedAt: new Date().toISOString(),
        paymentIntentId:
          typeof checkoutSession.payment_intent === 'string'
            ? checkoutSession.payment_intent
            : checkoutSession.payment_intent?.id,
        provider: 'stripe',
        sessionId: checkoutSession.id,
        sessionStatus: checkoutSession.status,
        stage: paid ? 'paid' : 'pending',
      },
      status: paid ? 'paid' : payment.status,
    },
    overrideAccess: INTERNAL_ACCESS,
    req,
  })

  if (!paid) {
    return {
      applied: false,
      paymentId: payment.id,
      status: checkoutSession.payment_status || checkoutSession.status,
    }
  }

  const credits = Number(payment.creditsGranted || checkoutSession.metadata?.credits || 0)
  const grantResult = await (creditTopupFlowTestHooks?.purchaseCredits || purchaseCredits)({
    amount: credits,
    idempotencyKey: `credit-topup:${checkoutSession.id}`,
    metadata: {
      checkoutReference: payment.checkoutReference,
      paymentId: payment.id,
      productId: checkoutSession.metadata?.productId || null,
      productSlug: checkoutSession.metadata?.productSlug || null,
      source: 'stripe-credit-topup',
      stripeSessionId: checkoutSession.id,
    },
    notes: `Credit top-up purchase confirmed (${payment.checkoutReference}).`,
    req,
    userId: paymentUserId || checkoutUserId,
  })

  writeAuditLog({
    details: {
      applied: grantResult.applied,
      checkoutReference: payment.checkoutReference,
      credits,
      paymentId: payment.id,
    },
    eventType: 'credits.purchase',
    provider: 'stripe',
    req,
    sessionId: checkoutSession.id,
    status: grantResult.applied ? 'completed' : 'idempotent',
    userId: paymentUserId || checkoutUserId,
  })

  return {
    account: grantResult.account,
    applied: grantResult.applied,
    credits,
    paymentId: payment.id,
    status: 'paid',
  }
}

export async function syncCreditTopupCheckout(args: { req: PayloadRequest; sessionId: string }) {
  const { req, sessionId } = args

  if (!req.user) {
    throw new Error('Unauthorized')
  }

  return finalizeCreditTopupCheckoutSession({
    expectedUserId: req.user.id,
    req,
    sessionId,
  })
}
