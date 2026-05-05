import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { enforceRateLimit, getRateLimitConfig } from './lib/rateLimit'
import { applySecurityHeaders, extractRequestToken } from './lib/requestSecurity'
import { getAllowedOriginsFromEnv } from './lib/securitySettings'
import { isTokenRevoked } from './lib/tokenRevocation'

const cookiePrefix = process.env.PAYLOAD_COOKIE_PREFIX || 'payload'
const authCookieName = `${cookiePrefix}-token`
const languageCookieName = `${cookiePrefix}-lng`

const registrationRateLimit = getRateLimitConfig({
  fallbackLimit: 5,
  fallbackWindowMs: 60 * 60 * 1000,
  limitEnv: 'REGISTER_RATE_LIMIT_MAX',
  windowEnv: 'REGISTER_RATE_LIMIT_WINDOW_MS',
})

const loginRateLimit = getRateLimitConfig({
  fallbackLimit: 5,
  fallbackWindowMs: 15 * 60 * 1000,
  limitEnv: 'LOGIN_RATE_LIMIT_MAX',
  windowEnv: 'LOGIN_RATE_LIMIT_WINDOW_MS',
})

const graphQLRateLimit = getRateLimitConfig({
  fallbackLimit: 20,
  fallbackWindowMs: 5 * 60 * 1000,
  limitEnv: 'GRAPHQL_RATE_LIMIT_MAX',
  windowEnv: 'GRAPHQL_RATE_LIMIT_WINDOW_MS',
})

function withSecurityHeaders(response: NextResponse) {
  applySecurityHeaders(response.headers)
  return response
}

function normalizeOrigin(value: null | string | undefined) {
  if (!value) return ''

  try {
    return new URL(value).origin.toLowerCase()
  } catch {
    return ''
  }
}

function getAllowedRequestOriginsFromEnv() {
  const allowed = new Set<string>(getAllowedOriginsFromEnv())

  for (const fallback of [process.env.CANONICAL_APP_URL, process.env.NEXT_PUBLIC_APP_URL]) {
    const normalized = normalizeOrigin(fallback)
    if (normalized) {
      allowed.add(normalized)
    }
  }

  return Array.from(allowed)
}

function normalizeIP(value: null | string | undefined) {
  const candidate = String(value || '').split(',')[0]?.trim()
  return candidate || ''
}

function normalizeUserAgent(value: null | string | undefined) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
}

function getRequestIP(headers: Headers) {
  if (process.env.TRUST_PROXY_HEADERS === 'true') {
    const proxyHeaders = [headers.get('cf-connecting-ip'), headers.get('x-real-ip')]

    for (const headerValue of proxyHeaders) {
      const normalized = normalizeIP(headerValue)
      if (normalized) {
        return normalized
      }
    }
  }

  return 'unknown'
}

function getRequestRateLimitKey(headers: Headers) {
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

export async function proxy(request: NextRequest) {
  const { nextUrl } = request
  const pathname = nextUrl.pathname
  const requestToken = extractRequestToken(request.headers)

  if (pathname.startsWith('/admin') && nextUrl.searchParams.has('adminLang')) {
    const requestedLanguage = nextUrl.searchParams.get('adminLang')?.toLowerCase().startsWith('zh') ? 'zh' : 'en'
    const redirectURL = nextUrl.clone()

    redirectURL.searchParams.delete('adminLang')

    const response = withSecurityHeaders(NextResponse.redirect(redirectURL))
    response.cookies.set({
      name: languageCookieName,
      path: '/',
      sameSite: 'lax',
      value: requestedLanguage,
    })

    return response
  }

  if ((pathname.startsWith('/api/') || pathname.startsWith('/account') || pathname.startsWith('/admin')) && requestToken) {
    if (await isTokenRevoked(requestToken)) {
      return withSecurityHeaders(
        NextResponse.json(
          {
            message: 'This session has been revoked. Please sign in again.',
          },
          { status: 401 },
        ),
      )
    }
  }

  if (pathname.startsWith('/account') && !request.cookies.get(authCookieName)?.value) {
    const loginURL = new URL('/login', request.url)
    loginURL.searchParams.set('redirect', `${pathname}${nextUrl.search}`)
    return withSecurityHeaders(NextResponse.redirect(loginURL))
  }

  if ((pathname === '/api/users' || pathname === '/api/account/auth/register') && request.method === 'POST') {
    const origin = normalizeOrigin(request.headers.get('origin'))
    const allowedRequestOrigins = getAllowedRequestOriginsFromEnv()
    if (origin && !allowedRequestOrigins.some((item: string) => origin.toLowerCase() === item)) {
      return withSecurityHeaders(
        NextResponse.json(
          {
            message: 'Registration origin is not allowed.',
          },
          { status: 403 },
        ),
      )
    }

    const actorKey = getRequestRateLimitKey(request.headers)
    const result = await enforceRateLimit({
      key: `register:${actorKey}`,
      limit: registrationRateLimit.limit,
      windowMs: registrationRateLimit.windowMs,
    })

    if (!result.allowed) {
      return withSecurityHeaders(
        NextResponse.json(
          {
            message: 'Too many registration attempts. Please try again later.',
          },
          { status: 429 },
        ),
      )
    }
  }

  if ((pathname === '/api/users/login' || pathname === '/api/account/auth/login') && request.method === 'POST') {
    const actorKey = getRequestRateLimitKey(request.headers)
    const result = await enforceRateLimit({
      key: `login:${actorKey}`,
      limit: loginRateLimit.limit,
      windowMs: loginRateLimit.windowMs,
    })

    if (!result.allowed) {
      return withSecurityHeaders(
        NextResponse.json(
          {
            message: 'Too many login attempts. Please try again later.',
          },
          { status: 429 },
        ),
      )
    }
  }

  if (pathname === '/api/graphql' && request.method === 'POST') {
    const actorKey = getRequestRateLimitKey(request.headers)
    const result = await enforceRateLimit({
      key: `graphql:${actorKey}`,
      limit: graphQLRateLimit.limit,
      windowMs: graphQLRateLimit.windowMs,
    })

    if (!result.allowed) {
      return withSecurityHeaders(
        NextResponse.json(
          {
            message: 'Too many GraphQL requests. Please try again later.',
          },
          { status: 429 },
        ),
      )
    }
  }

  return withSecurityHeaders(NextResponse.next())
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
