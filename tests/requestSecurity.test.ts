import test from 'node:test'
import assert from 'node:assert/strict'

import {
  applySecurityHeaders,
  containsGraphQLIntrospectionQuery,
  getAllowedRequestOrigins,
  getRequestRateLimitKey,
  rejectDisallowedMutationOrigin,
} from '../src/lib/requestSecurity.ts'

test('getAllowedRequestOrigins includes env-configured origins', async () => {
  const previousAllowed = process.env.ALLOWED_REQUEST_ORIGINS
  const previousCanonical = process.env.CANONICAL_APP_URL
  const previousPublic = process.env.NEXT_PUBLIC_APP_URL

  process.env.ALLOWED_REQUEST_ORIGINS = 'https://app.example.com, https://admin.example.com'
  process.env.CANONICAL_APP_URL = ''
  process.env.NEXT_PUBLIC_APP_URL = ''

  try {
    assert.deepEqual(await getAllowedRequestOrigins(), ['https://app.example.com', 'https://admin.example.com'])
  } finally {
    process.env.ALLOWED_REQUEST_ORIGINS = previousAllowed
    process.env.CANONICAL_APP_URL = previousCanonical
    process.env.NEXT_PUBLIC_APP_URL = previousPublic
  }
})

test('getAllowedRequestOrigins prefers Security Settings over legacy env allowlist', async () => {
  const previousAllowed = process.env.ALLOWED_REQUEST_ORIGINS
  const previousCanonical = process.env.CANONICAL_APP_URL
  const previousPublic = process.env.NEXT_PUBLIC_APP_URL

  process.env.ALLOWED_REQUEST_ORIGINS = 'https://legacy.example.com'
  process.env.CANONICAL_APP_URL = 'https://canonical.example.com'
  process.env.NEXT_PUBLIC_APP_URL = ''

  try {
    const origins = await getAllowedRequestOrigins({
      findGlobal: async ({ slug }: { slug: string }) => {
        assert.equal(slug, 'security-settings')
        return {
          allowedMutationOrigins: [{ origin: 'https://admin-configured.example.com' }],
        }
      },
    } as never)

    assert.deepEqual(origins, ['https://admin-configured.example.com', 'https://canonical.example.com'])
  } finally {
    process.env.ALLOWED_REQUEST_ORIGINS = previousAllowed
    process.env.CANONICAL_APP_URL = previousCanonical
    process.env.NEXT_PUBLIC_APP_URL = previousPublic
  }
})

test('getAllowedRequestOrigins falls back to canonical app url when no explicit allowlist exists', async () => {
  const previousAllowed = process.env.ALLOWED_REQUEST_ORIGINS
  const previousCanonical = process.env.CANONICAL_APP_URL
  const previousPublic = process.env.NEXT_PUBLIC_APP_URL

  process.env.ALLOWED_REQUEST_ORIGINS = ''
  process.env.CANONICAL_APP_URL = 'https://canonical.example.com'
  process.env.NEXT_PUBLIC_APP_URL = ''

  try {
    const origins = await getAllowedRequestOrigins({
      findGlobal: async () => ({
        allowedMutationOrigins: [],
      }),
    } as never)

    assert.deepEqual(origins, ['https://canonical.example.com'])
  } finally {
    process.env.ALLOWED_REQUEST_ORIGINS = previousAllowed
    process.env.CANONICAL_APP_URL = previousCanonical
    process.env.NEXT_PUBLIC_APP_URL = previousPublic
  }
})

test('rejectDisallowedMutationOrigin blocks unknown origins in production', async () => {
  const previousNodeEnv = process.env.NODE_ENV
  const previousAllowed = process.env.ALLOWED_REQUEST_ORIGINS

  ;(process.env as Record<string, string | undefined>).NODE_ENV = 'production'
  process.env.ALLOWED_REQUEST_ORIGINS = 'https://app.example.com'

  try {
    const headers = new Headers({
      origin: 'https://evil.example.com',
    })

    const response = await rejectDisallowedMutationOrigin({
      headers,
    } as never)

    assert.ok(response)
    assert.equal(response?.status, 403)
  } finally {
    ;(process.env as Record<string, string | undefined>).NODE_ENV = previousNodeEnv
    process.env.ALLOWED_REQUEST_ORIGINS = previousAllowed
  }
})

test('rejectDisallowedMutationOrigin honors Security Settings when payload is provided', async () => {
  const previousNodeEnv = process.env.NODE_ENV
  const previousAllowed = process.env.ALLOWED_REQUEST_ORIGINS

  ;(process.env as Record<string, string | undefined>).NODE_ENV = 'production'
  process.env.ALLOWED_REQUEST_ORIGINS = 'https://legacy.example.com'

  try {
    const allowedResponse = await rejectDisallowedMutationOrigin({
      headers: new Headers({
        origin: 'https://security-settings.example.com',
      }),
      payload: {
        findGlobal: async () => ({
          allowedMutationOrigins: [{ origin: 'https://security-settings.example.com' }],
        }),
      },
    } as never)

    assert.equal(allowedResponse, null)
  } finally {
    ;(process.env as Record<string, string | undefined>).NODE_ENV = previousNodeEnv
    process.env.ALLOWED_REQUEST_ORIGINS = previousAllowed
  }
})

test('containsGraphQLIntrospectionQuery detects schema introspection payloads', () => {
  assert.equal(containsGraphQLIntrospectionQuery('query { __schema { types { name } } }'), true)
  assert.equal(containsGraphQLIntrospectionQuery('query Viewer { me { email } }'), false)
})

test('applySecurityHeaders adds baseline security headers', () => {
  const headers = new Headers()
  applySecurityHeaders(headers)

  assert.equal(headers.get('X-Content-Type-Options'), 'nosniff')
  assert.equal(headers.get('X-Frame-Options'), 'DENY')
  assert.ok(headers.get('Content-Security-Policy'))
})

test('getRequestRateLimitKey prefers trusted proxy ip when available', () => {
  const previousTrustProxy = process.env.TRUST_PROXY_HEADERS
  process.env.TRUST_PROXY_HEADERS = 'true'

  try {
    const key = getRequestRateLimitKey(
      new Headers({
        'x-real-ip': '203.0.113.10',
        'user-agent': 'ExampleBrowser/1.0',
      }),
    )

    assert.equal(key, 'ip:203.0.113.10')
  } finally {
    process.env.TRUST_PROXY_HEADERS = previousTrustProxy
  }
})

test('getRequestRateLimitKey falls back to normalized user agent when ip is unavailable', () => {
  const previousTrustProxy = process.env.TRUST_PROXY_HEADERS
  process.env.TRUST_PROXY_HEADERS = 'false'

  try {
    const key = getRequestRateLimitKey(
      new Headers({
        'user-agent': 'Mozilla/5.0  Test Browser',
      }),
    )

    assert.equal(key, 'ua:mozilla/5.0 test browser')
  } finally {
    process.env.TRUST_PROXY_HEADERS = previousTrustProxy
  }
})
