import test from 'node:test'
import assert from 'node:assert/strict'

import { submitAITaskEndpoint } from '../src/endpoints/aiTasks.ts'
import { createPrintOrderEndpoint } from '../src/endpoints/printOrders.ts'
import { createSubscriptionCheckoutEndpoint } from '../src/endpoints/subscriptions.ts'

const previousNodeEnv = process.env.NODE_ENV
const previousAllowedOrigins = process.env.ALLOWED_REQUEST_ORIGINS

test.after(() => {
  ;(process.env as Record<string, string | undefined>).NODE_ENV = previousNodeEnv
  process.env.ALLOWED_REQUEST_ORIGINS = previousAllowedOrigins
})

function createBlockedRequest() {
  ;(process.env as Record<string, string | undefined>).NODE_ENV = 'production'
  process.env.ALLOWED_REQUEST_ORIGINS = 'https://app.example.com'

  return {
    headers: new Headers({
      origin: 'https://evil.example.com',
    }),
    json: async () => ({}),
    user: {
      id: 1,
      role: 'customer',
    },
  } as never
}

test('submitAITaskEndpoint rejects requests from disallowed origins', async () => {
  const response = await submitAITaskEndpoint.handler(createBlockedRequest())
  assert.equal(response.status, 403)
})

test('createPrintOrderEndpoint rejects requests from disallowed origins', async () => {
  const response = await createPrintOrderEndpoint.handler(createBlockedRequest())
  assert.equal(response.status, 403)
})

test('createSubscriptionCheckoutEndpoint rejects requests from disallowed origins', async () => {
  const response = await createSubscriptionCheckoutEndpoint.handler(createBlockedRequest())
  assert.equal(response.status, 403)
})
