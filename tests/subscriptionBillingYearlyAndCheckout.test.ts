import assert from 'node:assert/strict'
import test from 'node:test'

import {
  __setStripeBillingTestHooks,
  createSubscriptionCheckout as createStripeSubscriptionCheckout,
  ensureStripePlanPrice,
} from '../src/lib/stripeBilling.ts'
import {
  __setSubscriptionFlowTestHooks,
  createSubscriptionCheckout,
} from '../src/lib/subscriptionFlow.ts'
import type { SubscriptionPlanDefinition } from '../src/lib/subscriptionPlans.ts'

const yearlyPlan = {
  creditsPerMonth: 760,
  description: 'Designed for high-frequency creation.',
  features: ['760 credits per month'],
  key: 'pro',
  lookupKey: 'miniforge_pro_monthly',
  monthlyPrice: 49,
  name: 'Pro',
  shortLabel: 'Pro plan',
  yearlyLookupKey: 'miniforge_pro_yearly',
  yearlyPrice: 470.4,
} satisfies SubscriptionPlanDefinition

function createStripeMock(args: {
  checkoutCreate?: (params: Record<string, unknown>, options?: Record<string, unknown>) => unknown
  listedPrices?: unknown[]
  onCreatePrice?: (params: Record<string, unknown>) => unknown
  onCreateProduct?: (params: Record<string, unknown>) => unknown
}) {
  return {
    checkout: {
      sessions: {
        create: async (params: Record<string, unknown>, options?: Record<string, unknown>) => {
          return args.checkoutCreate?.(params, options) ?? {
            expires_at: 1_893_456_000,
            id: 'cs_test_yearly',
            url: 'https://checkout.stripe.test/yearly',
          }
        },
      },
    },
    prices: {
      create: async (params: Record<string, unknown>) => {
        return args.onCreatePrice?.(params) ?? {
          active: true,
          currency: params.currency,
          id: 'price_yearly',
          lookup_key: params.lookup_key,
          product: params.product,
          recurring: params.recurring,
          unit_amount: params.unit_amount,
        }
      },
      list: async () => ({
        data: args.listedPrices ?? [],
      }),
      update: async (id: string, params: Record<string, unknown>) => ({ id, ...params }),
    },
    products: {
      create: async (params: Record<string, unknown>) => {
        return args.onCreateProduct?.(params) ?? { id: 'prod_yearly', ...params }
      },
    },
  }
}

function createBillingRequestMock() {
  return {
    payload: {
      findGlobal: async () => ({
        paymentProviders: {
          providerNotice: 'Stripe is live.',
          subscriptionProvider: 'stripe',
        },
        subscriptionPlans: {
          pro: {
            creditsPerMonth: yearlyPlan.creditsPerMonth,
            description: yearlyPlan.description,
            features: yearlyPlan.features.map((label) => ({ label })),
            monthlyPrice: yearlyPlan.monthlyPrice,
            name: yearlyPlan.name,
            shortLabel: yearlyPlan.shortLabel,
            yearlyPrice: yearlyPlan.yearlyPrice,
          },
        },
      }),
      update: async () => {
        throw new Error('The test user already has a Stripe customer.')
      },
    },
    user: {
      email: 'creator@example.test',
      id: 42,
      stripeCustomerId: 'cus_existing',
    },
  }
}

test('yearly subscription price sync uses the yearly Stripe lookup key and interval', async () => {
  let createPriceParams: Record<string, unknown> | null = null
  let productParams: Record<string, unknown> | null = null

  __setStripeBillingTestHooks({
    getStripeClient: () =>
      createStripeMock({
        listedPrices: [],
        onCreatePrice: (params) => {
          createPriceParams = params
          return {
            active: true,
            currency: params.currency,
            id: 'price_yearly',
            lookup_key: params.lookup_key,
            product: params.product,
            recurring: params.recurring,
            unit_amount: params.unit_amount,
          }
        },
        onCreateProduct: (params) => {
          productParams = params
          return { id: 'prod_yearly', ...params }
        },
      }) as never,
  })

  try {
    const price = await ensureStripePlanPrice(yearlyPlan, 'yearly')

    assert.equal(price.id, 'price_yearly')
    assert.equal(createPriceParams?.lookup_key, yearlyPlan.yearlyLookupKey)
    assert.deepEqual(createPriceParams?.recurring, { interval: 'year' })
    assert.equal(createPriceParams?.unit_amount, 47040)
    assert.equal(createPriceParams?.nickname, 'Pro Yearly')
    assert.equal(productParams?.name, 'Thorns Tavern Pro Yearly Subscription')
  } finally {
    __setStripeBillingTestHooks(null)
  }
})

test('yearly subscription checkout passes billing cycle, metadata, and Stripe idempotency key', async () => {
  let checkoutParams: Record<string, unknown> | null = null
  let checkoutOptions: Record<string, unknown> | undefined

  __setStripeBillingTestHooks({
    getStripeClient: () =>
      createStripeMock({
        checkoutCreate: (params, options) => {
          checkoutParams = params
          checkoutOptions = options
          return {
            expires_at: 1_893_456_000,
            id: 'cs_test_yearly',
            url: 'https://checkout.stripe.test/yearly',
          }
        },
        listedPrices: [],
        onCreatePrice: (params) => ({
          active: true,
          currency: params.currency,
          id: params.recurring && (params.recurring as Record<string, unknown>).interval === 'year' ? 'price_yearly' : 'price_monthly',
          lookup_key: params.lookup_key,
          product: params.product,
          recurring: params.recurring,
          unit_amount: params.unit_amount,
        }),
      }) as never,
  })

  try {
    const session = await createStripeSubscriptionCheckout({
      billingCycle: 'yearly',
      idempotencyKey: 'subscription-checkout-42-pro-yearly',
      planKey: 'pro',
      req: createBillingRequestMock() as never,
    })

    const lineItems = checkoutParams?.line_items as Array<Record<string, unknown>>
    const metadata = checkoutParams?.metadata as Record<string, unknown>
    const subscriptionData = checkoutParams?.subscription_data as Record<string, unknown>

    assert.equal(session.id, 'cs_test_yearly')
    assert.equal(lineItems[0]?.price, 'price_yearly')
    assert.equal(metadata.billingCycle, 'yearly')
    assert.equal(metadata.creditsPerPeriod, '9120')
    assert.equal((subscriptionData.metadata as Record<string, unknown>).billingCycle, 'yearly')
    assert.equal(checkoutOptions?.idempotencyKey, 'subscription-checkout-42-pro-yearly')
  } finally {
    __setStripeBillingTestHooks(null)
  }
})

test('subscription checkout reuses an open pending checkout instead of creating a second Stripe session', async () => {
  const checkouts: Array<Record<string, unknown>> = []
  let stripeCreateCalls = 0
  const req = {
    payload: {
      create: async ({ collection, data }: { collection: string; data: Record<string, unknown> }) => {
        assert.equal(collection, 'billing-checkouts')
        if (checkouts.some((item) => item.openLockKey && item.openLockKey === data.openLockKey)) {
          throw new Error('duplicate key value violates unique constraint')
        }
        const doc = { ...data, id: checkouts.length + 1 }
        checkouts.push(doc)
        return doc
      },
      find: async ({ collection, where }: { collection: string; where?: Record<string, unknown> }) => {
        if (collection === 'billing-subscriptions') {
          return { docs: [] }
        }

        assert.equal(collection, 'billing-checkouts')
        const open = checkouts.find((item) => item.status === 'open' && item.checkoutUrl)
        if (where?.openLockKey) {
          return { docs: open ? [open] : [] }
        }
        return { docs: open ? [open] : [] }
      },
      findGlobal: async () => ({
        paymentProviders: {
          subscriptionProvider: 'stripe',
        },
      }),
      update: async ({ collection, data, id }: { collection: string; data: Record<string, unknown>; id: number }) => {
        assert.equal(collection, 'billing-checkouts')
        const index = checkouts.findIndex((item) => item.id === id)
        assert.notEqual(index, -1)
        checkouts[index] = { ...checkouts[index], ...data }
        return checkouts[index]
      },
    },
    user: {
      id: 42,
    },
  }

  __setSubscriptionFlowTestHooks({
    createStripeSubscriptionCheckout: async ({ billingCycle, idempotencyKey }) => {
      stripeCreateCalls += 1
      assert.equal(billingCycle, 'yearly')
      assert.equal(idempotencyKey, 'subscription-checkout-42')
      return {
        expires_at: 1_893_456_000,
        id: 'cs_test_yearly',
        url: 'https://checkout.stripe.test/yearly',
      }
    },
  } as never)

  try {
    const first = await createSubscriptionCheckout({ billingCycle: 'yearly', planKey: 'pro', req: req as never })
    const second = await createSubscriptionCheckout({ billingCycle: 'yearly', planKey: 'pro', req: req as never })

    assert.equal(stripeCreateCalls, 1)
    assert.equal(first.url, 'https://checkout.stripe.test/yearly')
    assert.equal(second.url, first.url)
    assert.equal(checkouts[0]?.billingCycle, 'yearly')
    assert.equal(checkouts[0]?.stripeCheckoutSessionId, 'cs_test_yearly')
  } finally {
    __setSubscriptionFlowTestHooks(null)
  }
})

test('subscription checkout does not replace an in-flight open lock before Stripe returns a URL', async () => {
  const inFlightCheckout = {
    billingCycle: 'yearly',
    expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    id: 1,
    openLockKey: 'subscription-checkout-42',
    planKey: 'pro',
    status: 'open',
  }
  let createCalls = 0
  let stripeCreateCalls = 0
  const req = {
    payload: {
      create: async () => {
        createCalls += 1
        throw new Error('A second lock should not be created.')
      },
      find: async ({ collection }: { collection: string }) => {
        if (collection === 'billing-subscriptions') {
          return { docs: [] }
        }
        return { docs: [inFlightCheckout] }
      },
      findGlobal: async () => ({
        paymentProviders: {
          subscriptionProvider: 'stripe',
        },
      }),
      update: async () => {
        throw new Error('An in-flight lock should not be released.')
      },
    },
    user: {
      id: 42,
    },
  }

  __setSubscriptionFlowTestHooks({
    createStripeSubscriptionCheckout: async () => {
      stripeCreateCalls += 1
      throw new Error('Stripe should not be called for an in-flight lock.')
    },
  } as never)

  try {
    await assert.rejects(
      () => createSubscriptionCheckout({ billingCycle: 'yearly', planKey: 'pro', req: req as never }),
      /already being prepared/i,
    )
    assert.equal(createCalls, 0)
    assert.equal(stripeCreateCalls, 0)
  } finally {
    __setSubscriptionFlowTestHooks(null)
  }
})

test('subscription checkout reuses a racing in-flight lock after a unique constraint collision', async () => {
  const racingCheckout = {
    billingCycle: 'yearly',
    expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    id: 1,
    openLockKey: 'subscription-checkout-42',
    planKey: 'pro',
    status: 'open',
  }
  let billingCheckoutFindCalls = 0
  let stripeCreateCalls = 0
  const req = {
    payload: {
      create: async ({ collection }: { collection: string }) => {
        assert.equal(collection, 'billing-checkouts')
        throw new Error('duplicate key value violates unique constraint')
      },
      find: async ({ collection }: { collection: string }) => {
        if (collection === 'billing-subscriptions') {
          return { docs: [] }
        }

        assert.equal(collection, 'billing-checkouts')
        billingCheckoutFindCalls += 1
        return { docs: billingCheckoutFindCalls === 1 ? [] : [racingCheckout] }
      },
      findGlobal: async () => ({
        paymentProviders: {
          subscriptionProvider: 'stripe',
        },
      }),
      update: async () => {
        throw new Error('A racing in-flight lock should not be released.')
      },
    },
    user: {
      id: 42,
    },
  }

  __setSubscriptionFlowTestHooks({
    createStripeSubscriptionCheckout: async () => {
      stripeCreateCalls += 1
      throw new Error('Stripe should not be called when a racing lock exists.')
    },
  } as never)

  try {
    await assert.rejects(
      () => createSubscriptionCheckout({ billingCycle: 'yearly', planKey: 'pro', req: req as never }),
      /already being prepared/i,
    )
    assert.equal(stripeCreateCalls, 0)
    assert.equal(billingCheckoutFindCalls, 2)
  } finally {
    __setSubscriptionFlowTestHooks(null)
  }
})
