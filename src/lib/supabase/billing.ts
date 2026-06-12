import { queryPostgres } from '@/lib/postgres'
import { getCanonicalAppURL } from '@/lib/getCanonicalAppURL'
import { getStripeClient } from '@/lib/stripeGateway'
import { getSubscriptionPlan } from '@/lib/subscriptionPlans'
import { ensureStripePlanPrice } from '@/lib/stripeBilling'
import type { AppUser } from '@/lib/supabase/queries'

// Legacy Supabase/Stripe compatibility path. This file may sync Stripe customer,
// subscription, print order, and order payment rows, but credit account and
// ledger mutations must stay in the Payload credit ledger services.

type StripeCustomerRow = {
  email: string | null
  full_name: string | null
  id: string
  phone: string | null
  stripe_customer_id: string | null
}

type SubscriptionPlanKey = 'starter' | 'pro' | 'studio'

const normalizeSubscriptionPlanKey = (value: unknown): SubscriptionPlanKey | '' => {
  return value === 'starter' || value === 'pro' || value === 'studio' ? value : ''
}

async function getProfileForBilling(userId: string): Promise<StripeCustomerRow | null> {
  const { rows } = await queryPostgres<StripeCustomerRow>(
    `
      select id, email, full_name, phone, stripe_customer_id
      from public.profiles
      where id = $1
      limit 1
    `,
    [userId],
  )

  return rows[0] || null
}

export async function ensureStripeCustomerForUser(userId: string) {
  const profile = await getProfileForBilling(userId)
  if (!profile) {
    throw new Error('Profile not found.')
  }

  if (profile.stripe_customer_id) {
    return profile.stripe_customer_id
  }

  const stripe = getStripeClient()
  const customer = await stripe.customers.create({
    email: profile.email || undefined,
    metadata: {
      source: 'thornstavern-supabase',
      userId,
    },
    name: profile.full_name || undefined,
    phone: profile.phone || undefined,
  })

  await queryPostgres(
    `
      update public.profiles
      set stripe_customer_id = $2
      where id = $1
    `,
    [userId, customer.id],
  )

  return customer.id
}

export async function ensureStripeSubscriptionPrice(planKey: SubscriptionPlanKey) {
  const plan = await getSubscriptionPlan(planKey)
  if (!plan) {
    throw new Error('Subscription plan not found.')
  }

  return ensureStripePlanPrice(plan)
}

export async function createStripeSubscriptionCheckout(args: {
  planKey: SubscriptionPlanKey
  user: AppUser
}) {
  const { planKey, user } = args
  const customerId = await ensureStripeCustomerForUser(user.id)
  const price = await ensureStripeSubscriptionPrice(planKey)
  const stripe = getStripeClient()
  const origin = getCanonicalAppURL()

  const session = await stripe.checkout.sessions.create({
    allow_promotion_codes: true,
    cancel_url: `${origin}/pricing?checkout=cancelled`,
    client_reference_id: user.id,
    customer: customerId,
    line_items: [
      {
        price: price.id,
        quantity: 1,
      },
    ],
    metadata: {
      planKey,
      userId: user.id,
    },
    mode: 'subscription',
    subscription_data: {
      metadata: {
        planKey,
        userId: user.id,
      },
    },
    success_url: `${origin}/pricing?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
  })

  if (!session.url) {
    throw new Error('Stripe did not return a checkout URL.')
  }

  return session
}

export async function syncStripeSubscriptionFromCheckout(sessionId: string, userId: string) {
  const stripe = getStripeClient()
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['line_items.data.price.product'],
  })

  const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id
  const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id

  if (!subscriptionId || !customerId) {
    throw new Error('Stripe did not return subscription metadata.')
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ['items.data.price.product'],
  })

  const price = subscription.items.data[0]?.price
  const product =
    price?.product && typeof price.product !== 'string' && !('deleted' in price.product && price.product.deleted)
      ? price.product
      : null
  const metadataPlanKey = normalizeSubscriptionPlanKey(subscription.metadata?.planKey)
  const lookupPlanKey = price?.lookup_key?.includes('starter')
    ? 'starter'
    : price?.lookup_key?.includes('pro')
      ? 'pro'
      : price?.lookup_key?.includes('studio')
        ? 'studio'
        : ''
  const productPlanKey = normalizeSubscriptionPlanKey(product?.metadata?.planKey)
  const planKey = metadataPlanKey || lookupPlanKey || productPlanKey || 'starter'

  const monthlyCredits = Number(product?.metadata?.creditsPerMonth || subscription.metadata?.creditsPerMonth || 0)

  const { rows } = await queryPostgres<Record<string, unknown>>(
    `
      insert into public.subscriptions (
        user_id,
        provider,
        plan_key,
        stripe_customer_id,
        stripe_subscription_id,
        stripe_price_id,
        status,
        billing_interval,
        monthly_credits,
        current_period_start,
        current_period_end,
        cancel_at_period_end,
        last_checkout_session_id,
        metadata,
        last_synced_at
      )
      values (
        $1, 'stripe', $2, $3, $4, $5, $6, $7, $8,
        to_timestamp($9), to_timestamp($10), $11, $12, $13::jsonb, timezone('utc', now())
      )
      on conflict (stripe_subscription_id) do update
      set
        plan_key = excluded.plan_key,
        stripe_customer_id = excluded.stripe_customer_id,
        stripe_price_id = excluded.stripe_price_id,
        status = excluded.status,
        billing_interval = excluded.billing_interval,
        monthly_credits = excluded.monthly_credits,
        current_period_start = excluded.current_period_start,
        current_period_end = excluded.current_period_end,
        cancel_at_period_end = excluded.cancel_at_period_end,
        last_checkout_session_id = excluded.last_checkout_session_id,
        metadata = excluded.metadata,
        last_synced_at = excluded.last_synced_at,
        updated_at = timezone('utc', now())
      returning *
    `,
    [
      userId,
      planKey,
      customerId,
      subscription.id,
      price?.id || null,
      subscription.status,
      price?.recurring?.interval || 'month',
      monthlyCredits,
      subscription.items.data[0]?.current_period_start || Math.floor(Date.now() / 1000),
      subscription.items.data[0]?.current_period_end || Math.floor(Date.now() / 1000),
      Boolean(subscription.cancel_at_period_end),
      session.id,
      JSON.stringify(subscription),
    ],
  )

  return rows[0] || null
}

export async function syncStripeSubscriptionFromSession(sessionId: string) {
  const stripe = getStripeClient()
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['line_items.data.price.product'],
  })

  const userId =
    (typeof session.client_reference_id === 'string' && session.client_reference_id) ||
    (typeof session.metadata?.userId === 'string' && session.metadata.userId) ||
    ''

  if (!userId) {
    throw new Error('Unable to resolve user from Stripe checkout session.')
  }

  return syncStripeSubscriptionFromCheckout(sessionId, userId)
}

export async function createStripePortalForUser(userId: string) {
  const customerId = await ensureStripeCustomerForUser(userId)
  const stripe = getStripeClient()
  const origin = getCanonicalAppURL()

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${origin}/account?section=billing`,
  })

  return session
}

export async function createStripePrintOrderCheckout(args: {
  amount: number
  modelTitle?: string | null
  orderId: string
  orderNumber: string
  userEmail?: string | null
}) {
  const stripe = getStripeClient()
  const origin = getCanonicalAppURL()
  const checkoutReference = `STRIPE-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`

  const session = await stripe.checkout.sessions.create({
    allow_promotion_codes: true,
    cancel_url: `${origin}/account?section=orders&checkout=cancelled`,
    client_reference_id: args.orderId,
    customer_email: args.userEmail || undefined,
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            description: args.modelTitle ? `Model: ${args.modelTitle}` : 'Thorns Tavern print order',
            name: `3D Print Order ${args.orderNumber}`,
          },
          unit_amount: Math.round(Number(args.amount || 0) * 100),
        },
        quantity: 1,
      },
    ],
    metadata: {
      checkoutReference,
      orderId: args.orderId,
      orderNumber: args.orderNumber,
      paymentType: 'print-order',
    },
    mode: 'payment',
    success_url: `${origin}/account?section=orders&checkout=success&session_id={CHECKOUT_SESSION_ID}`,
  })

  if (!session.url) {
    throw new Error('Stripe did not return a checkout URL.')
  }

  return {
    checkoutReference,
    session,
  }
}

export async function syncStripePrintOrderFromCheckout(orderId: string) {
  const { rows } = await queryPostgres<Record<string, unknown>>(
    `
      select o.*, p.provider_order_id
      from public.print_orders o
      left join public.order_payments p on p.linked_order_id = o.id
      where o.id = $1
      order by p.created_at desc nulls last
      limit 1
    `,
    [orderId],
  )

  const order = rows[0]
  if (!order) {
    throw new Error('Order not found.')
  }

  const sessionId = typeof order.provider_order_id === 'string' ? order.provider_order_id : ''
  if (!sessionId) {
    return order
  }

  const stripe = getStripeClient()
  const session = await stripe.checkout.sessions.retrieve(sessionId)
  const paid = session.payment_status === 'paid'

  await queryPostgres(
    `
      update public.order_payments
      set
        status = $2,
        raw_payload = $3::jsonb,
        updated_at = timezone('utc', now())
      where linked_order_id = $1
    `,
    [orderId, paid ? 'paid' : 'pending', JSON.stringify(session)],
  )

  await queryPostgres(
    `
      update public.print_orders
      set
        status = $2,
        payment_status = $3,
        updated_at = timezone('utc', now())
      where id = $1
    `,
    [orderId, paid ? 'paid' : 'pending-payment', paid ? 'paid' : 'pending'],
  )

  const refreshed = await queryPostgres<Record<string, unknown>>(`select * from public.print_orders where id = $1 limit 1`, [orderId])
  return refreshed.rows[0] || null
}

export async function syncStripePrintOrderFromSession(sessionId: string) {
  const stripe = getStripeClient()
  const session = await stripe.checkout.sessions.retrieve(sessionId)

  const orderId =
    (typeof session.client_reference_id === 'string' && session.client_reference_id) ||
    (typeof session.metadata?.orderId === 'string' && session.metadata.orderId) ||
    ''

  if (!orderId) {
    throw new Error('Unable to resolve order from Stripe checkout session.')
  }

  return syncStripePrintOrderFromCheckout(orderId)
}
