import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { enforceRateLimit, getRateLimitConfig } from './lib/rateLimit'
import { applySecurityHeaders, extractRequestToken, getAllowedRequestOrigins, getRequestIP } from './lib/requestSecurity'
import { isTokenRevoked } from './lib/tokenRevocation'

const cookiePrefix = process.env.PAYLOAD_COOKIE_PREFIX || 'payload'
const authCookieName = `${cookiePrefix}-token`

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

function withSecurityHeaders(response: NextResponse) {
  applySecurityHeaders(response.headers)
  return response
}

export async function proxy(request: NextRequest) {
  const { nextUrl } = request
  const pathname = nextUrl.pathname
  const requestToken = extractRequestToken(request.headers)

  if ((pathname.startsWith('/api/') || pathname.startsWith('/dashboard') || pathname.startsWith('/admin')) && requestToken) {
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

  if ((pathname.startsWith('/dashboard') || pathname.startsWith('/admin')) && !request.cookies.get(authCookieName)?.value) {
    const loginURL = new URL('/login', request.url)
    loginURL.searchParams.set('redirect', pathname)
    return withSecurityHeaders(NextResponse.redirect(loginURL))
  }

  if (pathname === '/api/users' && request.method === 'POST') {
    const origin = request.headers.get('origin')
    const allowedRequestOrigins = await getAllowedRequestOrigins()
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

    const ip = getRequestIP(request.headers)
    const result = await enforceRateLimit({
      key: `register:${ip}`,
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

  if (pathname === '/api/users/login' && request.method === 'POST') {
    const ip = getRequestIP(request.headers)
    const result = await enforceRateLimit({
      key: `login:${ip}`,
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

  return withSecurityHeaders(NextResponse.next())
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
