import type { PayloadRequest } from 'payload'

import type { BillingSubscription } from '@/payload-types'
import { writeAuditLog } from '@/lib/auditLog'
import { sendSubscriptionSuccessEmail } from '@/lib/businessEmails'
import { grantCredits } from '@/lib/creditLedger'
import { getPaymentProviderSettings } from '@/lib/paymentProviders'
import {
  createBillingPortalSession,
  createSubscriptionCheckout as createStripeSubscriptionCheckout,
  retrieveBillingCheckoutSession,
  retrieveStripeSubscription,
} from '@/lib/stripeBilling'
import { getSubscriptionPlan, type SubscriptionPlanKey } from '@/lib/subscriptionPlans'

type SubscriptionFlowTestHooks = {
  getSubscriptionPlan?: typeof getSubscriptionPlan
  grantCredits?: typeof grantCredits
  retrieveBillingCheckoutSession?: typeof retrieveBillingCheckoutSession
  retrieveStripeSubscription?: typeof retrieveStripeSubscription
  sendSubscriptionSuccessEmail?: typeof sendSubscriptionSuccessEmail
}

let subscriptionFlowTestHooks: SubscriptionFlowTestHooks | null = null

export function __setSubscriptionFlowTestHooks(hooks: SubscriptionFlowTestHooks | null) {
  subscriptionFlowTestHooks = hooks
}

const ACTIVE_SUBSCRIPTION_STATUSES = ['active', 'trialing', 'past_due', 'incomplete']
const INTERNAL_ACCESS = true

type ResolvedUser = {
  email?: string
  id: number
  stripeCustomerId?: string
}

const toPlainJson = <T,>(value: T): Record<string, unknown> => {
  return JSON.parse(JSON.stringify(value)) as Record<string, unknown>
}

const getPlanKeyFromSubscription = (subscription: Awaited<ReturnType<typeof retrieveStripeSubscription>>) => {
  const direct = subscription.metadata?.planKey
  if (typeof direct === 'string' && direct.length > 0) {
    return direct
  }

  const line = subscription.items.data[0]
  const lookupKey = line?.price.lookup_key
  if (typeof lookupKey === 'string' && lookupKey.length > 0) {
    if (lookupKey.includes('starter')) return 'starter'
    if (lookupKey.includes('pro')) return 'pro'
    if (lookupKey.includes('studio')) return 'studio'
  }

  const product = line?.price.product
  const metadataPlanKey =
    product && typeof product !== 'string' && !('deleted' in product && product.deleted) ? product.metadata?.planKey : undefined
  if (typeof metadataPlanKey === 'string' && metadataPlanKey.length > 0) {
    return metadataPlanKey
  }

  return null
}

const mapStripeSubscriptionStatus = (status: string): BillingSubscription['status'] => {
  switch (status) {
    case 'active':
    case 'trialing':
    case 'past_due':
    case 'unpaid':
    case 'canceled':
    case 'incomplete':
    case 'incomplete_expired':
      return status
    case 'paused':
      return 'past_due'
    default:
      return 'incomplete'
  }
}

async function resolveUserById(args: { req: PayloadRequest; userId: number | string }) {
  const user = await args.req.payload.findByID({
    collection: 'users',
    depth: 0,
    id: Number(args.userId),
    overrideAccess: INTERNAL_ACCESS,
    req: args.req,
  })

  return {
    email: typeof user.email === 'string' ? user.email : undefined,
    id: Number(user.id),
    stripeCustomerId: typeof user.stripeCustomerId === 'string' ? user.stripeCustomerId : undefined,
  } satisfies ResolvedUser
}

async function resolveUserByStripeCustomerId(args: { customerId: string; req: PayloadRequest }) {
  const result = await args.req.payload.find({
    collection: 'users',
    depth: 0,
    limit: 1,
    overrideAccess: INTERNAL_ACCESS,
    pagination: false,
    req: args.req,
    where: {
      stripeCustomerId: {
        equals: args.customerId,
      },
    },
  })

  const user = result.docs[0]
  if (!user) return null

  return {
    email: typeof user.email === 'string' ? user.email : undefined,
    id: Number(user.id),
    stripeCustomerId: typeof user.stripeCustomerId === 'string' ? user.stripeCustomerId : undefined,
  } satisfies ResolvedUser
}

async function resolveUserForSubscription(args: {
  customerId: string
  req: PayloadRequest
  userIdHint?: number | string
}) {
  const { customerId, req, userIdHint } = args

  if (userIdHint !== undefined && userIdHint !== null && String(userIdHint) !== '') {
    return resolveUserById({ req, userId: userIdHint })
  }

  const byCustomer = await resolveUserByStripeCustomerId({ customerId, req })
  if (byCustomer) {
    return byCustomer
  }

  throw new Error(`Unable to resolve user for Stripe customer ${customerId}`)
}

async function upsertBillingSubscription(args: {
  customerId: string
  lastCheckoutSessionId: string
  monthlyCredits: number
  planKey: string
  req: PayloadRequest
  stripePriceId: string
  stripeSubscription: Awaited<ReturnType<typeof retrieveStripeSubscription>>
  userId: number
}): Promise<BillingSubscription> {
  const { customerId, lastCheckoutSessionId, monthlyCredits, planKey, req, stripePriceId, stripeSubscription, userId } = args

  const existing = await req.payload.find({
    collection: 'billing-subscriptions',
    depth: 0,
    limit: 1,
    overrideAccess: INTERNAL_ACCESS,
    pagination: false,
    req,
    where: {
      stripeSubscriptionId: {
        equals: stripeSubscription.id,
      },
    },
  })

  const baseData = {
    cancelAtPeriodEnd: Boolean(stripeSubscription.cancel_at_period_end),
    currentPeriodEnd: stripeSubscription.items.data[0]?.current_period_end
      ? new Date(stripeSubscription.items.data[0].current_period_end * 1000).toISOString()
      : null,
    currentPeriodStart: stripeSubscription.items.data[0]?.current_period_start
      ? new Date(stripeSubscription.items.data[0].current_period_start * 1000).toISOString()
      : null,
    interval: stripeSubscription.items.data[0]?.price.recurring?.interval || 'month',
    lastCheckoutSessionId,
    metadata: toPlainJson(stripeSubscription),
    monthlyCredits,
    planKey,
    status: mapStripeSubscriptionStatus(stripeSubscription.status),
    stripeCustomerId: customerId,
    stripePriceId,
    stripeSubscriptionId: stripeSubscription.id,
    user: userId,
  }

  if (existing.docs[0]) {
    return (await req.payload.update({
      collection: 'billing-subscriptions',
      id: existing.docs[0].id,
      data: baseData,
      overrideAccess: INTERNAL_ACCESS,
      req,
    })) as BillingSubscription
  }

  return (await req.payload.create({
    collection: 'billing-subscriptions',
    data: {
      ...baseData,
      lastGrantedPeriodKey: '',
    },
    overrideAccess: INTERNAL_ACCESS,
    req,
  })) as BillingSubscription
}

async function grantSubscriptionCreditsIfNeeded(args: {
  billingSubscription: BillingSubscription
  planCredits: number
  planKey: string
  planLabel: string
  req: PayloadRequest
  stripeSubscription: Awaited<ReturnType<typeof retrieveStripeSubscription>>
  user: ResolvedUser
}) {
  const { billingSubscription, planCredits, planKey, planLabel, req, stripeSubscription, user } = args
  const currentPeriodEnd = stripeSubscription.items.data[0]?.current_period_end
  const periodKey = currentPeriodEnd ? `${stripeSubscription.id}:${currentPeriodEnd}` : ''

  if (!periodKey || !ACTIVE_SUBSCRIPTION_STATUSES.includes(stripeSubscription.status)) {
    return billingSubscription
  }

  if (billingSubscription.lastGrantedPeriodKey === periodKey) {
    return billingSubscription
  }

  const grantResult = await (subscriptionFlowTestHooks?.grantCredits || grantCredits)({
    amount: planCredits,
    idempotencyKey: `subscription-grant:${stripeSubscription.id}:${periodKey}`,
    metadata: {
      planKey,
      source: 'stripe-subscription',
      stripeSubscriptionId: stripeSubscription.id,
    },
    notes: `${planLabel} monthly credits granted`,
    referencePrefix: 'SUB',
    req,
    userId: user.id,
  })

  writeAuditLog({
    details: {
      periodKey,
      planCredits,
      planKey,
    },
    eventType: 'subscription.credits_grant',
    provider: 'stripe',
    req,
    status: grantResult.applied ? 'completed' : 'idempotent',
    subscriptionId: stripeSubscription.id,
    userId: user.id,
  })

  const updated = (await req.payload.update({
    collection: 'billing-subscriptions',
    id: billingSubscription.id,
    data: {
      lastGrantedPeriodKey: periodKey,
    },
    overrideAccess: INTERNAL_ACCESS,
    req,
  })) as BillingSubscription

  if (user.email) {
    await (subscriptionFlowTestHooks?.sendSubscriptionSuccessEmail || sendSubscriptionSuccessEmail)({
      currentPeriodEnd: updated.currentPeriodEnd,
      email: user.email,
      monthlyCredits: planCredits,
      planLabel,
      req,
    }).catch((error) => {
      req.payload.logger.error({
        err: error,
        msg: `Failed to send subscription success email to ${user.email}`,
      })
    })
  }

  return updated
}

export async function createSubscriptionCheckout(args: { planKey: SubscriptionPlanKey; req: PayloadRequest }) {
  const { planKey, req } = args

  if (!req.user) {
    throw new Error('Unauthorized')
  }

  const providers = await getPaymentProviderSettings(req)
  if (providers.subscriptionProvider !== 'stripe') {
    throw new Error('The current site configuration uses Shopify reserved mode for subscriptions, so online subscription checkout is disabled.')
  }

  const existing = await req.payload.find({
    collection: 'billing-subscriptions',
    depth: 0,
    limit: 1,
    overrideAccess: false,
    pagination: false,
    req,
    where: {
      and: [
        {
          user: {
            equals: req.user.id,
          },
        },
        {
          status: {
            in: ACTIVE_SUBSCRIPTION_STATUSES,
          },
        },
      ],
    },
  })

  if (existing.docs[0]) {
    throw new Error('You already have an active subscription flow in progress.')
  }

  return createStripeSubscriptionCheckout({ planKey, req })
}

export async function finalizeSubscriptionCheckoutSession(args: {
  expectedUserId?: number | string
  req: PayloadRequest
  sessionId: string
}) {
  const { expectedUserId, req, sessionId } = args
  const session = await (subscriptionFlowTestHooks?.retrieveBillingCheckoutSession || retrieveBillingCheckoutSession)(sessionId)
  if (session.mode !== 'subscription') {
    throw new Error('The checkout session is not a subscription session.')
  }

  const checkoutUserId = session.metadata?.userId || session.client_reference_id
  if (expectedUserId !== undefined && String(checkoutUserId || '') !== String(expectedUserId)) {
    throw new Error('The checkout session does not belong to the current user.')
  }

  const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id
  const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id

  if (!subscriptionId || !customerId) {
    throw new Error('Stripe did not return subscription metadata.')
  }

  return syncStripeSubscriptionState({
    customerId,
    lastCheckoutSessionId: session.id,
    req,
    subscriptionId,
    userIdHint: checkoutUserId ? Number(checkoutUserId) : undefined,
  })
}

export async function syncStripeSubscriptionState(args: {
  customerId?: string
  lastCheckoutSessionId?: string
  req: PayloadRequest
  subscriptionId: string
  userIdHint?: number | string
}) {
  const { customerId, lastCheckoutSessionId = '', req, subscriptionId, userIdHint } = args

  const stripeSubscription = await (subscriptionFlowTestHooks?.retrieveStripeSubscription || retrieveStripeSubscription)(subscriptionId)
  const resolvedCustomerId =
    customerId ||
    (typeof stripeSubscription.customer === 'string' ? stripeSubscription.customer : stripeSubscription.customer?.id) ||
    ''

  if (!resolvedCustomerId) {
    throw new Error(`Missing Stripe customer for subscription ${subscriptionId}`)
  }

  const planKey = getPlanKeyFromSubscription(stripeSubscription)
  const plan = await (subscriptionFlowTestHooks?.getSubscriptionPlan || getSubscriptionPlan)(String(planKey), req)
  const priceId = stripeSubscription.items.data[0]?.price.id

  if (!plan || !priceId) {
    throw new Error('Unable to resolve the Stripe subscription plan.')
  }

  const user = await resolveUserForSubscription({
    customerId: resolvedCustomerId,
    req,
    userIdHint,
  })

  if (user.stripeCustomerId !== resolvedCustomerId) {
    await req.payload.update({
      collection: 'users',
      id: user.id,
      data: {
        stripeCustomerId: resolvedCustomerId,
      },
      overrideAccess: INTERNAL_ACCESS,
      req,
    })
  }

  let billingSubscription = await upsertBillingSubscription({
    customerId: resolvedCustomerId,
    lastCheckoutSessionId,
    monthlyCredits: plan.creditsPerMonth,
    planKey: plan.key,
    req,
    stripePriceId: priceId,
    stripeSubscription,
    userId: user.id,
  })

  billingSubscription = await grantSubscriptionCreditsIfNeeded({
    billingSubscription,
    planCredits: plan.creditsPerMonth,
    planKey: plan.key,
    planLabel: plan.name,
    req,
    stripeSubscription,
    user,
  })

  return {
    billingSubscription,
    checkoutSessionId: lastCheckoutSessionId,
    subscriptionStatus: stripeSubscription.status,
  }
}

export async function syncSubscriptionCheckout(args: { req: PayloadRequest; sessionId: string }) {
  const { req, sessionId } = args

  if (!req.user) {
    throw new Error('Unauthorized')
  }

  return finalizeSubscriptionCheckoutSession({
    expectedUserId: req.user.id,
    req,
    sessionId,
  })
}

export async function createSubscriptionPortal(args: { req: PayloadRequest }) {
  const { req } = args

  if (!req.user) {
    throw new Error('Unauthorized')
  }

  const providers = await getPaymentProviderSettings(req)
  if (providers.subscriptionProvider !== 'stripe') {
    throw new Error('The current site configuration does not enable the Stripe subscription management portal.')
  }

  const userCustomerId =
    req.user && typeof req.user === 'object' && 'stripeCustomerId' in req.user && typeof req.user.stripeCustomerId === 'string'
      ? req.user.stripeCustomerId
      : ''

  let customerId = userCustomerId

  if (!customerId) {
    const existing = await req.payload.find({
      collection: 'billing-subscriptions',
      depth: 0,
      limit: 1,
      overrideAccess: false,
      pagination: false,
      req,
      where: {
        user: {
          equals: req.user.id,
        },
      },
    })

    customerId = String(existing.docs[0]?.stripeCustomerId || '')
  }

  if (!customerId) {
    throw new Error('No Stripe subscription is available for this account yet.')
  }

  return createBillingPortalSession({
    customerId,
    req,
  })
}
