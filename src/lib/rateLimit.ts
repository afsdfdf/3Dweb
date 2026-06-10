/**
 * Rate-limit module built on top of the shared KVStore abstraction.
 *
 * Production deployments can switch to Redis through REDIS_URL so limits are shared
 * across multiple instances and survive container restarts.
 */

import { getKVStore } from '@/lib/kvStore'

type RateLimitResult = {
  allowed: boolean
  remaining: number
  resetAt: number
}

const KV_PREFIX = 'ratelimit:'

export async function enforceRateLimit(args: {
  key: string
  limit: number
  windowMs: number
}): Promise<RateLimitResult> {
  const store = getKVStore()
  const kvKey = `${KV_PREFIX}${args.key}`
  const now = Date.now()
  const resetAt = now + args.windowMs

  try {
    // Periodically clean up expired keys in the active KV backend (throttled internally).
    await store.cleanup()

    // Atomic increment prevents the read-modify-write race that previously let
    // concurrent requests slip past the limit. The key's TTL bounds the window,
    // so resetAt reported here is the conservative upper bound.
    const count = await store.increment(kvKey, args.windowMs)

    if (count > args.limit) {
      return {
        allowed: false,
        remaining: 0,
        resetAt,
      }
    }

    return {
      allowed: true,
      remaining: Math.max(0, args.limit - count),
      resetAt,
    }
  } catch (error) {
    // Fail open: if the KV backend (e.g. Redis) is unavailable, allow the
    // request rather than hanging or blocking every rate-limited endpoint.
    // Availability is prioritized over strict limiting during an outage.
    console.warn('[rateLimit] KV backend error, allowing request:', error instanceof Error ? error.message : error)
    return {
      allowed: true,
      remaining: args.limit,
      resetAt,
    }
  }
}

export function getRateLimitConfig(args: {
  fallbackLimit: number
  fallbackWindowMs: number
  limitEnv: string
  windowEnv: string
}) {
  const parsedLimit = Number(process.env[args.limitEnv] || args.fallbackLimit)
  const parsedWindow = Number(process.env[args.windowEnv] || args.fallbackWindowMs)

  return {
    limit: Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : args.fallbackLimit,
    windowMs: Number.isFinite(parsedWindow) && parsedWindow > 0 ? parsedWindow : args.fallbackWindowMs,
  }
}
