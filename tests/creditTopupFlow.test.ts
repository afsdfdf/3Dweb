import assert from 'node:assert/strict'
import test from 'node:test'

import {
  __setCreditTopupFlowTestHooks,
  createCreditTopupCheckout,
  finalizeCreditTopupCheckoutSession,
} from '../src/lib/creditTopupFlow.ts'

function createMockRequest() {
  const state = {
    payments: [] as any[],
    products: [
      {
        credits: 500,
        currency: 'USD',
        description: 'Flexible generation credits',
        id: 10,
        isActive: true,
        price: 19.99,
        productType: 'credit-topup',
        slug: 'credits-500',
        title: '500 Credits',
      },
    ],
    updatedPayments: [] as any[],
    users: [{ id: 1, stripeCustomerId: 'cus_test_123' }],
  }

  const req = {
    payload: {
      create: async ({ collection, data }: { collection: string; data: Record<string, unknown> }) => {
        if (collection !== 'shopify-payments') {
          throw new Error(`Unexpected create collection ${collection}`)
        }

        const payment = {
          id: state.payments.length + 1,
          ...data,
        }
        state.payments.push(payment)
        return payment
      },
      find: async ({ collection, where }: { collection: string; where?: any }) => {
        if (collection === 'credit-products') {
          return {
            docs: state.products.filter((product) => product.slug === where.slug.equals),
          }
        }

        if (collection === 'shopify-payments') {
          return {
            docs: state.payments.filter((payment) => payment.shopifyCheckoutId === where.shopifyCheckoutId.equals),
          }
        }

        throw new Error(`Unexpected find collection ${collection}`)
      },
      findByID: async ({ collection, id }: { collection: string; id: number }) => {
        if (collection !== 'credit-products') {
          throw new Error(`Unexpected findByID collection ${collection}`)
        }

        const product = state.products.find((item) => item.id === Number(id))
        if (!product) {
          throw new Error('Not found')
        }
        return product
      },
      findGlobal: async () => ({
        paymentProviders: {
          orderProvider: 'stripe',
          subscriptionProvider: 'stripe',
        },
      }),
      logger: {
        info: () => undefined,
      },
      update: async ({ collection, data, id }: { collection: string; data: Record<string, unknown>; id: number }) => {
        if (collection === 'shopify-payments') {
          const payment = state.payments.find((item) => item.id === Number(id))
          Object.assign(payment || {}, data)
          state.updatedPayments.push({ data, id })
          return payment
        }

        if (collection === 'users') {
          const user = state.users.find((item) => item.id === Number(id))
          Object.assign(user || {}, data)
          return user
        }

        throw new Error(`Unexpected update collection ${collection}`)
      },
    },
    user: {
      email: 'buyer@example.com',
      id: 1,
      stripeCustomerId: 'cus_test_123',
    },
  } as never

  return { req, state }
}

test('createCreditTopupCheckout creates a Stripe payment session and pending payment record', async () => {
  const { req, state } = createMockRequest()
  process.env.STRIPE_SECRET_KEY ||= 'sk_test_credit_topup'

  __setCreditTopupFlowTestHooks({
    createStripeCheckoutSession: async ({ checkoutReference, product }) =>
      ({
        id: 'cs_topup_123',
        metadata: {
          checkoutReference,
          productId: String(product.id),
        },
        url: 'https://checkout.stripe.test/topup',
      }) as any,
  })

  try {
    const checkout = await createCreditTopupCheckout({
      productId: 10,
      req,
    })

    assert.equal(checkout.checkoutUrl, 'https://checkout.stripe.test/topup')
    assert.equal(state.payments.length, 1)
    assert.equal(state.payments[0].paymentType, 'credit-topup')
    assert.equal(state.payments[0].status, 'pending')
    assert.equal(state.payments[0].creditsGranted, 500)
    assert.equal(state.payments[0].shopifyCheckoutId, 'cs_topup_123')
  } finally {
    __setCreditTopupFlowTestHooks(null)
  }
})

test('finalizeCreditTopupCheckoutSession marks payment paid and grants credits idempotently', async () => {
  const { req, state } = createMockRequest()
  state.payments.push({
    amount: 19.99,
    checkoutReference: 'TOPUP-TEST',
    creditsGranted: 500,
    currency: 'USD',
    id: 1,
    paymentType: 'credit-topup',
    rawWebhookPayload: {
      provider: 'stripe',
      sessionId: 'cs_topup_paid',
      stage: 'created',
    },
    shopifyCheckoutId: 'cs_topup_paid',
    status: 'pending',
    user: 1,
  })

  const purchases: any[] = []
  __setCreditTopupFlowTestHooks({
    purchaseCredits: async (input) => {
      purchases.push(input)
      return {
        account: { balance: input.amount },
        applied: true,
        idempotencyKey: input.idempotencyKey,
      }
    },
  })

  try {
    const result = await finalizeCreditTopupCheckoutSession({
      req,
      session: {
        client_reference_id: '1',
        id: 'cs_topup_paid',
        metadata: {
          credits: '500',
          paymentType: 'credit-topup',
          productId: '10',
          productSlug: 'credits-500',
          userId: '1',
        },
        mode: 'payment',
        payment_intent: 'pi_test_123',
        payment_status: 'paid',
        status: 'complete',
      } as any,
      sessionId: 'cs_topup_paid',
    })

    assert.equal(result.applied, true)
    assert.equal(state.payments[0].status, 'paid')
    assert.equal(purchases.length, 1)
    assert.equal(purchases[0].amount, 500)
    assert.equal(purchases[0].idempotencyKey, 'credit-topup:cs_topup_paid')
    assert.equal(purchases[0].userId, 1)
  } finally {
    __setCreditTopupFlowTestHooks(null)
  }
})

test('finalizeCreditTopupCheckoutSession waits for a paid payment status before granting credits', async () => {
  const { req, state } = createMockRequest()
  state.payments.push({
    amount: 19.99,
    checkoutReference: 'TOPUP-ASYNC',
    creditsGranted: 500,
    currency: 'USD',
    id: 1,
    paymentType: 'credit-topup',
    rawWebhookPayload: {
      provider: 'stripe',
      sessionId: 'cs_topup_async',
      stage: 'created',
    },
    shopifyCheckoutId: 'cs_topup_async',
    status: 'pending',
    user: 1,
  })

  const purchases: any[] = []
  __setCreditTopupFlowTestHooks({
    purchaseCredits: async (input) => {
      purchases.push(input)
      return {
        account: { balance: input.amount },
        applied: true,
        idempotencyKey: input.idempotencyKey,
      }
    },
  })

  try {
    const result = await finalizeCreditTopupCheckoutSession({
      req,
      session: {
        client_reference_id: '1',
        id: 'cs_topup_async',
        metadata: {
          credits: '500',
          paymentType: 'credit-topup',
          productId: '10',
          productSlug: 'credits-500',
          userId: '1',
        },
        mode: 'payment',
        payment_intent: 'pi_async_123',
        payment_status: 'unpaid',
        status: 'complete',
      } as any,
      sessionId: 'cs_topup_async',
    })

    assert.equal(result.applied, false)
    assert.equal(state.payments[0].status, 'pending')
    assert.equal(state.updatedPayments[0].data.rawWebhookPayload.stage, 'pending')
    assert.equal(purchases.length, 0)
  } finally {
    __setCreditTopupFlowTestHooks(null)
  }
})
