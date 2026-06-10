import assert from 'node:assert/strict'
import test from 'node:test'

import { generateForgotPasswordEmailHTML } from '../src/lib/emailTemplates.ts'

const withEnv = async (
  overrides: Record<string, string | undefined>,
  callback: () => Promise<void> | void,
) => {
  const previous = new Map<string, string | undefined>()

  for (const [key, value] of Object.entries(overrides)) {
    previous.set(key, process.env[key])

    if (typeof value === 'undefined') {
      delete process.env[key]
    } else {
      process.env[key] = value
    }
  }

  try {
    await callback()
  } finally {
    for (const [key, value] of previous.entries()) {
      if (typeof value === 'undefined') {
        delete process.env[key]
      } else {
        process.env[key] = value
      }
    }
  }
}

test('forgot password email uses the canonical app URL when public app URL is unset', async () => {
  await withEnv(
    {
      CANONICAL_APP_URL: 'https://app.thornstavern.example/',
      NEXT_PUBLIC_APP_URL: undefined,
      NODE_ENV: 'production',
    },
    async () => {
      const html = await generateForgotPasswordEmailHTML({
        token: 'reset-token',
        user: {
          email: 'player@example.com',
        },
      })

      assert.match(html, /https:\/\/app\.thornstavern\.example\/reset-password\?token=reset-token/)
      assert.doesNotMatch(html, /localhost/)
    },
  )
})
