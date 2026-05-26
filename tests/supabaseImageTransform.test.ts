import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'

import { getSupabasePreviewImageURL, supabaseImageTransformPresets } from '../src/lib/supabase/imageTransform.ts'

const publicObjectURL =
  'https://umxjtmlmxwjwnbivuxep.supabase.co/storage/v1/object/public/media/media/preview/user-1/demo.png'

test('getSupabasePreviewImageURL converts public object URLs into render image URLs', () => {
  const transformed = getSupabasePreviewImageURL(publicObjectURL, 'model-card')
  const parsed = new URL(transformed)
  const preset = supabaseImageTransformPresets['model-card']

  assert.equal(parsed.pathname, '/storage/v1/render/image/public/media/media/preview/user-1/demo.png')
  assert.equal(parsed.searchParams.get('width'), String(preset.width))
  assert.equal(parsed.searchParams.get('height'), String(preset.height))
  assert.equal(parsed.searchParams.get('resize'), preset.resize)
  assert.equal(parsed.searchParams.get('quality'), String(preset.quality))
})

test('getSupabasePreviewImageURL leaves non-public and non-Supabase URLs unchanged', () => {
  const signedURL =
    'https://umxjtmlmxwjwnbivuxep.supabase.co/storage/v1/object/sign/media/media/input/user-1/source.png?token=abc'
  const remoteURL = 'https://cdn.example.com/image.png'
  const localURL = '/api/media/file/image.png'

  assert.equal(getSupabasePreviewImageURL(signedURL, 'model-card'), signedURL)
  assert.equal(getSupabasePreviewImageURL(remoteURL, 'model-card'), remoteURL)
  assert.equal(getSupabasePreviewImageURL(localURL, 'model-card'), localURL)
  assert.equal(getSupabasePreviewImageURL(null, 'model-card'), null)
})

test('getSupabasePreviewImageURL is idempotent for existing render URLs', () => {
  const existing =
    'https://umxjtmlmxwjwnbivuxep.supabase.co/storage/v1/render/image/public/media/media/preview/user-1/demo.png?width=120&quality=50'
  const transformed = getSupabasePreviewImageURL(existing, 'home-card')
  const parsed = new URL(transformed)
  const preset = supabaseImageTransformPresets['home-card']

  assert.equal(parsed.pathname, '/storage/v1/render/image/public/media/media/preview/user-1/demo.png')
  assert.equal(parsed.searchParams.get('width'), String(preset.width))
  assert.equal(parsed.searchParams.get('height'), String(preset.height))
  assert.equal(parsed.searchParams.get('resize'), preset.resize)
  assert.equal(parsed.searchParams.get('quality'), String(preset.quality))
})

test('provider source image gateways do not use display-only transform URLs', () => {
  const rootDir = process.cwd()
  const meshyGateway = readFileSync(path.join(rootDir, 'src', 'lib', 'meshyGateway.ts'), 'utf8')
  const geminiImageGateway = readFileSync(path.join(rootDir, 'src', 'lib', 'geminiImageGateway.ts'), 'utf8')

  assert.doesNotMatch(meshyGateway, /getSupabasePreviewImageURL|render\/image/)
  assert.doesNotMatch(geminiImageGateway, /getSupabasePreviewImageURL|render\/image/)
})
