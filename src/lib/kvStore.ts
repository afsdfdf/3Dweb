/**
 * M-04/M-05: 共享 KV 存储抽象层
 *
 * 为速率限制、Token 吊销、Webhook 重放检测提供统一的存储接口。
 * 默认使用进程内存，生产环境可通过 REDIS_URL 环境变量切换到 Redis。
 *
 * 设计原则：
 * - 接口极简：get / set / delete / has / cleanup
 * - 自动过期：set 时指定 TTL（毫秒），过期条目在 cleanup 时自动清除
 * - 零依赖：内存实现不引入任何外部包，Redis 实现可选
 */

export interface KVStore {
  get(key: string): Promise<string | null>
  set(key: string, value: string, ttlMs?: number): Promise<void>
  delete(key: string): Promise<void>
  has(key: string): Promise<boolean>
  /** 清理所有已过期条目 */
  cleanup(): Promise<void>
}

// ────────────────────────────────────────────
// 内存实现（默认，开发 & 单实例部署）
// ────────────────────────────────────────────

type MemEntry = {
  value: string
  expiresAt: number | null // null = 永不过期
}

export class MemoryKVStore implements KVStore {
  private store = new Map<string, MemEntry>()

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

  async cleanup(): Promise<void> {
    const now = Date.now()
    for (const [key, entry] of this.store.entries()) {
      if (entry.expiresAt && entry.expiresAt <= now) {
        this.store.delete(key)
      }
    }
  }
}

// ────────────────────────────────────────────
// Redis 实现（可选，多实例生产部署）
// ────────────────────────────────────────────

export class RedisKVStore implements KVStore {
  private client: any // ioredis 或 node-redis 实例

  constructor(client: any) {
    this.client = client
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key)
  }

  async set(key: string, value: string, ttlMs?: number): Promise<void> {
    if (ttlMs) {
      // PX = 毫秒级 TTL（Redis SET 命令）
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

  async cleanup(): Promise<void> {
    // Redis 自动过期，无需手动清理
  }
}

// ────────────────────────────────────────────
// 单例工厂
// ────────────────────────────────────────────

let _instance: KVStore | null = null

/**
 * 获取全局 KV 存储实例。
 * - 无 REDIS_URL → 使用内存实现
 * - 有 REDIS_URL → 尝试连接 Redis（需安装 ioredis）
 *
 * 注意：Redis 连接是延迟的，只在首次调用时初始化。
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
        '[kvStore] REDIS_URL is set but ioredis is not installed. Falling back to memory store. ' +
          'Run `pnpm add ioredis` to enable Redis-backed storage.',
      )
    }
  }

  _instance = new MemoryKVStore()
  return _instance
}

/**
 * 仅用于测试：重置单例以切换存储后端
 */
export function _resetKVStore(): void {
  _instance = null
}
