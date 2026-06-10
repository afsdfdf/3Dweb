/**
 * Shared KV storage abstraction used by rate limits, token revocation, and webhook replay protection.
 *
 * Default behavior uses in-memory storage. Production deployments can switch to Redis
 * through REDIS_URL.
 *
 * Design principles:
 * - keep the interface minimal: get / set / delete / has / cleanup
 * - support TTL-based expiry
 * - keep the in-memory implementation dependency free
 */

export interface KVStore {
  get(key: string): Promise<string | null>
  set(key: string, value: string, ttlMs?: number): Promise<void>
  delete(key: string): Promise<void>
  has(key: string): Promise<boolean>
  /**
   * Atomically increment a counter key and return the new value.
   * The TTL is applied only when the increment creates the key, so the
   * window of an existing counter is never extended.
   */
  increment(key: string, ttlMs: number): Promise<number>
  /** Remove all expired entries. */
  cleanup(): Promise<void>
}

// In-memory implementation used for development and single-instance deployments.

type MemEntry = {
  value: string
  expiresAt: number | null // null means no expiry
}

const MEMORY_CLEANUP_INTERVAL_MS = 60 * 1000

export class MemoryKVStore implements KVStore {
  private store = new Map<string, MemEntry>()
  private lastCleanupAt = 0

  async get(key: string): Promise<string | null> {
    const entry = this.store.get(key)
    if (!entry) return null
    if (entry.expiresAt && entry.expiresAt <= Date.now()) {
      this.store.delete(key)
      return null
    }
    return entry.value
  }

  async set(key: string, value: string, ttlMs?: number): Promise<void> {
    this.store.set(key, {
      value,
      expiresAt: ttlMs ? Date.now() + ttlMs : null,
    })
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key)
  }

  async has(key: string): Promise<boolean> {
    const val = await this.get(key)
    return val !== null
  }

  async increment(key: string, ttlMs: number): Promise<number> {
    // Node is single-threaded, so read-modify-write within one tick is atomic.
    const current = await this.get(key)
    const next = (current ? Number(current) || 0 : 0) + 1

    if (current === null) {
      this.store.set(key, { value: String(next), expiresAt: Date.now() + ttlMs })
    } else {
      const entry = this.store.get(key)!
      entry.value = String(next)
    }

    return next
  }

  async cleanup(): Promise<void> {
    const now = Date.now()

    // Full-map sweeps are O(n); throttle so hot paths do not pay the cost per request.
    if (now - this.lastCleanupAt < MEMORY_CLEANUP_INTERVAL_MS) {
      return
    }
    this.lastCleanupAt = now

    for (const [key, entry] of this.store.entries()) {
      if (entry.expiresAt && entry.expiresAt <= now) {
        this.store.delete(key)
      }
    }
  }
}

// Redis implementation for multi-instance production deployments.

export class RedisKVStore implements KVStore {
  private client: any // ioredis or node-redis instance

  constructor(client: any) {
    this.client = client
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key)
  }

  async set(key: string, value: string, ttlMs?: number): Promise<void> {
    if (ttlMs) {
      // PX configures millisecond-level TTL in Redis SET.
      await this.client.set(key, value, 'PX', ttlMs)
    } else {
      await this.client.set(key, value)
    }
  }

  async delete(key: string): Promise<void> {
    await this.client.del(key)
  }

  async has(key: string): Promise<boolean> {
    const result = await this.client.exists(key)
    return result === 1
  }

  async increment(key: string, ttlMs: number): Promise<number> {
    // INCR is atomic in Redis; apply the TTL only on first creation so the
    // counting window is never extended by subsequent hits.
    const next = await this.client.incr(key)
    if (next === 1) {
      await this.client.pexpire(key, ttlMs)
    }
    return next
  }

  async cleanup(): Promise<void> {
    // Redis handles TTL expiry automatically.
  }
}

// Singleton factory.

let _instance: KVStore | null = null

/**
 * Return the shared KV store instance.
 * - without REDIS_URL: use the in-memory implementation
 * - with REDIS_URL: try to connect to Redis
 *
 * Redis initialization is lazy and happens on first use.
 */
export function getKVStore(): KVStore {
  if (_instance) return _instance

  const redisUrl = process.env.REDIS_URL?.trim()
  if (redisUrl) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const Redis = require('ioredis')
      const client = new Redis(redisUrl)
      _instance = new RedisKVStore(client)
      return _instance
    } catch {
      console.warn(
        '[kvStore] REDIS_URL is set but ioredis is not installed. Falling back to memory store. Run `pnpm add ioredis` to enable Redis-backed storage.',
      )
    }
  }

  _instance = new MemoryKVStore()
  return _instance
}

/**
 * Test-only helper to reset the singleton instance.
 */
export function _resetKVStore(): void {
  _instance = null
}
