import test from 'node:test'
import assert from 'node:assert/strict'

import { MemoryKVStore } from '../src/lib/kvStore.ts'
import { signWebhookPayload, verifyWebhookSignature } from '../src/lib/webhookSignature.ts'

test('setIfAbsent only succeeds for the first claim of a key', async () => {
  const store = new MemoryKVStore()

  const first = await store.setIfAbsent('once:key', 'a', 60_000)
  const second = await store.setIfAbsent('once:key', 'b', 60_000)

  assert.equal(first, true)
  assert.equal(second, false)
  // The original value is preserved; the losing claim does not overwrite it.
  assert.equal(await store.get('once:key'), 'a')
})

test('setIfAbsent allows reclaiming a key after it expires', async () => {
  const store = new MemoryKVStore()

  assert.equal(await store.setIfAbsent('ttl:key', 'a', 5), true)
  await new Promise((resolve) => setTimeout(resolve, 12))
  assert.equal(await store.setIfAbsent('ttl:key', 'b', 5), true)
})

test('concurrent identical webhooks: exactly one wins the replay race', async () => {
  const payload = JSON.stringify({ providerTaskId: 'task_race', status: 'SUCCEEDED' })
  const secret = 'test-secret'
  const timestamp = String(Math.floor(Date.now() / 1000))
  const signature = signWebhookPayload({ payload, secret, timestamp })

  const results = await Promise.all(
    Array.from({ length: 5 }, () => verifyWebhookSignature({ payload, secret, signature, timestamp })),
  )

  const accepted = results.filter((result) => result.ok)
  const replays = results.filter((result) => !result.ok && result.code === 'REPLAY')

  assert.equal(accepted.length, 1)
  assert.equal(replays.length, 4)
})
