import assert from 'node:assert/strict'
import test from 'node:test'

import { writeAuditLog } from '../src/lib/auditLog.ts'

test('writeAuditLog emits structured info entries', () => {
  const entries: Array<Record<string, unknown>> = []
  const created: Array<Record<string, unknown>> = []
  const req = {
    payload: {
      create(entry: Record<string, unknown>) {
        created.push(entry)
        return Promise.resolve(entry)
      },
      logger: {
        info(entry: Record<string, unknown>) {
          entries.push(entry)
        },
      },
    },
  } as never

  writeAuditLog({
    details: { example: true },
    eventType: 'stripe.webhook',
    orderId: 12,
    provider: 'stripe',
    req,
    sessionId: 'cs_test_123',
    status: 'completed',
    userId: 7,
  })

  assert.equal(entries.length, 1)
  assert.equal(entries[0]?.audit, true)
  assert.equal(entries[0]?.eventType, 'stripe.webhook')
  assert.equal(entries[0]?.status, 'completed')
  assert.equal(entries[0]?.orderId, 12)
  assert.equal(entries[0]?.sessionId, 'cs_test_123')
  assert.equal(entries[0]?.provider, 'stripe')
  assert.equal(entries[0]?.userId, 7)
  assert.equal(typeof entries[0]?.timestamp, 'string')
  assert.equal(created.length, 1)
  assert.equal(created[0]?.collection, 'audit-logs')
})

test('writeAuditLog still persists audit records when the logger level is unavailable', async () => {
  const created: Array<Record<string, unknown>> = []
  const req = {
    payload: {
      create(entry: Record<string, unknown>) {
        created.push(entry)
        return Promise.resolve(entry)
      },
      logger: {},
    },
  } as never

  assert.doesNotThrow(() =>
    writeAuditLog({
      eventType: 'ai.webhook.processing',
      req,
      status: 'failed',
    }),
  )

  await new Promise((resolve) => setImmediate(resolve))

  assert.equal(created.length, 1)
  assert.equal(created[0]?.collection, 'audit-logs')
  assert.equal((created[0]?.data as Record<string, unknown>)?.eventType, 'ai.webhook.processing')
})
