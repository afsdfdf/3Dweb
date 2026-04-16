/**
 * Token 吊销模块 — 基于 KVStore 抽象层
 *
 * M-05: 生产环境可通过 REDIS_URL 切换到 Redis 共享存储，
 * 解决进程重启后吊销列表丢失的问题。
 */

import { getKVStore } from '@/lib/kvStore'

const KV_PREFIX = 'revoked:'

const decodeJWTPayload = (token: string) => {
  try {
    const [, payload] = token.split('.')
    if (!payload) return null

    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    const json = Buffer.from(normalized, 'base64').toString('utf-8')
    return JSON.parse(json) as Record<string, unknown>
  } catch {
    return null
  }
}

const getTokenExpiry = (token: string) => {
  const payload = decodeJWTPayload(token)
  const exp = Number(payload?.exp)

  if (Number.isFinite(exp) && exp > 0) {
    return exp * 1000
  }

  return Date.now() + 2 * 60 * 60 * 1000
}

export async function revokeToken(token: null | string | undefined): Promise<void> {
  const normalized = String(token || '').trim()
  if (!normalized) return

  const store = getKVStore()
  const expiresAt = getTokenExpiry(normalized)
  const ttlMs = Math.max(1, expiresAt - Date.now())

  await store.set(`${KV_PREFIX}${normalized}`, String(expiresAt), ttlMs)
}

export async function isTokenRevoked(token: null | string | undefined): Promise<boolean> {
  const normalized = String(token || '').trim()
  if (!normalized) return false

  const store = getKVStore()
  const value = await store.get(`${KV_PREFIX}${normalized}`)
  if (!value) return false

  const expiresAt = Number(value)
  if (expiresAt <= Date.now()) {
    await store.delete(`${KV_PREFIX}${normalized}`)
    return false
  }

  return true
}
