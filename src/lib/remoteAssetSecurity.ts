import type { Payload } from 'payload'

import { getCanonicalAppURL } from '@/lib/getCanonicalAppURL'
import { getS3StorageSettings } from '@/lib/s3Settings'

const toHostPatterns = (value: string) => {
  return value
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
}

const matchesHostPattern = (hostname: string, pattern: string) => {
  return hostname === pattern || hostname.endsWith(`.${pattern}`)
}

const tryGetHostname = (value: string) => {
  try {
    return new URL(value).hostname.toLowerCase()
  } catch {
    return ''
  }
}

const toRecord = (value: unknown): Record<string, unknown> => {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {}
}

const readSecuritySettings = async (payload: Payload) => {
  if (typeof payload?.findGlobal !== 'function') {
    return null
  }

  return payload
    .findGlobal({
      overrideAccess: true,
      slug: 'security-settings' as never,
    })
    .catch(() => null)
}

export async function getAllowedRemoteAssetHosts(payload: Payload) {
  const settings = await getS3StorageSettings(payload)
  const securitySettings = await readSecuritySettings(payload)
  const allowedHosts = new Set<string>()
  const canonicalHost = tryGetHostname(getCanonicalAppURL())

  if (canonicalHost) {
    allowedHosts.add(canonicalHost)
  }

  if (settings.bucket && settings.region) {
    allowedHosts.add(`${settings.bucket}.s3.${settings.region}.amazonaws.com`.toLowerCase())
  }

  const storageBaseHost = tryGetHostname(settings.baseURL)
  if (storageBaseHost) {
    allowedHosts.add(storageBaseHost)
  }

  const configuredHosts = Array.isArray(toRecord(securitySettings).allowedRemoteAssetHosts)
    ? (toRecord(securitySettings).allowedRemoteAssetHosts as unknown[])
    : []

  for (const item of configuredHosts) {
    const host = String(toRecord(item).host || '').trim().toLowerCase()
    if (host) {
      allowedHosts.add(host)
    }
  }

  for (const pattern of toHostPatterns(process.env.AI_REMOTE_ASSET_ALLOWLIST || '')) {
    allowedHosts.add(pattern)
  }

  return Array.from(allowedHosts)
}

export async function isAllowedRemoteAssetURL(args: { payload: Payload; url: string }) {
  const value = String(args.url || '').trim()
  if (!value) return false

  if (value.startsWith('/')) {
    return true
  }

  let hostname = ''
  try {
    hostname = new URL(value).hostname.toLowerCase()
  } catch {
    return false
  }

  const allowedHosts = await getAllowedRemoteAssetHosts(args.payload)
  return allowedHosts.some((pattern) => matchesHostPattern(hostname, pattern))
}
