import test from 'node:test'
import assert from 'node:assert/strict'

import { getCanonicalAppURL } from '../src/lib/getCanonicalAppURL.ts'

test('getCanonicalAppURL prefers canonical env value and trims trailing slash', () => {
  const previousCanonical = process.env.CANONICAL_APP_URL
  const previousPublic = process.env.NEXT_PUBLIC_APP_URL

  process.env.CANONICAL_APP_URL = 'https://example.com/'
  process.env.NEXT_PUBLIC_APP_URL = 'https://fallback.example.com'

  try {
    assert.equal(getCanonicalAppURL(), 'https://example.com')
  } finally {
    process.env.CANONICAL_APP_URL = previousCanonical
    process.env.NEXT_PUBLIC_APP_URL = previousPublic
  }
})

test('getCanonicalAppURL falls back to local default when env is invalid', () => {
  const previousCanonical = process.env.CANONICAL_APP_URL
  const previousPublic = process.env.NEXT_PUBLIC_APP_URL

  process.env.CANONICAL_APP_URL = 'not a url'
  process.env.NEXT_PUBLIC_APP_URL = ''

  try {
    assert.equal(getCanonicalAppURL(), 'http://127.0.0.1:3000')
  } finally {
    process.env.CANONICAL_APP_URL = previousCanonical
    process.env.NEXT_PUBLIC_APP_URL = previousPublic
  }
})
