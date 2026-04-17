import assert from 'node:assert/strict'
import test from 'node:test'

import { writeAuditLog } from '../src/lib/auditLog.ts'

test('writeAuditLog emits structured info entries', () => {
  const entries: Array<Record<string, unknown>> = []
  const req = {
    payload: {
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
})

test('writeAuditLog becomes a no-op when the logger level is unavailable', () => {
  const req = {
    payload: {
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
})
