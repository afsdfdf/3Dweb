import type { Payload } from 'payload'

import { getCanonicalAppURL } from '@/lib/getCanonicalAppURL'
import { getAllowedRemoteAssetHostsFromEnv, getSecuritySettingsSnapshot } from '@/lib/securitySettings'
import { getObjectStorageSettings } from '@/lib/storageSettings'

// Only same-origin Payload media paths are ever fetched via an internal
// ("/"-relative) asset URL. Anything else is rejected to prevent SSRF into
// arbitrary internal routes.
const INTERNAL_MEDIA_PATH_PREFIX = '/api/media/'

// A usable allowlist entry must be a multi-label hostname. Bare TLDs ("com",
// "ai") or empty/garbage entries are rejected so a misconfiguration cannot
// match huge swaths of the internet via the suffix rule below.
const isValidHostPattern = (pattern: string) => {
  if (!pattern || pattern.includes('/') || pattern.includes(' ')) return false
  const labels = pattern.split('.')
  if (labels.length < 2) return false
  return labels.every((label) => label.length > 0)
}

const matchesHostPattern = (hostname: string, pattern: string) => {
  if (!isValidHostPattern(pattern)) return false
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
    if (isValidHostPattern(pattern)) {
      allowedHosts.add(pattern)
    }
  }

  return Array.from(allowedHosts)
}

export async function isAllowedRemoteAssetURL(args: { payload: Payload; url: string }) {
  const value = String(args.url || '').trim()
  if (!value) return false

  if (value.startsWith('/')) {
    // Protocol-relative ("//host") and backslash ("/\\host") values normalize to
    // an arbitrary host in browsers and the URL parser — never treat them as
    // internal/same-origin.
    if (value.startsWith('//') || value.startsWith('/\\')) return false

    // Resolve against a fixed dummy base so path traversal
    // ("/api/media/../admin") cannot escape the allowed media prefix.
    let resolvedPath = ''
    try {
      resolvedPath = new URL(value, 'http://internal.invalid').pathname
    } catch {
      return false
    }

    return resolvedPath.startsWith(INTERNAL_MEDIA_PATH_PREFIX)
  }

  let parsed: URL
  try {
    parsed = new URL(value)
  } catch {
    return false
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return false
  }

  const hostname = parsed.hostname.toLowerCase()
  const allowedHosts = await getAllowedRemoteAssetHosts(args.payload)
  return allowedHosts.some((pattern) => matchesHostPattern(hostname, pattern))
}
