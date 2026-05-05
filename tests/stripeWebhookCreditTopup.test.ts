import assert from 'node:assert/strict'
import test from 'node:test'

import { __setStripeWebhookTestHooks, stripeWebhookEndpoint } from '../src/endpoints/stripeWebhook.ts'

test('Stripe webhook routes credit top-up payment sessions to the credit finalizer', async () => {
  let creditFinalized = 0
  let printFinalized = 0

  __setStripeWebhookTestHooks({
    constructStripeWebhookEvent: () =>
      ({
        data: {
          object: {
            id: 'cs_credit_topup',
            metadata: {
              paymentType: 'credit-topup',
            },
            mode: 'payment',
          },
        },
        type: 'checkout.session.completed',
      }) as any,
    finalizeCreditTopupCheckoutSession: async () => {
      creditFinalized += 1
      return {} as any
    },
    finalizePrintOrderCheckoutSession: async () => {
      printFinalized += 1
      return {} as any
    },
  })

  const req = {
    headers: {
      get: (name: string) => (name === 'stripe-signature' ? 'test-signature' : ''),
    },
    payload: {
      logger: {
        error: () => undefined,
        info: () => undefined,
      },
    },
    text: async () => '{}',
  } as never

  try {
    const response = await stripeWebhookEndpoint.handler(req)
    const json = await response.json()

    assert.equal(response.status, 200)
    assert.equal(json.result.ok, true)
    assert.equal(creditFinalized, 1)
    assert.equal(printFinalized, 0)
  } finally {
    __setStripeWebhookTestHooks(null)
  }
})
