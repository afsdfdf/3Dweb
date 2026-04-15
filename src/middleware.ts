import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { enforceRateLimit, getRateLimitConfig } from './lib/rateLimit'
import { applySecurityHeaders, getAllowedRequestOrigins, getRequestIP } from './lib/requestSecurity'

const cookiePrefix = process.env.PAYLOAD_COOKIE_PREFIX || 'payload'
const authCookieName = `${cookiePrefix}-token`
const allowedRequestOrigins = getAllowedRequestOrigins()

const registrationRateLimit = getRateLimitConfig({
  fallbackLimit: 5,
  fallbackWindowMs: 60 * 60 * 1000,
  limitEnv: 'REGISTER_RATE_LIMIT_MAX',
  windowEnv: 'REGISTER_RATE_LIMIT_WINDOW_MS',
})

function withSecurityHeaders(response: NextResponse) {
  applySecurityHeaders(response.headers)
  return response
}

export function middleware(request: NextRequest) {
  const { nextUrl } = request
  const pathname = nextUrl.pathname

  if (pathname.startsWith('/dashboard') && !request.cookies.get(authCookieName)?.value) {
    const loginURL = new URL('/login', request.url)
    loginURL.searchParams.set('redirect', pathname)
    return withSecurityHeaders(NextResponse.redirect(loginURL))
  }

  if (pathname === '/api/users' && request.method === 'POST') {
    const origin = request.headers.get('origin')
    if (origin && !allowedRequestOrigins.some((item) => origin.toLowerCase() === item)) {
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
    const result = enforceRateLimit({
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

  return withSecurityHeaders(NextResponse.next())
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
