import assert from 'node:assert/strict'
import test from 'node:test'

import {
  getCachedPayload,
  __setGetCachedPayloadTestHooks,
} from '../src/lib/getCachedPayload.ts'

test('getCachedPayload shares successful initialization and caches the payload', async () => {
  let calls = 0
  const payload = { id: 'payload' }

  __setGetCachedPayloadTestHooks({
    getPayload: async () => {
      calls += 1
      return payload as never
    },
  })

  try {
    const [first, second] = await Promise.all([getCachedPayload(), getCachedPayload()])

    assert.equal(first, payload)
    assert.equal(second, payload)
    assert.equal(calls, 1)

    const third = await getCachedPayload()
    assert.equal(third, payload)
    assert.equal(calls, 1)
  } finally {
    __setGetCachedPayloadTestHooks(null)
  }
})

test('getCachedPayload throttles reconnect attempts briefly after a failure', async () => {
  let calls = 0
  let now = 1_000
  const failure = new Error('database unavailable')
  const payload = { id: 'payload-after-retry' }

  __setGetCachedPayloadTestHooks({
    failureBackoffMs: 500,
    getPayload: async () => {
      calls += 1
      if (calls === 1) {
        throw failure
      }

      return payload as never
    },
    now: () => now,
  })

  try {
    await assert.rejects(getCachedPayload(), /database unavailable/)
    assert.equal(calls, 1)

    await assert.rejects(getCachedPayload(), /database unavailable/)
    assert.equal(calls, 1)

    now += 501

    const retried = await getCachedPayload()
    assert.equal(retried, payload)
    assert.equal(calls, 2)
  } finally {
    __setGetCachedPayloadTestHooks(null)
  }
})
