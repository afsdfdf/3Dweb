import assert from 'node:assert/strict'
import test from 'node:test'

import { _resetKVStore, getKVStore } from '../src/lib/kvStore.ts'

test('production deployments can explicitly require Redis-backed KV storage', () => {
  const previousNodeEnv = process.env.NODE_ENV
  const previousRedisURL = process.env.REDIS_URL
  const previousRequireRedis = process.env.REQUIRE_REDIS_IN_PRODUCTION

  process.env.NODE_ENV = 'production'
  process.env.REQUIRE_REDIS_IN_PRODUCTION = 'true'
  delete process.env.REDIS_URL
  _resetKVStore()

  try {
    assert.throws(() => getKVStore(), /REDIS_URL.*REQUIRE_REDIS_IN_PRODUCTION/i)
  } finally {
    _resetKVStore()

    if (previousNodeEnv === undefined) {
      delete process.env.NODE_ENV
    } else {
      process.env.NODE_ENV = previousNodeEnv
    }

    if (previousRedisURL === undefined) {
      delete process.env.REDIS_URL
    } else {
      process.env.REDIS_URL = previousRedisURL
    }

    if (previousRequireRedis === undefined) {
      delete process.env.REQUIRE_REDIS_IN_PRODUCTION
    } else {
      process.env.REQUIRE_REDIS_IN_PRODUCTION = previousRequireRedis
    }
  }
})
