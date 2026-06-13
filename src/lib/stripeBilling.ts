import type { PayloadRequest } from 'payload'
import type Stripe from 'stripe'

import { getCanonicalAppURL } from '@/lib/getCanonicalAppURL'
import { getPaymentProviderSettings } from '@/lib/paymentProviders'
import {
  getSubscriptionCreditsForBillingCycle,
  getSubscriptionPlan,
  getSubscriptionPlanPricing,
  normalizeSubscriptionBillingCycle,
  type SubscriptionBillingCycle,
  type SubscriptionPlanDefinition,
  type SubscriptionPlanKey,
} from '@/lib/subscriptionPlans'
import { getStripeClient } from '@/lib/stripeGateway'

const INTERNAL_ACCESS = true
const SUBSCRIPTION_CURRENCY = 'usd'

type StripeBillingTestHooks = {
  getStripeClient?: typeof getStripeClient
}

let stripeBillingTestHooks: StripeBillingTestHooks | null = null

export function __setStripeBillingTestHooks(hooks: StripeBillingTestHooks | null) {
  stripeBillingTestHooks = hooks
}

const getBillingStripeClient = () => {
  return stripeBillingTestHooks?.getStripeClient?.() ?? getStripeClient()
}

const getUserStringField = (req: PayloadRequest, key: 'email' | 'fullName' | 'phone' | 'stripeCustomerId') => {
  const value = req.user && typeof req.user === 'object' && key in req.user ? req.user[key] : undefined
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

async function ensurePortalConfiguration(stripe: Stripe) {
  const configurations = await stripe.billingPortal.configurations.list({
    active: true,
    limit: 1,
  })

  const current = configurations.data[0]
  if (current) {
    return current
  }

  return stripe.billingPortal.configurations.create({
    business_profile: {
      headline: 'Thorns Tavern Subscription Management',
    },
    features: {
      customer_update: {
        allowed_updates: ['email', 'name'],
        enabled: true,
      },
      invoice_history: {
        enabled: true,
      },
      payment_method_update: {
        enabled: true,
      },
      subscription_cancel: {
        enabled: true,
        mode: 'at_period_end',
        proration_behavior: 'none',
      },
    },
  })
}

export async function ensureStripeCustomer(req: PayloadRequest) {
  if (!req.user) {
    throw new Error('Unauthorized')
  }

  const stripe = getBillingStripeClient()
  const existingCustomerId = getUserStringField(req, 'stripeCustomerId')

  if (existingCustomerId) {
    return existingCustomerId
  }

  // Re-read the latest user record to catch a customer created by a concurrent
  // request (e.g. subscription checkout and credit top-up firing together)
  // before we issue another Stripe customer create.
  const freshUser = await req.payload.findByID({
    collection: 'users',
    depth: 0,
    id: req.user.id,
    overrideAccess: INTERNAL_ACCESS,
    req,
  })
  const freshCustomerId = typeof freshUser?.stripeCustomerId === 'string' ? freshUser.stripeCustomerId : ''
  if (freshCustomerId) {
    return freshCustomerId
  }

  const customer = await stripe.customers.create(
    {
      email: getUserStringField(req, 'email'),
      metadata: {
        source: 'thornstavern-app',
        userId: String(req.user.id),
      },
      name: getUserStringField(req, 'fullName'),
      phone: getUserStringField(req, 'phone'),
    },
    // Scope idempotency to the user so retries/concurrent calls reuse one customer.
    { idempotencyKey: `stripe-customer:user:${req.user.id}` },
  )

  await req.payload.update({
    collection: 'users',
    id: req.user.id,
    data: {
      stripeCustomerId: customer.id,
    },
    overrideAccess: INTERNAL_ACCESS,
    req,
  })

  return customer.id
}

const getPlanUnitAmount = (plan: SubscriptionPlanDefinition, billingCycle: SubscriptionBillingCycle) => {
  const pricing = getSubscriptionPlanPricing(plan, billingCycle)
  const unitAmount = Math.round(Number(pricing.price) * 100)
  if (!Number.isFinite(unitAmount) || unitAmount < 0) {
    throw new Error(`Invalid ${billingCycle} price for subscription plan ${plan.key}.`)
  }

  return unitAmount
}

const getPriceProductID = (price: Stripe.Price | null) => {
  const product = price?.product
  if (!product) return null
  if (typeof product === 'string') return product
  if ('deleted' in product && product.deleted) return null
  return product.id
}

const getStripePlanMetadata = (plan: SubscriptionPlanDefinition) => ({
  creditsPerMonth: String(plan.creditsPerMonth),
  planKey: plan.key,
})

const getStripePlanCycleMetadata = (plan: SubscriptionPlanDefinition, billingCycle: SubscriptionBillingCycle) => ({
  ...getStripePlanMetadata(plan),
  billingCycle,
  creditsPerPeriod: String(getSubscriptionCreditsForBillingCycle(plan, billingCycle)),
})

const stripePriceMatchesPlan = (
  price: Stripe.Price,
  plan: SubscriptionPlanDefinition,
  billingCycle: SubscriptionBillingCycle,
) => {
  const pricing = getSubscriptionPlanPricing(plan, billingCycle)

  return (
    price.active &&
    price.currency.toLowerCase() === SUBSCRIPTION_CURRENCY &&
    price.recurring?.interval === pricing.interval &&
    price.unit_amount === getPlanUnitAmount(plan, billingCycle)
  )
}

async function createStripePlanProduct(
  stripe: Stripe,
  plan: SubscriptionPlanDefinition,
  billingCycle: SubscriptionBillingCycle,
) {
  const pricing = getSubscriptionPlanPricing(plan, billingCycle)

  return stripe.products.create({
    description: plan.description,
    metadata: getStripePlanCycleMetadata(plan, billingCycle),
    name: `Thorns Tavern ${plan.name} ${pricing.intervalLabel}ly Subscription`,
  })
}

export async function ensureStripePlanPrice(
  plan: SubscriptionPlanDefinition,
  billingCycle: SubscriptionBillingCycle = 'monthly',
) {
  const stripe = getBillingStripeClient()
  const pricing = getSubscriptionPlanPricing(plan, billingCycle)
  const matched = await stripe.prices.list({
    limit: 1,
    lookup_keys: [pricing.lookupKey],
  })

  const current = matched.data[0] ?? null
  if (current && stripePriceMatchesPlan(current, plan, billingCycle)) {
    return current
  }

  const productId = getPriceProductID(current) ?? (await createStripePlanProduct(stripe, plan, billingCycle)).id
  const createParams: Stripe.PriceCreateParams = {
    currency: SUBSCRIPTION_CURRENCY,
    lookup_key: pricing.lookupKey,
    metadata: getStripePlanCycleMetadata(plan, billingCycle),
    nickname: `${plan.name} ${pricing.intervalLabel}ly`,
    product: productId,
    recurring: {
      interval: pricing.interval,
    },
    unit_amount: getPlanUnitAmount(plan, billingCycle),
  }

  if (current) {
    createParams.transfer_lookup_key = true
  }

  const replacement = await stripe.prices.create(createParams)

  if (current?.active && current.id !== replacement.id) {
    await stripe.prices.update(current.id, { active: false }).catch(() => null)
  }

  return replacement
}

export async function createSubscriptionCheckout(args: {
  billingCycle?: SubscriptionBillingCycle
  idempotencyKey?: string
  planKey: SubscriptionPlanKey
  req: PayloadRequest
}) {
  const { idempotencyKey, planKey, req } = args
  const billingCycle = normalizeSubscriptionBillingCycle(args.billingCycle)
  const providers = await getPaymentProviderSettings(req, { strict: true })

  if (providers.subscriptionProvider !== 'stripe') {
    throw new Error('The active subscription provider is set to Shopify reserved mode, so Stripe subscription checkout is currently disabled.')
  }

  const plan = await getSubscriptionPlan(planKey, req, { strict: true })
  if (!plan) {
    throw new Error('Subscription plan not found.')
  }

  if (!req.user) {
    throw new Error('Unauthorized')
  }

  const stripe = getBillingStripeClient()
  const customerId = await ensureStripeCustomer(req)
  const price = await ensureStripePlanPrice(plan, billingCycle)
  const creditsPerPeriod = getSubscriptionCreditsForBillingCycle(plan, billingCycle)
  const origin = getCanonicalAppURL()

  return stripe.checkout.sessions.create(
    {
      allow_promotion_codes: true,
      cancel_url: `${origin}/pricing?checkout=cancelled`,
      client_reference_id: String(req.user.id),
      customer: customerId,
      line_items: [
        {
          price: price.id,
          quantity: 1,
        },
      ],
      metadata: {
        billingCycle,
        creditsPerMonth: String(plan.creditsPerMonth),
        creditsPerPeriod: String(creditsPerPeriod),
        planKey: plan.key,
        userId: String(req.user.id),
      },
      mode: 'subscription',
      subscription_data: {
        metadata: {
          billingCycle,
          creditsPerMonth: String(plan.creditsPerMonth),
          creditsPerPeriod: String(creditsPerPeriod),
          planKey: plan.key,
          userId: String(req.user.id),
        },
      },
      success_url: `${origin}/pricing?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    },
    idempotencyKey ? { idempotencyKey } : undefined,
  )
}

export async function retrieveBillingCheckoutSession(sessionId: string) {
  const stripe = getBillingStripeClient()

  return stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['line_items.data.price.product'],
  })
}

export async function retrieveStripeSubscription(subscriptionId: string) {
  const stripe = getBillingStripeClient()

  return stripe.subscriptions.retrieve(subscriptionId, {
    expand: ['items.data.price.product'],
  })
}

export async function createBillingPortalSession(args: { customerId: string; req: PayloadRequest }) {
  const { customerId, req } = args
  const providers = await getPaymentProviderSettings(req, { strict: true })

  if (providers.subscriptionProvider !== 'stripe') {
    throw new Error('The active subscription provider is not Stripe, so Stripe Billing Portal is unavailable.')
  }

  const stripe = getBillingStripeClient()
  const origin = getCanonicalAppURL()
  const config = await ensurePortalConfiguration(stripe)

  return stripe.billingPortal.sessions.create({
    configuration: config.id,
    customer: customerId,
    return_url: `${origin}/account?section=billing`,
  })
}
