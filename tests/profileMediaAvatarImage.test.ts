import assert from 'node:assert/strict'
import test from 'node:test'

import sharp from 'sharp'

import { AVATAR_IMAGE_SIZE, getAvatarDerivativePath, inspectProfileImage, processAvatarImage } from '../src/lib/profileMedia/avatarImage.ts'

async function createPng(width: number, height: number) {
  return sharp({
    create: {
      background: '#4466aa',
      channels: 3,
      height,
      width,
    },
  })
    .png()
    .toBuffer()
}

test('avatar derivative paths stay next to the original upload object', () => {
  assert.equal(
    getAvatarDerivativePath('/media/profile/avatar/user-7/source.photo.png'),
    'media/profile/avatar/user-7/source.photo-avatar.webp',
  )
  assert.equal(
    getAvatarDerivativePath('media/profile/avatar/user-7/source'),
    'media/profile/avatar/user-7/source-avatar.webp',
  )
})

test('profile image inspection accepts real image bytes and returns actual metadata', async () => {
  const input = await createPng(120, 80)
  const info = await inspectProfileImage(input)

  assert.equal(info.contentType, 'image/png')
  assert.equal(info.width, 120)
  assert.equal(info.height, 80)
  assert.equal(info.size, input.byteLength)
})

test('profile image inspection rejects non-image bytes', async () => {
  await assert.rejects(() => inspectProfileImage(Buffer.from('not an image')), /JPEG, PNG, and WebP/)
})

test('avatar processing crops non-square images to the configured square WebP size', async () => {
  const input = await createPng(800, 1200)
  const output = await processAvatarImage(input)

  assert.equal(output.contentType, 'image/webp')
  assert.equal(output.width, AVATAR_IMAGE_SIZE)
  assert.equal(output.height, AVATAR_IMAGE_SIZE)
  assert.equal(output.buffer.byteLength, output.size)
})

test('avatar processing supports small images by normalizing them to the same square size', async () => {
  const input = await createPng(100, 100)
  const output = await processAvatarImage(input)

  assert.equal(output.width, AVATAR_IMAGE_SIZE)
  assert.equal(output.height, AVATAR_IMAGE_SIZE)
})
