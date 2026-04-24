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

type RateLimitEntry = {
  count: number
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

  // Periodically clean up expired keys in the active KV backend.
  await store.cleanup()

  const raw = await store.get(kvKey)
  const existing: RateLimitEntry | null = raw ? JSON.parse(raw) : null
  const now = Date.now()

  if (!existing || existing.resetAt <= now) {
    const nextEntry: RateLimitEntry = {
      count: 1,
      resetAt: now + args.windowMs,
    }
    await store.set(kvKey, JSON.stringify(nextEntry), args.windowMs)
    return {
      allowed: true,
      remaining: Math.max(0, args.limit - 1),
      resetAt: nextEntry.resetAt,
    }
  }

  if (existing.count >= args.limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: existing.resetAt,
    }
  }

  existing.count += 1
  const ttlMs = Math.max(1, existing.resetAt - now)
  await store.set(kvKey, JSON.stringify(existing), ttlMs)

  return {
    allowed: true,
    remaining: Math.max(0, args.limit - existing.count),
    resetAt: existing.resetAt,
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
