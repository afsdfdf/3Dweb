import assert from 'node:assert/strict'
import test from 'node:test'

import { __setStripeBillingTestHooks, ensureStripePlanPrice } from '../src/lib/stripeBilling.ts'
import type { SubscriptionPlanDefinition } from '../src/lib/subscriptionPlans.ts'

const basePlan = {
  creditsPerMonth: 760,
  description: 'Designed for high-frequency creation.',
  features: ['760 credits per month'],
  key: 'pro',
  lookupKey: 'miniforge_pro_monthly',
  monthlyPrice: 49,
  name: 'Pro',
  shortLabel: 'Pro plan',
} satisfies SubscriptionPlanDefinition

function createStripeMock(args: {
  listedPrices: unknown[]
  onCreatePrice?: (params: Record<string, unknown>) => unknown
  onCreateProduct?: (params: Record<string, unknown>) => unknown
  onUpdatePrice?: (id: string, params: Record<string, unknown>) => unknown
}) {
  return {
    prices: {
      create: async (params: Record<string, unknown>) => {
        return args.onCreatePrice?.(params) ?? {
          active: true,
          currency: params.currency,
          id: 'price_created',
          lookup_key: params.lookup_key,
          product: params.product,
          recurring: params.recurring,
          unit_amount: params.unit_amount,
        }
      },
      list: async () => ({
        data: args.listedPrices,
      }),
      update: async (id: string, params: Record<string, unknown>) => {
        return args.onUpdatePrice?.(id, params) ?? { id, ...params }
      },
    },
    products: {
      create: async (params: Record<string, unknown>) => {
        return args.onCreateProduct?.(params) ?? { id: 'prod_created', ...params }
      },
    },
  }
}

test('subscription checkout reuses a matching active Stripe lookup-key price', async () => {
  let createPriceCalls = 0
  let updatePriceCalls = 0
  const currentPrice = {
    active: true,
    currency: 'usd',
    id: 'price_current',
    lookup_key: basePlan.lookupKey,
    product: 'prod_current',
    recurring: { interval: 'month' },
    unit_amount: 4900,
  }

  __setStripeBillingTestHooks({
    getStripeClient: () =>
      createStripeMock({
        listedPrices: [currentPrice],
        onCreatePrice: () => {
          createPriceCalls += 1
          return { id: 'price_unexpected' }
        },
        onUpdatePrice: () => {
          updatePriceCalls += 1
          return { id: 'price_current' }
        },
      }) as never,
  })

  try {
    const price = await ensureStripePlanPrice(basePlan)

    assert.equal(price.id, 'price_current')
    assert.equal(createPriceCalls, 0)
    assert.equal(updatePriceCalls, 0)
  } finally {
    __setStripeBillingTestHooks(null)
  }
})

test('subscription checkout rotates the Stripe lookup key when Payload price changes', async () => {
  let createPriceParams: Record<string, unknown> | null = null
  let archivedPrice: null | { id: string; params: Record<string, unknown> } = null
  const oldPrice = {
    active: true,
    currency: 'usd',
    id: 'price_old',
    lookup_key: basePlan.lookupKey,
    product: 'prod_current',
    recurring: { interval: 'month' },
    unit_amount: 4900,
  }
  const updatedPlan = {
    ...basePlan,
    monthlyPrice: 59,
  } satisfies SubscriptionPlanDefinition

  __setStripeBillingTestHooks({
    getStripeClient: () =>
      createStripeMock({
        listedPrices: [oldPrice],
        onCreatePrice: (params) => {
          createPriceParams = params
          return {
            active: true,
            currency: params.currency,
            id: 'price_new',
            lookup_key: params.lookup_key,
            product: params.product,
            recurring: params.recurring,
            unit_amount: params.unit_amount,
          }
        },
        onUpdatePrice: (id, params) => {
          archivedPrice = { id, params }
          return { id, ...params }
        },
      }) as never,
  })

  try {
    const price = await ensureStripePlanPrice(updatedPlan)

    assert.equal(price.id, 'price_new')
    assert.equal(createPriceParams?.lookup_key, basePlan.lookupKey)
    assert.equal(createPriceParams?.transfer_lookup_key, true)
    assert.equal(createPriceParams?.product, 'prod_current')
    assert.equal(createPriceParams?.unit_amount, 5900)
    assert.deepEqual(createPriceParams?.metadata, {
      creditsPerMonth: '760',
      planKey: 'pro',
    })
    assert.deepEqual(archivedPrice, {
      id: 'price_old',
      params: { active: false },
    })
  } finally {
    __setStripeBillingTestHooks(null)
  }
})

test('subscription checkout creates a Stripe product when no lookup-key price exists', async () => {
  let productParams: Record<string, unknown> | null = null
  let createPriceParams: Record<string, unknown> | null = null

  __setStripeBillingTestHooks({
    getStripeClient: () =>
      createStripeMock({
        listedPrices: [],
        onCreateProduct: (params) => {
          productParams = params
          return { id: 'prod_new', ...params }
        },
        onCreatePrice: (params) => {
          createPriceParams = params
          return {
            active: true,
            currency: params.currency,
            id: 'price_new',
            lookup_key: params.lookup_key,
            product: params.product,
            recurring: params.recurring,
            unit_amount: params.unit_amount,
          }
        },
      }) as never,
  })

  try {
    const price = await ensureStripePlanPrice(basePlan)

    assert.equal(price.id, 'price_new')
    assert.equal(productParams?.name, 'Thorns Tavern Pro Monthly Subscription')
    assert.equal(createPriceParams?.product, 'prod_new')
    assert.equal(createPriceParams?.transfer_lookup_key, undefined)
  } finally {
    __setStripeBillingTestHooks(null)
  }
})
