import type { PayloadRequest } from 'payload'

import {
  getAllowedOriginsFromEnv,
  getSecuritySettingsSnapshot,
} from '@/lib/securitySettings'
import { isTokenRevoked } from '@/lib/tokenRevocation'

const isProduction = () => process.env.NODE_ENV === 'production'
const isExplicitlyEnabled = (value: string | undefined) => String(value || '').toLowerCase() === 'true'

const normalizeIP = (value: null | string | undefined) => {
  const candidate = String(value || '').split(',')[0]?.trim()
  return candidate || ''
}

const shouldTrustProxyHeaders = () => process.env.TRUST_PROXY_HEADERS === 'true'

const normalizeUserAgent = (value: null | string | undefined) => {
  return String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
}

const normalizeOrigin = (value: null | string | undefined) => {
  if (!value) return ''

  try {
    const url = new URL(value)
    return url.origin.toLowerCase()
  } catch {
    return ''
  }
}

const isLocalDevelopmentOrigin = (origin: string) => {
  if (!origin || isProduction()) return false

  try {
    const { hostname, protocol } = new URL(origin)
    if (protocol !== 'http:' && protocol !== 'https:') return false

    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]'
  } catch {
    return false
  }
}

export async function getAllowedRequestOrigins(payload?: unknown) {
  const allowed = new Set<string>()
  const securitySettings = await getSecuritySettingsSnapshot(payload)
  const explicitOrigins =
    securitySettings.allowedMutationOrigins.length > 0
      ? securitySettings.allowedMutationOrigins
      : getAllowedOriginsFromEnv()

  for (const origin of explicitOrigins) {
    allowed.add(origin)
  }

  for (const fallback of [process.env.CANONICAL_APP_URL, process.env.NEXT_PUBLIC_APP_URL]) {
    const normalized = normalizeOrigin(fallback)
    if (normalized) allowed.add(normalized)
  }

  return Array.from(allowed)
}

export function getRequestOrigin(headers: Headers) {
  const origin = normalizeOrigin(headers.get('origin'))
  if (origin) return origin

  return normalizeOrigin(headers.get('referer'))
}

export async function isAllowedMutationOrigin(args: { headers: Headers; payload?: unknown }) {
  const { headers, payload } = args
  const requestOrigin = getRequestOrigin(headers)

  if (!requestOrigin) {
    return !isProduction()
  }

  if (isLocalDevelopmentOrigin(requestOrigin)) {
    return true
  }

  return (await getAllowedRequestOrigins(payload)).includes(requestOrigin)
}

export async function rejectDisallowedMutationOrigin(req: Pick<PayloadRequest, 'headers'> & { payload?: unknown }) {
  if (await isAllowedMutationOrigin({ headers: req.headers, payload: req.payload })) {
    return null
  }

  return Response.json(
    {
      message: 'Request origin is not allowed.',
    },
    {
      status: 403,
    },
  )
}

export function getRequestIP(headers: Headers) {
  if (shouldTrustProxyHeaders()) {
    const proxyHeaders = [
      headers.get('cf-connecting-ip'),
      headers.get('x-real-ip'),
    ]

    for (const headerValue of proxyHeaders) {
      const normalized = normalizeIP(headerValue)
      if (normalized) {
        return normalized
      }
    }
  }

  return 'unknown'
}

export function getRequestRateLimitKey(headers: Headers) {
  const ip = getRequestIP(headers)
  if (ip !== 'unknown') {
    return `ip:${ip}`
  }

  const userAgent = normalizeUserAgent(headers.get('user-agent'))
  if (userAgent) {
    return `ua:${userAgent}`
  }

  return 'anonymous'
}

export function extractRequestToken(headers: Headers) {
  const authorization = headers.get('authorization') || ''

  if (authorization.startsWith('Bearer ')) {
    return authorization.slice('Bearer '.length).trim()
  }

  if (authorization.startsWith('JWT ')) {
    return authorization.slice('JWT '.length).trim()
  }

  const cookiePrefix = process.env.PAYLOAD_COOKIE_PREFIX || 'payload'
  const cookieHeader = headers.get('cookie') || ''
  const tokenCookieName = `${cookiePrefix}-token=`
  const cookiePair = cookieHeader
    .split(';')
    .map((item) => item.trim())
    .find((item) => item.startsWith(tokenCookieName))

  return cookiePair ? cookiePair.slice(tokenCookieName.length) : ''
}

export async function rejectRevokedToken(req: Pick<PayloadRequest, 'headers'>) {
  const token = extractRequestToken(req.headers)

  if (!token || !(await isTokenRevoked(token))) {
    return null
  }

  return Response.json(
    {
      message: 'This session has been revoked. Please sign in again.',
    },
    {
      status: 401,
    },
  )
}

export function containsGraphQLIntrospectionQuery(body: string) {
  return body.includes('__schema') || body.includes('__type')
}

export function isGraphQLIntrospectionEnabled() {
  return isExplicitlyEnabled(process.env.ENABLE_GRAPHQL_INTROSPECTION)
}

export function isGraphQLPlaygroundEnabled() {
  return isExplicitlyEnabled(process.env.ENABLE_GRAPHQL_PLAYGROUND)
}

export function isPublicAccessEndpointEnabled() {
  return isExplicitlyEnabled(process.env.ENABLE_PUBLIC_ACCESS_ENDPOINT)
}

export function applySecurityHeaders(headers: Headers) {
  headers.set('X-Content-Type-Options', 'nosniff')
  headers.set('X-Frame-Options', 'DENY')
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()')

  const contentSecurityPolicy = isProduction()
    ? [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https://cdn.jsdelivr.net",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob: https:",
        "connect-src 'self' blob: https:",
        "font-src 'self' data: https:",
        "media-src 'self' blob: https:",
        "worker-src 'self' blob: https://cdn.jsdelivr.net",
        "object-src 'none'",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ].join('; ')
    : [
        "default-src 'self' data: blob: https: http:",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://cdn.jsdelivr.net",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob: https: http:",
        "connect-src 'self' blob: https: http: ws: wss:",
        "font-src 'self' data: https:",
        "media-src 'self' blob: https: http:",
        "worker-src 'self' blob: https://cdn.jsdelivr.net",
        "object-src 'none'",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ].join('; ')

  headers.set('Content-Security-Policy', contentSecurityPolicy)

  if (isProduction()) {
    headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
  }
}
