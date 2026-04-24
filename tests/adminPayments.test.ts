import assert from 'node:assert/strict'
import test from 'node:test'

import {
  __setAdminPaymentsTestHooks,
  exportAdminPaymentDetail,
  getAdminPaymentWorkspace,
  markAdminPaymentException,
  resyncAdminPaymentStatus,
} from '../src/lib/adminPayments.ts'

const createPaymentRequest = (role: 'admin' | 'customer' | 'operator') => {
  const state = {
    updates: [] as Array<{ collection: string; data: Record<string, unknown>; id: number }>,
  }

  const payment = {
    amount: 20,
    checkoutReference: 'CHECKOUT-1',
    currency: 'USD',
    id: 31,
    linkedOrder: { id: 901, orderNumber: 'PO-901' },
    paymentType: 'print-order',
    rawWebhookPayload: { provider: 'stripe' },
    shopifyCheckoutId: 'cs_test_123',
    shopifyCheckoutUrl: 'https://checkout.example.com/cs_test_123',
    shopifyOrderId: 'ord_123',
    status: 'pending',
    user: { email: 'payer@example.com', id: 7 },
  }

  const payload = {
    findByID: async ({ collection }: { collection: string }) => {
      assert.equal(collection, 'shopify-payments')
      return { ...payment }
    },
    logger: {
      error: () => undefined,
      info: () => undefined,
      warn: () => undefined,
    },
    update: async ({ collection, data, id }: { collection: string; data: Record<string, unknown>; id: number }) => {
      state.updates.push({ collection, data, id })
      return {
        ...payment,
        ...data,
        id,
      }
    },
  }

  return {
    req: {
      payload,
      user: {
        id: 1,
        role,
      },
    } as never,
    state,
  }
}

test('getAdminPaymentWorkspace returns payment management detail modules', async () => {
  const { req } = createPaymentRequest('operator')

  const workspace = await getAdminPaymentWorkspace({
    paymentId: 31,
    req,
  })

  assert.equal(workspace.summary.provider, 'stripe')
  assert.equal(workspace.summary.sessionId, 'cs_test_123')
  assert.equal(workspace.summary.checkoutUrl, 'https://checkout.example.com/cs_test_123')
  assert.equal(workspace.summary.orderReference, 'ord_123')
  assert.equal((workspace.sections.linkedOrder as any)?.id, 901)
})

test('customer cannot operate payment admin actions', async () => {
  const { req } = createPaymentRequest('customer')

  await assert.rejects(() => resyncAdminPaymentStatus({ paymentId: 31, req }), /Forbidden/)
  await assert.rejects(() => markAdminPaymentException({ paymentId: 31, reason: 'x', req }), /Forbidden/)
})

test('staff can re-sync stripe print-order payment status', async () => {
  const { req } = createPaymentRequest('operator')
  let syncCalls = 0

  __setAdminPaymentsTestHooks({
    finalizePrintOrderCheckoutSession: async ({ sessionId }) => {
      syncCalls += 1
      assert.equal(sessionId, 'cs_test_123')
      return { id: 901, status: 'paid' } as never
    },
  })

  try {
    const result = await resyncAdminPaymentStatus({
      paymentId: 31,
      req,
    })

    assert.equal(syncCalls, 1)
    assert.equal(result.status, 'paid')
  } finally {
    __setAdminPaymentsTestHooks(null)
  }
})

test('staff can mark payment as exception', async () => {
  const { req, state } = createPaymentRequest('operator')

  const payment = await markAdminPaymentException({
    paymentId: 31,
    reason: 'Webhook received but order not updated',
    req,
  })

  assert.equal((payment as any).exceptionFlag, true)
  assert.equal(state.updates[0]?.data.exceptionReason, 'Webhook received but order not updated')
  assert.equal(state.updates[0]?.collection, 'shopify-payments')
})

test('staff can export payment detail as JSON', async () => {
  const { req } = createPaymentRequest('operator')

  const payload = await exportAdminPaymentDetail({
    paymentId: 31,
    req,
  })

  const parsed = JSON.parse(payload)
  assert.equal(parsed.summary.sessionId, 'cs_test_123')
  assert.equal(parsed.sections.payment.checkoutReference, 'CHECKOUT-1')
})
