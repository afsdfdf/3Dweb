import type { PayloadRequest } from 'payload'

const isProduction = () => process.env.NODE_ENV === 'production'

const normalizeOrigin = (value: null | string | undefined) => {
  if (!value) return ''

  try {
    const url = new URL(value)
    return url.origin.toLowerCase()
  } catch {
    return ''
  }
}

export function getAllowedRequestOrigins() {
  const allowed = new Set<string>()
  const configured = (process.env.ALLOWED_REQUEST_ORIGINS || '').trim()

  for (const value of configured.split(',').map((item) => item.trim()).filter(Boolean)) {
    const normalized = normalizeOrigin(value)
    if (normalized) allowed.add(normalized)
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

export function isAllowedMutationOrigin(headers: Headers) {
  const requestOrigin = getRequestOrigin(headers)

  if (!requestOrigin) {
    return !isProduction()
  }

  return getAllowedRequestOrigins().includes(requestOrigin)
}

export function rejectDisallowedMutationOrigin(req: Pick<PayloadRequest, 'headers'>) {
  if (isAllowedMutationOrigin(req.headers)) {
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
  const forwarded = headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() || 'unknown'
  }

  return headers.get('x-real-ip') || headers.get('cf-connecting-ip') || 'unknown'
}

export function containsGraphQLIntrospectionQuery(body: string) {
  return body.includes('__schema') || body.includes('__type')
}

export function applySecurityHeaders(headers: Headers) {
  headers.set('X-Content-Type-Options', 'nosniff')
  headers.set('X-Frame-Options', 'DENY')
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()')

  const contentSecurityPolicy = isProduction()
    ? [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob: https:",
        "connect-src 'self' https:",
        "font-src 'self' data: https:",
        "media-src 'self' blob: https:",
        "object-src 'none'",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ].join('; ')
    : [
        "default-src 'self' data: blob: https: http:",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob: https: http:",
        "connect-src 'self' https: http: ws: wss:",
        "font-src 'self' data: https:",
        "media-src 'self' blob: https: http:",
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

