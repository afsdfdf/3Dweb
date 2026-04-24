import assert from 'node:assert/strict'
import test from 'node:test'

import {
  exportAdminOrderDetail,
  getAdminOrderWorkspace,
  markOrderCancelled,
  markOrderCompleted,
  markOrderInProduction,
  markOrderShipped,
} from '../src/lib/adminOrders.ts'

const createOrderRequest = (role: 'admin' | 'customer' | 'operator') => {
  const state = {
    updates: [] as Array<{ collection: string; data: Record<string, unknown>; id: number }>,
  }

  const order = {
    amount: 39.9,
    currency: 'USD',
    id: 71,
    internalNotes: '',
    materialOption: 'resin',
    model: { id: 801, title: 'Dragon Model' },
    orderNumber: 'PO-071',
    paymentStatus: 'paid',
    shippingAddress: 'Shanghai Road 1',
    shippingName: 'Alice',
    shippingPhone: '13800138000',
    sizeOption: 'standard',
    sourceTask: { id: 601, taskCode: 'TASK-601' },
    status: 'paid',
    trackingNumber: '',
    user: { email: 'buyer@example.com', id: 9 },
  }

  const payload = {
    find: async ({ collection }: { collection: string }) => {
      if (collection === 'shopify-payments') {
        return {
          docs: [{ checkoutReference: 'CHECKOUT-071', id: 901, linkedOrder: 71 }],
        }
      }

      throw new Error(`Unsupported collection: ${collection}`)
    },
    findByID: async ({ collection }: { collection: string }) => {
      assert.equal(collection, 'print-orders')
      return { ...order }
    },
    logger: {
      error: () => undefined,
      info: () => undefined,
      warn: () => undefined,
    },
    update: async ({ collection, data, id }: { collection: string; data: Record<string, unknown>; id: number }) => {
      state.updates.push({ collection, data, id })
      return {
        ...order,
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

test('getAdminOrderWorkspace returns order fulfillment detail modules', async () => {
  const { req } = createOrderRequest('operator')

  const workspace = await getAdminOrderWorkspace({
    orderId: 71,
    req,
  })

  assert.equal(workspace.summary.orderNumber, 'PO-071')
  assert.equal(workspace.summary.status, 'paid')
  assert.equal((workspace.sections.model as any)?.id, 801)
  assert.equal((workspace.sections.sourceTask as any)?.id, 601)
  assert.equal(workspace.sections.payments.length, 1)
  assert.equal(workspace.sections.shipping.shippingName, 'Alice')
})

test('customer cannot execute admin order actions', async () => {
  const { req } = createOrderRequest('customer')

  await assert.rejects(() => markOrderInProduction({ orderId: 71, req }), /Forbidden/)
  await assert.rejects(() => markOrderCancelled({ orderId: 71, req }), /Forbidden/)
})

test('staff can mark order status transitions', async () => {
  const { req, state } = createOrderRequest('operator')

  const inProduction = await markOrderInProduction({ orderId: 71, req })
  const shipped = await markOrderShipped({ orderId: 71, req })
  const completed = await markOrderCompleted({ orderId: 71, req })
  const cancelled = await markOrderCancelled({ orderId: 71, req })

  assert.equal((inProduction as any).status, 'in-production')
  assert.equal((shipped as any).status, 'shipped')
  assert.equal((completed as any).status, 'completed')
  assert.equal((cancelled as any).status, 'cancelled')
  assert.equal(state.updates.length, 4)
  assert.equal(typeof state.updates[0]?.data.statusUpdatedAt, 'string')
  assert.equal(state.updates[0]?.data.statusUpdatedBy, 1)
})

test('staff can export order detail as JSON', async () => {
  const { req } = createOrderRequest('operator')

  const payload = await exportAdminOrderDetail({
    orderId: 71,
    req,
  })

  const parsed = JSON.parse(payload)
  assert.equal(parsed.summary.orderNumber, 'PO-071')
  assert.equal(parsed.sections.payments.length, 1)
})
