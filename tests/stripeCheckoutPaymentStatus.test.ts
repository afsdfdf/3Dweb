import assert from 'node:assert/strict'
import test from 'node:test'

import { finalizePrintOrderCheckoutSession } from '../src/lib/printOrderFlow.ts'

test('finalizePrintOrderCheckoutSession waits for Stripe paid status before marking order paid', async () => {
  const paymentUpdates: any[] = []
  const orderUpdates: any[] = []
  const order = {
    amount: 39.9,
    currency: 'USD',
    id: 77,
    orderNumber: 'ORD-77',
    status: 'pending-payment',
  }

  const req = {
    payload: {
      find: async ({ collection }: { collection: string }) => {
        if (collection !== 'shopify-payments') {
          throw new Error(`Unexpected find collection ${collection}`)
        }

        return {
          docs: [
            {
              id: 3,
              linkedOrder: 77,
              rawWebhookPayload: {
                provider: 'stripe',
                sessionId: 'cs_print_async',
                stage: 'created',
              },
              shopifyCheckoutId: 'cs_print_async',
              status: 'pending',
            },
          ],
        }
      },
      findByID: async ({ collection, id }: { collection: string; id: number }) => {
        if (collection !== 'print-orders' || id !== 77) {
          throw new Error(`Unexpected findByID ${collection}:${id}`)
        }

        return order
      },
      logger: {
        error: () => undefined,
        info: () => undefined,
      },
      update: async ({ collection, data, id }: { collection: string; data: Record<string, unknown>; id: number }) => {
        if (collection === 'shopify-payments') {
          paymentUpdates.push({ data, id })
          return { id, ...data }
        }

        if (collection === 'print-orders') {
          orderUpdates.push({ data, id })
          return { ...order, ...data }
        }

        throw new Error(`Unexpected update collection ${collection}`)
      },
    },
    user: {
      email: 'buyer@example.com',
      id: 1,
    },
  } as never

  const result = await finalizePrintOrderCheckoutSession({
    req,
    session: {
      id: 'cs_print_async',
      payment_intent: 'pi_async_print',
      payment_status: 'unpaid',
      status: 'complete',
    } as any,
    sessionId: 'cs_print_async',
  })

  assert.equal(result.status, 'pending-payment')
  assert.equal(paymentUpdates.length, 1)
  assert.equal(paymentUpdates[0].data.status, 'pending')
  assert.equal(orderUpdates.length, 0)
})
