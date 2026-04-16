import test from 'node:test'
import assert from 'node:assert/strict'

import {
  applySecurityHeaders,
  containsGraphQLIntrospectionQuery,
  getAllowedRequestOrigins,
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
