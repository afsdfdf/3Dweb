import test from 'node:test'
import assert from 'node:assert/strict'

import { signWebhookPayload, verifyWebhookSignature } from '../src/lib/webhookSignature.ts'

test('webhook signature verification succeeds for valid payload', async () => {
  const payload = JSON.stringify({ providerTaskId: 'task_123', status: 'SUCCEEDED' })
  const secret = 'test-secret'
  const timestamp = String(Math.floor(Date.now() / 1000))
  const signature = signWebhookPayload({ payload, secret, timestamp })

  const result = await verifyWebhookSignature({
    payload,
    secret,
    signature,
    timestamp,
  })

  assert.deepEqual(result, { ok: true })
})

test('webhook signature verification rejects expired payloads', async () => {
  const payload = JSON.stringify({ providerTaskId: 'task_123' })
  const secret = 'test-secret'
  const timestamp = '1'
  const signature = signWebhookPayload({ payload, secret, timestamp })

  const result = await verifyWebhookSignature({
    payload,
    secret,
    signature,
    timestamp,
  })

  assert.equal(result.ok, false)
  if (!result.ok) {
    assert.equal(result.code, 'EXPIRED')
  }
})

test('webhook signature verification rejects replayed requests', async () => {
  const payload = JSON.stringify({ providerTaskId: 'task_123', status: 'processing' })
  const secret = 'test-secret'
  const timestamp = String(Math.floor(Date.now() / 1000))
  const signature = signWebhookPayload({ payload, secret, timestamp })

  const first = await verifyWebhookSignature({
    payload,
    secret,
    signature,
    timestamp,
  })

  assert.deepEqual(first, { ok: true })

  const replay = await verifyWebhookSignature({
    payload,
    secret,
    signature,
    timestamp,
  })

  assert.equal(replay.ok, false)
  if (!replay.ok) {
    assert.equal(replay.code, 'REPLAY')
  }
})

test('webhook signature verification rejects missing secret', async () => {
  const result = await verifyWebhookSignature({
    payload: '{}',
    secret: '',
    signature: 'abc',
    timestamp: String(Math.floor(Date.now() / 1000)),
  })

  assert.equal(result.ok, false)
  if (!result.ok) {
    assert.equal(result.code, 'MISSING_SECRET')
  }
})

test('webhook signature verification rejects missing signature or timestamp', async () => {
  const result = await verifyWebhookSignature({
    payload: '{}',
    secret: 'test-secret',
    signature: '',
    timestamp: '',
  })

  assert.equal(result.ok, false)
  if (!result.ok) {
    assert.equal(result.code, 'MISSING_SIGNATURE')
  }
})

test('webhook signature verification rejects malformed timestamp', async () => {
  const result = await verifyWebhookSignature({
    payload: '{}',
    secret: 'test-secret',
    signature: 'abc',
    timestamp: 'not-a-number',
  })

  assert.equal(result.ok, false)
  if (!result.ok) {
    assert.equal(result.code, 'MALFORMED_TIMESTAMP')
  }
})
