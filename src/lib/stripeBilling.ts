import type { PayloadRequest } from 'payload'
import type Stripe from 'stripe'

import { getCanonicalAppURL } from '@/lib/getCanonicalAppURL'
import { getPaymentProviderSettings } from '@/lib/paymentProviders'
import { getSubscriptionPlan, type SubscriptionPlanDefinition, type SubscriptionPlanKey } from '@/lib/subscriptionPlans'
import { getStripeClient } from '@/lib/stripeGateway'

const INTERNAL_ACCESS = true

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

  const stripe = getStripeClient()
  const existingCustomerId = getUserStringField(req, 'stripeCustomerId')

  if (existingCustomerId) {
    return existingCustomerId
  }

  const customer = await stripe.customers.create({
    email: getUserStringField(req, 'email'),
    metadata: {
      source: 'thornstavern-app',
      userId: String(req.user.id),
    },
    name: getUserStringField(req, 'fullName'),
    phone: getUserStringField(req, 'phone'),
  })

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

export async function ensureStripePlanPrice(plan: SubscriptionPlanDefinition) {
  const stripe = getStripeClient()
  const matched = await stripe.prices.list({
    active: true,
    limit: 1,
    lookup_keys: [plan.lookupKey],
  })

  const current = matched.data[0]
  if (current) {
    return current
  }

  const product = await stripe.products.create({
    description: plan.description,
    metadata: {
      creditsPerMonth: String(plan.creditsPerMonth),
      planKey: plan.key,
    },
    name: `Thorns Tavern ${plan.name} Monthly Subscription`,
  })

  return stripe.prices.create({
    currency: 'usd',
    lookup_key: plan.lookupKey,
    metadata: {
      creditsPerMonth: String(plan.creditsPerMonth),
      planKey: plan.key,
    },
    nickname: `${plan.name} Monthly`,
    product: product.id,
    recurring: {
      interval: 'month',
    },
    unit_amount: Math.round(plan.monthlyPrice * 100),
  })
}

export async function createSubscriptionCheckout(args: { planKey: SubscriptionPlanKey; req: PayloadRequest }) {
  const { planKey, req } = args
  const providers = await getPaymentProviderSettings(req)

  if (providers.subscriptionProvider !== 'stripe') {
    throw new Error('The active subscription provider is set to Shopify reserved mode, so Stripe subscription checkout is currently disabled.')
  }

  const plan = await getSubscriptionPlan(planKey, req)
  if (!plan) {
    throw new Error('Subscription plan not found.')
  }

  if (!req.user) {
    throw new Error('Unauthorized')
  }

  const stripe = getStripeClient()
  const customerId = await ensureStripeCustomer(req)
  const price = await ensureStripePlanPrice(plan)
  const origin = getCanonicalAppURL()

  return stripe.checkout.sessions.create({
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
      creditsPerMonth: String(plan.creditsPerMonth),
      planKey: plan.key,
      userId: String(req.user.id),
    },
    mode: 'subscription',
    subscription_data: {
      metadata: {
        creditsPerMonth: String(plan.creditsPerMonth),
        planKey: plan.key,
        userId: String(req.user.id),
      },
    },
    success_url: `${origin}/pricing?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
  })
}

export async function retrieveBillingCheckoutSession(sessionId: string) {
  const stripe = getStripeClient()

  return stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['line_items.data.price.product'],
  })
}

export async function retrieveStripeSubscription(subscriptionId: string) {
  const stripe = getStripeClient()

  return stripe.subscriptions.retrieve(subscriptionId, {
    expand: ['items.data.price.product'],
  })
}

export async function createBillingPortalSession(args: { customerId: string; req: PayloadRequest }) {
  const { customerId, req } = args
  const providers = await getPaymentProviderSettings(req)

  if (providers.subscriptionProvider !== 'stripe') {
    throw new Error('The active subscription provider is not Stripe, so Stripe Billing Portal is unavailable.')
  }

  const stripe = getStripeClient()
  const origin = getCanonicalAppURL()
  const config = await ensurePortalConfiguration(stripe)

  return stripe.billingPortal.sessions.create({
    configuration: config.id,
    customer: customerId,
    return_url: `${origin}/dashboard/credits`,
  })
}
