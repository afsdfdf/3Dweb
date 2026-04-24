import assert from 'node:assert/strict'
import test from 'node:test'

import { Users } from '../src/collections/Users.ts'
import { mockModelDownloadEndpoint } from '../src/endpoints/mockDownloads.ts'
import { registerAccount } from '../src/lib/authService.ts'

test('registerAccount returns a generic success message for new registrations', async () => {
  const result = await registerAccount({
    input: {
      email: 'new-user@example.com',
      password: 'StrongPassword123!',
    },
    req: {
      payload: {
        create: async () => ({
          id: 42,
        }),
      },
    } as never,
  })

  assert.deepEqual(result, {
    message: 'If this email is not already registered, a verification email has been sent.',
  })
})

test('registerAccount returns the same message for duplicate emails', async () => {
  const result = await registerAccount({
    input: {
      email: 'existing-user@example.com',
      password: 'StrongPassword123!',
    },
    req: {
      payload: {
        create: async () => {
          throw new Error('A user with this email already exists.')
        },
      },
    } as never,
  })

  assert.deepEqual(result, {
    message: 'If this email is not already registered, a verification email has been sent.',
  })
})

test('mockModelDownloadEndpoint requires authentication for inline previews', async () => {
  const response = await mockModelDownloadEndpoint.handler({
    payload: {},
    query: {
      format: 'glb',
      inline: '1',
      preview: '1',
    },
    routeParams: {
      modelId: '5',
    },
  } as never)

  const body = await response.json()

  assert.equal(response.status, 401)
  assert.equal(body.message, 'Please sign in first.')
})

test('Users collection create access blocks anonymous REST registration', async () => {
  const result = await Users.access?.create?.({
    req: {
      user: null,
    },
  } as never)

  assert.equal(result, false)
})
