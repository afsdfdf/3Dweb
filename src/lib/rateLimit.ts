type RateLimitEntry = {
  count: number
  resetAt: number
}

const bucket = new Map<string, RateLimitEntry>()

const now = () => Date.now()

const cleanupExpiredEntries = (currentTime: number) => {
  for (const [key, entry] of bucket.entries()) {
    if (entry.resetAt <= currentTime) {
      bucket.delete(key)
    }
  }
}

export function enforceRateLimit(args: {
  key: string
  limit: number
  windowMs: number
}) {
  const currentTime = now()
  cleanupExpiredEntries(currentTime)

  const existing = bucket.get(args.key)

  if (!existing || existing.resetAt <= currentTime) {
    const nextEntry = {
      count: 1,
      resetAt: currentTime + args.windowMs,
    }
    bucket.set(args.key, nextEntry)
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
  bucket.set(args.key, existing)

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

