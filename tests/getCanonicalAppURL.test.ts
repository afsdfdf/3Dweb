import assert from 'node:assert/strict'
import test from 'node:test'

import { getCanonicalAppURL } from '../src/lib/getCanonicalAppURL.ts'

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

test('getCanonicalAppURL prefers canonical env value and trims trailing slash', async () => {
  await withEnv(
    {
      CANONICAL_APP_URL: 'https://example.com/',
      NEXT_PUBLIC_APP_URL: 'https://fallback.example.com',
      NODE_ENV: 'development',
    },
    () => {
      assert.equal(getCanonicalAppURL(), 'https://example.com')
    },
  )
})

test('getCanonicalAppURL falls back to local default in development when env is invalid', async () => {
  await withEnv(
    {
      CANONICAL_APP_URL: 'not a url',
      NEXT_PUBLIC_APP_URL: '',
      NODE_ENV: 'development',
    },
    () => {
      assert.equal(getCanonicalAppURL(), 'http://localhost:3000')
    },
  )
})

test('getCanonicalAppURL falls back to local default in development when env is missing', async () => {
  await withEnv(
    {
      CANONICAL_APP_URL: '',
      NEXT_PUBLIC_APP_URL: '',
      NODE_ENV: 'development',
    },
    () => {
      assert.equal(getCanonicalAppURL(), 'http://localhost:3000')
    },
  )
})

test('getCanonicalAppURL throws in production when env is missing', async () => {
  await withEnv(
    {
      CANONICAL_APP_URL: '',
      NEXT_PUBLIC_APP_URL: '',
      NODE_ENV: 'production',
    },
    () => {
      assert.throws(
        () => getCanonicalAppURL(),
        /Canonical app URL is required in production and must be a valid absolute URL\. No canonical URL is configured\./,
      )
    },
  )
})

test('getCanonicalAppURL throws in production when env is invalid', async () => {
  await withEnv(
    {
      CANONICAL_APP_URL: 'not a url',
      NEXT_PUBLIC_APP_URL: '',
      NODE_ENV: 'production',
    },
    () => {
      assert.throws(
        () => getCanonicalAppURL(),
        /Canonical app URL is required in production and must be a valid absolute URL\. Invalid configured value: "not a url"\./,
      )
    },
  )
})
