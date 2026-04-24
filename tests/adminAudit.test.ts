import assert from 'node:assert/strict'
import test from 'node:test'

import { exportAuditLogDetail, exportAuditLogs } from '../src/lib/adminAudit.ts'

const createAuditRequest = (role: 'admin' | 'customer' | 'operator') =>
  ({
    payload: {
      find: async () => ({
        docs: [
          {
            eventType: 'admin.task.retry',
            operatorId: 1,
            orderId: null,
            provider: 'meshy',
            sessionId: '',
            status: 'completed',
            taskId: 21,
            timestamp: '2026-04-18T00:00:00.000Z',
            userId: 9,
          },
        ],
      }),
      findByID: async () => ({
        details: { reason: 'manual retry' },
        eventType: 'admin.task.retry',
        id: 7,
        status: 'completed',
      }),
    },
    user: {
      id: 1,
      role,
    },
  }) as never

test('staff can export audit log list as CSV', async () => {
  const csv = await exportAuditLogs({
    req: createAuditRequest('operator'),
  })

  assert.match(csv, /^eventType,status,userId,operatorId,taskId,orderId,sessionId,provider,timestamp/m)
  assert.match(csv, /admin\.task\.retry,completed,9,1,21/)
})

test('staff can export audit log detail as JSON', async () => {
  const payload = await exportAuditLogDetail({
    id: 7,
    req: createAuditRequest('operator'),
  })

  const parsed = JSON.parse(payload)
  assert.equal(parsed.eventType, 'admin.task.retry')
  assert.equal(parsed.details.reason, 'manual retry')
})

test('customer cannot export audit logs', async () => {
  await assert.rejects(() => exportAuditLogs({ req: createAuditRequest('customer') }), /Forbidden/)
  await assert.rejects(() => exportAuditLogDetail({ id: 7, req: createAuditRequest('customer') }), /Forbidden/)
})
