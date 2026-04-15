import type { PayloadRequest } from 'payload'

const EXPIRED_DATE = new Date(Date.now() - 1000).toUTCString()

const toSameSite = (value: unknown) => {
  if (typeof value === 'string' && value.trim()) {
    return value.trim()
  }

  if (value === true) {
    return 'Strict'
  }

  return ''
}

function buildExpiredAuthCookie(req: PayloadRequest) {
  const cookiePrefix = req.payload.config.cookiePrefix || 'payload'
  const authConfig = req.payload.collections?.users?.config?.auth
  const parts = [`${cookiePrefix}-token=`, `Expires=${EXPIRED_DATE}`, 'Path=/', 'HttpOnly']

  if (authConfig?.cookies?.domain) {
    parts.push(`Domain=${authConfig.cookies.domain}`)
  }

  if (authConfig?.cookies?.secure) {
    parts.push('Secure')
  }

  const sameSite = toSameSite(authConfig?.cookies?.sameSite)
  if (sameSite) {
    parts.push(`SameSite=${sameSite}`)
  }

  return parts.join('; ')
}

export const sessionLogoutEndpoint = {
  path: '/platform/session/logout',
  method: 'post' as const,
  handler: async (req: PayloadRequest) => {
    const headers = new Headers()
    headers.set('Cache-Control', 'no-store')
    headers.append('Set-Cookie', buildExpiredAuthCookie(req))

    return Response.json(
      {
        message: 'Session cleared',
      },
      {
        headers,
        status: 200,
      },
    )
  },
}

