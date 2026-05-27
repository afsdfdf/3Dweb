import type { Payload, PayloadRequest } from 'payload'
import { jwtVerify } from 'jose'

type AuthenticatedUser = Record<string, any> & {
  collection?: string
  email?: null | string
  role?: null | string
  sessions?: Array<{ expiresAt?: string | Date | null; id?: string | null }>
}

type TokenPayload = {
  collection?: string
  id?: number | string
  sid?: string
}

const parseCookieHeader = (cookieHeader: string) => {
  const cookies = new Map<string, string>()

  for (const part of cookieHeader.split(';')) {
    const [rawName, ...rawValue] = part.trim().split('=')
    if (!rawName) continue
    cookies.set(rawName, rawValue.join('='))
  }

  return cookies
}

const getHeaderValue = (headers: Headers, key: string) => headers.get(key) || headers.get(key.toLowerCase()) || ''

const extractTokenFromHeaders = (args: { headers: Headers; payload: Payload }) => {
  const { headers, payload } = args
  const authHeader = getHeaderValue(headers, 'authorization')

  if (authHeader.startsWith('JWT ')) {
    return authHeader.slice(4).trim()
  }

  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim()
  }

  const cookieHeader = getHeaderValue(headers, 'cookie')
  if (!cookieHeader) return ''

  const cookies = parseCookieHeader(cookieHeader)
  return cookies.get(`${payload.config.cookiePrefix}-token`) || ''
}

const isSessionValid = (session: { expiresAt?: Date | string | null; id?: string | null }, sid: string) => {
  if (!session?.id || session.id !== sid) {
    return false
  }

  if (!session.expiresAt) {
    return true
  }

  const expiresAt = session.expiresAt instanceof Date ? session.expiresAt : new Date(session.expiresAt)
  return !Number.isNaN(expiresAt.getTime()) && expiresAt.getTime() > Date.now()
}

export async function resolvePayloadUserFromHeaders(args: { headers: Headers; payload: Payload }) {
  const { headers, payload } = args
  const token = extractTokenFromHeaders({ headers, payload })

  if (!token) {
    return null
  }

  try {
    const secretKey = new TextEncoder().encode(payload.secret)
    const { payload: decoded } = await jwtVerify(token, secretKey)
    const tokenPayload = decoded as TokenPayload

    if (!tokenPayload.collection || tokenPayload.id === undefined || tokenPayload.id === null) {
      return null
    }

    const collection = payload.collections[tokenPayload.collection as keyof typeof payload.collections]
    if (!collection?.config?.auth) {
      return null
    }

    const user = (await payload.findByID({
      collection: tokenPayload.collection as any,
      depth: collection.config.auth.depth,
      id: tokenPayload.id as any,
      overrideAccess: true,
    })) as AuthenticatedUser

    if (!user) {
      return null
    }

    if (collection.config.auth.useSessions) {
      if (!tokenPayload.sid || !Array.isArray(user.sessions) || !user.sessions.some((session) => isSessionValid(session, tokenPayload.sid!))) {
        return null
      }

      user._sid = tokenPayload.sid
    }

    user.collection = collection.config.slug
    user._strategy = 'local-jwt'

    return user
  } catch {
    return null
  }
}

export async function ensurePayloadRequestUser(req: PayloadRequest) {
  if (req.user) {
    return req.user
  }

  if (!req.headers) {
    return null
  }

  const user = await resolvePayloadUserFromHeaders({
    headers: req.headers,
    payload: req.payload,
  })

  if (user) {
    req.user = user as any
  }

  return req.user || null
}
