import assert from 'node:assert/strict'
import test from 'node:test'

import { Users } from '../src/collections/Users.ts'
import {
  getAuthSettingsEndpoint,
  sendRegistrationVerificationCodeEndpoint,
} from '../src/endpoints/accountAuth.ts'
import { modelDownloadEndpoint } from '../src/endpoints/modelDownloads.ts'
import { registerAccount } from '../src/lib/authService.ts'
import {
  hashRegistrationVerificationCode,
  sendRegistrationVerificationCode,
} from '../src/lib/emailVerificationCodes.ts'

test('registerAccount requires a verification code in the default email-code mode', async () => {
  let created = false

  await assert.rejects(
    () =>
      registerAccount({
        input: {
          email: 'new-user@example.com',
          password: 'StrongPassword123!',
        },
        req: {
          payload: {
            create: async () => {
              created = true
              return {
                id: 42,
              }
            },
            findGlobal: async () => null,
          },
        } as never,
      }),
    /Verification code is required/,
  )

  assert.equal(created, false)
})

test('registerAccount keeps the email-link mode compatible with existing registrations', async () => {
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
        findGlobal: async () => ({
          registrationVerificationMode: 'email-link',
        }),
      },
    } as never,
  })

  assert.deepEqual(result, {
    loginReady: false,
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
        findGlobal: async () => ({
          registrationVerificationMode: 'email-link',
        }),
      },
    } as never,
  })

  assert.deepEqual(result, {
    loginReady: false,
    message: 'If this email is not already registered, a verification email has been sent.',
  })
})

test('registerAccount consumes a valid registration code and creates a verified user', async () => {
  const operations: Array<{ args: unknown; type: string }> = []

  const result = await registerAccount({
    input: {
      email: 'new-user@example.com',
      password: 'StrongPassword123!',
      verificationCode: '123456',
    },
    req: {
      payload: {
        create: async (args: unknown) => {
          operations.push({ args, type: 'create' })
          return {
            id: 42,
          }
        },
        find: async (args: unknown) => {
          operations.push({ args, type: 'find' })
          return {
            docs: [
              {
                attempts: 0,
                codeHash: hashRegistrationVerificationCode({
                  code: '123456',
                  email: 'new-user@example.com',
                }),
                email: 'new-user@example.com',
                expiresAt: new Date(Date.now() + 60_000).toISOString(),
                id: 7,
              },
            ],
          }
        },
        findGlobal: async () => ({
          registrationCodeExpiresMinutes: 10,
          registrationVerificationMode: 'email-code',
        }),
        update: async (args: unknown) => {
          operations.push({ args, type: 'update' })
          return {}
        },
      },
    } as never,
  })

  assert.deepEqual(result, {
    loginReady: true,
    message: 'Registration complete. You can sign in now.',
  })
  assert.deepEqual(operations.map((operation) => operation.type), ['find', 'update', 'create'])
  assert.deepEqual(
    (operations[2].args as { data: { _verified?: boolean }; disableVerificationEmail?: boolean }).data._verified,
    true,
  )
  assert.equal((operations[2].args as { disableVerificationEmail?: boolean }).disableVerificationEmail, true)
})

test('sendRegistrationVerificationCode stores a hash and sends the plain code only by email', async () => {
  let createdRecord: { codeHash?: string; email?: string } | null = null
  let emailHTML = ''

  const result = await sendRegistrationVerificationCode({
    email: 'New-User@Example.com',
    req: {
      payload: {
        create: async (args: { data: { codeHash: string; email: string } }) => {
          createdRecord = args.data
          return { id: 11 }
        },
        find: async () => ({ docs: [] }),
        findGlobal: async (args: { slug: string }) =>
          args.slug === 'security-settings'
            ? {
                registrationCodeExpiresMinutes: 10,
                registrationVerificationMode: 'email-code',
              }
            : {},
        sendEmail: async (args: { html: string }) => {
          emailHTML = args.html
        },
      },
    } as never,
  })

  assert.equal(result.message, 'If this email can be registered, a verification code has been sent.')
  assert.equal(createdRecord?.email, 'new-user@example.com')
  assert.match(createdRecord?.codeHash || '', /^[a-f0-9]{64}$/)
  assert.equal(emailHTML.includes(createdRecord?.codeHash || ''), false)
  assert.match(emailHTML, /\d{6}/)
})

test('modelDownloadEndpoint requires authentication for inline previews', async () => {
  const response = await modelDownloadEndpoint.handler({
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

test('account auth endpoints expose registration settings and code sending paths', () => {
  assert.equal(getAuthSettingsEndpoint.path, '/account/auth/settings')
  assert.equal(getAuthSettingsEndpoint.method, 'get')
  assert.equal(sendRegistrationVerificationCodeEndpoint.path, '/account/auth/send-register-code')
  assert.equal(sendRegistrationVerificationCodeEndpoint.method, 'post')
})
