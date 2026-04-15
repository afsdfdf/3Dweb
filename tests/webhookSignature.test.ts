import test from 'node:test'
import assert from 'node:assert/strict'

import { signWebhookPayload, verifyWebhookSignature } from '../src/lib/webhookSignature.ts'

test('webhook signature verification succeeds for valid payload', () => {
  const payload = JSON.stringify({ providerTaskId: 'task_123', status: 'SUCCEEDED' })
  const secret = 'test-secret'
  const timestamp = String(Math.floor(Date.now() / 1000))
  const signature = signWebhookPayload({ payload, secret, timestamp })

  const result = verifyWebhookSignature({
    payload,
    secret,
    signature,
    timestamp,
  })

  assert.deepEqual(result, { ok: true })
})

test('webhook signature verification rejects expired payloads', () => {
  const payload = JSON.stringify({ providerTaskId: 'task_123' })
  const secret = 'test-secret'
  const timestamp = '1'
  const signature = signWebhookPayload({ payload, secret, timestamp })

  const result = verifyWebhookSignature({
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

test('webhook signature verification rejects replayed requests', () => {
  const payload = JSON.stringify({ providerTaskId: 'task_123', status: 'processing' })
  const secret = 'test-secret'
  const timestamp = String(Math.floor(Date.now() / 1000))
  const signature = signWebhookPayload({ payload, secret, timestamp })

  const first = verifyWebhookSignature({
    payload,
    secret,
    signature,
    timestamp,
  })

  assert.deepEqual(first, { ok: true })

  const replay = verifyWebhookSignature({
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
