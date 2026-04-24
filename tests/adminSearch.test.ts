import assert from 'node:assert/strict'
import test from 'node:test'

import { exportAdminList, searchAdminRecords } from '../src/lib/adminSearch.ts'

const createSearchRequest = (role: 'admin' | 'customer' | 'operator') =>
  ({
    payload: {
      find: async ({ collection }: { collection: string }) => {
        switch (collection) {
          case 'users':
            return { docs: [{ accountStatus: 'active', createdAt: '2026-04-18', creditsBalance: 8, email: 'user@example.com', fullName: 'User A', id: 1, lastActiveAt: '2026-04-18', role: 'customer' }] }
          case 'generation-tasks':
            return { docs: [{ createdAt: '2026-04-18', creditsReserved: 5, creditsSpent: 5, id: 21, inputMode: 'text', provider: 'meshy', providerTaskId: 'provider-task-1', status: 'failed', taskCode: 'TASK-021', updatedAt: '2026-04-18', user: 1 }] }
          case 'shopify-payments':
            return { docs: [{ amount: 19, checkoutReference: 'PAY-1', currency: 'USD', id: 31, paymentType: 'print-order', shopifyCheckoutId: 'cs_123', status: 'paid', updatedAt: '2026-04-18', user: 1 }] }
          case 'print-orders':
            return { docs: [{ amount: 39.9, createdAt: '2026-04-18', id: 41, materialOption: 'resin', orderNumber: 'PO-41', paymentStatus: 'paid', sizeOption: 'standard', status: 'paid', updatedAt: '2026-04-18', user: 1 }] }
          case 'billing-subscriptions':
            return { docs: [{ cancelAtPeriodEnd: false, currentPeriodEnd: '2026-05-01', id: 51, lastGrantedPeriodKey: 'sub_123:1746057600', monthlyCredits: 240, planKey: 'starter', status: 'active', stripeCustomerId: 'cus_123', stripeSubscriptionId: 'sub_123', user: 1 }] }
          case 'credit-transactions':
            return { docs: [{ amount: -2, balanceAfter: 8, createdAt: '2026-04-18', idempotencyKey: 'dl-1', referenceCode: 'TX-1', type: 'download_spend' }] }
          case 'audit-logs':
            return { docs: [{ eventType: 'admin.task.retry', id: 61, operatorId: 1, orderId: null, provider: 'meshy', sessionId: 'cs_123', status: 'completed', taskId: 21, timestamp: '2026-04-18', userId: 1 }] }
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

test('staff can search users and tasks', async () => {
  const req = createSearchRequest('operator')

  const users = await searchAdminRecords({
    domain: 'users',
    req,
    value: 'user@example.com',
  })
  const tasks = await searchAdminRecords({
    domain: 'tasks',
    exact: 'TASK-021',
    req,
  })

  assert.equal(users.docs[0]?.email, 'user@example.com')
  assert.equal(tasks.docs[0]?.taskCode, 'TASK-021')
})

test('staff can perform exact session and order searches', async () => {
  const req = createSearchRequest('operator')

  const payments = await searchAdminRecords({
    domain: 'payments',
    exact: 'cs_123',
    req,
  })
  const orders = await searchAdminRecords({
    domain: 'orders',
    exact: 'PO-41',
    req,
  })

  assert.equal(payments.docs[0]?.shopifyCheckoutId, 'cs_123')
  assert.equal(orders.docs[0]?.orderNumber, 'PO-41')
})

test('customer cannot use admin search', async () => {
  await assert.rejects(
    () =>
      searchAdminRecords({
        domain: 'users',
        req: createSearchRequest('customer'),
      }),
    /Forbidden/,
  )
})

test('staff can export supported admin domains', async () => {
  const req = createSearchRequest('operator')

  const usersCsv = await exportAdminList({ domain: 'users', req })
  const tasksCsv = await exportAdminList({ domain: 'tasks', req })
  const auditCsv = await exportAdminList({ domain: 'audit', req })

  assert.match(usersCsv, /^id,email,fullName,role,accountStatus,creditsBalance,createdAt,lastActiveAt/m)
  assert.match(tasksCsv, /^id,taskCode,user,status,provider,inputMode,creditsReserved,creditsSpent,createdAt,updatedAt/m)
  assert.match(auditCsv, /^eventType,status,userId,operatorId,taskId,orderId,sessionId,provider,timestamp/m)
})
