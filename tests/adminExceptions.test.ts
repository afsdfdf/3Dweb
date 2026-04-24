import assert from 'node:assert/strict'
import test from 'node:test'

import { exportAdminExceptionDomain, getAdminExceptionWorkbench } from '../src/lib/adminExceptions.ts'

const createExceptionRequest = (role: 'admin' | 'customer' | 'operator') =>
  ({
    payload: {
      find: async ({ collection, where }: { collection: string; where?: Record<string, any> }) => {
        switch (collection) {
          case 'generation-tasks':
            if (where?.status?.equals === 'failed') return { docs: [{ id: 1, provider: 'meshy', status: 'failed', taskCode: 'TASK-1', updatedAt: '2026-04-18' }] }
            if (where?.status?.equals === 'timeout') return { docs: [{ id: 2, provider: 'meshy', status: 'timeout', taskCode: 'TASK-2', updatedAt: '2026-04-18' }] }
            return { docs: [{ id: 3, provider: 'meshy', status: 'succeeded', taskCode: 'TASK-3', updatedAt: '2026-04-18' }] }
          case 'shopify-payments':
            if (where?.and) return { docs: [{ checkoutReference: 'PAY-2', id: 12, shopifyCheckoutId: 'cs_orphan', status: 'paid', user: 9 }] }
            return { docs: [{ checkoutReference: 'PAY-1', id: 11, shopifyCheckoutId: 'cs_fail', status: 'failed', user: 9 }] }
          case 'print-orders':
            if (where?.and) return { docs: [{ id: 21, orderNumber: 'PO-21', paymentStatus: 'paid', status: 'pending-payment', user: 9 }] }
            if (where?.model) return { docs: [{ id: 22, orderNumber: 'PO-22', paymentStatus: 'pending', status: 'pending-payment', user: 9 }] }
            return { docs: [{ id: 23, orderNumber: 'PO-23', paymentStatus: 'paid', status: 'paid', user: 9 }] }
          case 'credits':
            return { docs: [{ balance: 10, id: 31, reservedBalance: 2 }] }
          case 'credit-transactions':
            return { docs: [{ id: 41, idempotencyKey: 'dup-1', type: 'manual_adjustment' }] }
          default:
            throw new Error(`Unsupported collection: ${collection}`)
        }
      },
    },
    user: {
      id: 1,
      role,
    },
  }) as never

test('staff can read exception workbench', async () => {
  const result = await getAdminExceptionWorkbench({
    req: createExceptionRequest('operator'),
  })

  assert.equal(result.tasks.failed.length, 1)
  assert.equal(result.payments.orphanPaidSessions.length, 1)
  assert.equal(result.orders.paymentStatusMismatch.length, 1)
  assert.equal(result.accounting.reservedBalanceAccounts.length, 1)
})

test('customer cannot read exception workbench', async () => {
  await assert.rejects(() => getAdminExceptionWorkbench({ req: createExceptionRequest('customer') }), /Forbidden/)
})

test('staff can export exception domains', async () => {
  const req = createExceptionRequest('operator')

  const taskCsv = await exportAdminExceptionDomain({ domain: 'tasks', req })
  const paymentCsv = await exportAdminExceptionDomain({ domain: 'payments', req })
  const orderCsv = await exportAdminExceptionDomain({ domain: 'orders', req })
  const accountingCsv = await exportAdminExceptionDomain({ domain: 'accounting', req })

  assert.match(taskCsv, /^id,taskCode,status,provider,updatedAt/m)
  assert.match(paymentCsv, /^id,checkoutReference,status,sessionId,user/m)
  assert.match(orderCsv, /^id,orderNumber,status,paymentStatus,user/m)
  assert.match(accountingCsv, /^id,type,balance,reservedBalance,idempotencyKey/m)
})
