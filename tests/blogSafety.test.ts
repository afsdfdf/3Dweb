import assert from 'node:assert/strict'
import test from 'node:test'

import {
  getGuestReadableBlogImageURL,
  isSafeBlogHref,
  normalizeBlogHref,
  normalizeBlogImageURL,
} from '../src/app/(frontend)/blog/_lib/blogSafety.ts'

test('blog href normalization rejects unsafe protocols and protocol-relative URLs', () => {
  assert.equal(normalizeBlogHref('/workbench', '/fallback'), '/workbench')
  assert.equal(normalizeBlogHref('https://example.com/posts', '/fallback'), 'https://example.com/posts')
  assert.equal(normalizeBlogHref(' //evil.example/path ', '/fallback'), '/fallback')
  assert.equal(normalizeBlogHref('javascript:alert(1)', '/fallback'), '/fallback')
  assert.equal(normalizeBlogHref('data:text/html,unsafe', '/fallback'), '/fallback')
  assert.equal(isSafeBlogHref('mailto:support@example.com', { allowMailto: true }), true)
  assert.equal(isSafeBlogHref('mailto:support@example.com'), false)
})

test('blog image URLs are browser-safe and never expose private Supabase objects', () => {
  assert.equal(normalizeBlogImageURL('/api/media/file/demo.webp'), '/api/media/file/demo.webp')
  assert.equal(
    normalizeBlogImageURL('http://localhost:3000/api/media/file/demo.webp?width=1200'),
    '/api/media/file/demo.webp?width=1200',
  )
  assert.equal(
    normalizeBlogImageURL('https://demo.supabase.co/storage/v1/object/public/media/blog/demo.webp'),
    'https://demo.supabase.co/storage/v1/object/public/media/blog/demo.webp',
  )
  assert.equal(normalizeBlogImageURL('//evil.example/demo.webp'), null)
  assert.equal(normalizeBlogImageURL('javascript:alert(1)'), null)
  assert.equal(normalizeBlogImageURL('https://demo.supabase.co/storage/v1/object/sign/media/private.webp'), null)
})

test('blog image extraction requires guest-readable media when visibility metadata is present', () => {
  assert.equal(
    getGuestReadableBlogImageURL({
      publicAccess: false,
      purpose: 'asset',
      url: 'https://cdn.example/private.webp',
    }),
    null,
  )
  assert.equal(
    getGuestReadableBlogImageURL({
      publicAccess: false,
      purpose: 'preview',
      thumbnailURL: 'https://cdn.example/preview-thumb.webp',
      url: 'https://cdn.example/preview.webp',
    }),
    'https://cdn.example/preview-thumb.webp',
  )
  assert.equal(
    getGuestReadableBlogImageURL({
      publicAccess: true,
      purpose: 'asset',
      url: 'https://cdn.example/public.webp',
    }),
    'https://cdn.example/public.webp',
  )
})
