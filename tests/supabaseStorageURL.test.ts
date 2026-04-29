import assert from 'node:assert/strict'
import test from 'node:test'

import { getSupabaseStorageObjectPathFromURL } from '../src/lib/supabase/storage.ts'

test('getSupabaseStorageObjectPathFromURL extracts public object paths', () => {
  const path = getSupabaseStorageObjectPathFromURL({
    bucket: 'media',
    url: 'https://demo.supabase.co/storage/v1/object/public/media/generated/user-1/model.glb',
  })

  assert.equal(path, 'generated/user-1/model.glb')
})

test('getSupabaseStorageObjectPathFromURL extracts signed object paths', () => {
  const path = getSupabaseStorageObjectPathFromURL({
    bucket: 'media',
    url: 'https://demo.supabase.co/storage/v1/object/sign/media/generated/user-1/model.glb?token=abc',
  })

  assert.equal(path, 'generated/user-1/model.glb')
})

test('getSupabaseStorageObjectPathFromURL ignores different buckets', () => {
  const path = getSupabaseStorageObjectPathFromURL({
    bucket: 'media',
    url: 'https://demo.supabase.co/storage/v1/object/public/other/generated/user-1/model.glb',
  })

  assert.equal(path, null)
})
