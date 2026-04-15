import test from 'node:test'
import assert from 'node:assert/strict'

import { enforceRateLimit, getRateLimitConfig } from '../src/lib/rateLimit.ts'

test('enforceRateLimit allows requests within the window and blocks overflow', () => {
  const first = enforceRateLimit({
    key: 'unit-rate-limit',
    limit: 2,
    windowMs: 10_000,
  })
  const second = enforceRateLimit({
    key: 'unit-rate-limit',
    limit: 2,
    windowMs: 10_000,
  })
  const third = enforceRateLimit({
    key: 'unit-rate-limit',
    limit: 2,
    windowMs: 10_000,
  })

  assert.equal(first.allowed, true)
  assert.equal(second.allowed, true)
  assert.equal(third.allowed, false)
})

test('getRateLimitConfig falls back safely when env values are invalid', () => {
  const previousLimit = process.env.TEST_LIMIT
  const previousWindow = process.env.TEST_WINDOW

  process.env.TEST_LIMIT = 'invalid'
  process.env.TEST_WINDOW = '-1'

  try {
    const config = getRateLimitConfig({
      fallbackLimit: 5,
      fallbackWindowMs: 60_000,
      limitEnv: 'TEST_LIMIT',
      windowEnv: 'TEST_WINDOW',
    })

    assert.deepEqual(config, {
      limit: 5,
      windowMs: 60_000,
    })
  } finally {
    process.env.TEST_LIMIT = previousLimit
    process.env.TEST_WINDOW = previousWindow
  }
})

