import type { PayloadRequest } from 'payload'
import type Stripe from 'stripe'

import { getPaymentProviderSettings } from '@/lib/paymentProviders'
import { getSubscriptionPlan, type SubscriptionPlanDefinition, type SubscriptionPlanKey } from '@/lib/subscriptionPlans'
import { getStripeClient } from '@/lib/stripeGateway'

const INTERNAL_ACCESS = true

const getUserStringField = (req: PayloadRequest, key: 'email' | 'fullName' | 'phone' | 'stripeCustomerId') => {
  const value = req.user && typeof req.user === 'object' && key in req.user ? req.user[key] : undefined
  return typeof value === 'string' && value.length > 0 ? value : undefined
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
      headline: 'MiniForge 订阅管理',
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
      source: 'miniforge-app',
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
    name: `MiniForge ${plan.name} 月度订阅`,
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
    throw new Error('当前后台已将订阅支付通道切换为 Shopify 预留模式，Stripe 订阅暂不可创建。')
  }

  const plan = await getSubscriptionPlan(planKey, req)
  if (!plan) {
    throw new Error('未找到对应的订阅方案。')
  }

  if (!req.user) {
    throw new Error('Unauthorized')
  }

  const stripe = getStripeClient()
  const customerId = await ensureStripeCustomer(req)
  const price = await ensureStripePlanPrice(plan)
  const origin = getAppOrigin(req)

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
    throw new Error('当前订阅支付通道不是 Stripe，暂不支持打开 Stripe Billing Portal。')
  }

  const stripe = getStripeClient()
  const origin = getAppOrigin(req)
  const config = await ensurePortalConfiguration(stripe)

  return stripe.billingPortal.sessions.create({
    configuration: config.id,
    customer: customerId,
    return_url: `${origin}/dashboard/credits`,
  })
}
