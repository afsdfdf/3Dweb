import type { Payload } from 'payload'

import { getCanonicalAppURL } from '@/lib/getCanonicalAppURL'
import { getAllowedRemoteAssetHostsFromEnv, getSecuritySettingsSnapshot } from '@/lib/securitySettings'
import { getObjectStorageSettings } from '@/lib/storageSettings'

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

export async function getAllowedRemoteAssetHosts(payload: Payload) {
  const settings = await getObjectStorageSettings(payload)
  const securitySettings = await getSecuritySettingsSnapshot(payload)
  const allowedHosts = new Set<string>()
  const canonicalHost = tryGetHostname(getCanonicalAppURL())
  const meshyApiHost = tryGetHostname(process.env.MESHY_API_BASE_URL || '')
  const supabaseHost = tryGetHostname(process.env.SUPABASE_URL || '')

  if (canonicalHost) {
    allowedHosts.add(canonicalHost)
  }

  const storageBaseHost = tryGetHostname(settings.baseURL)
  if (storageBaseHost) {
    allowedHosts.add(storageBaseHost)
  }

  if (supabaseHost) {
    allowedHosts.add(supabaseHost)
  }

  if (meshyApiHost) {
    allowedHosts.add(meshyApiHost)
  }

  allowedHosts.add('assets.meshy.ai')

  const explicitHosts =
    securitySettings.allowedRemoteAssetHosts.length > 0
      ? securitySettings.allowedRemoteAssetHosts
      : getAllowedRemoteAssetHostsFromEnv()

  for (const pattern of explicitHosts) {
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
