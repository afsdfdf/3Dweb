import sharp from 'sharp'
import type { Metadata } from 'sharp'

const DEFAULT_AVATAR_IMAGE_SIZE = 500
const DEFAULT_AVATAR_WEBP_QUALITY = 82

const clampInteger = (value: number, fallback: number, min: number, max: number) => {
  const rounded = Math.round(value)
  if (!Number.isFinite(rounded)) return fallback
  return Math.min(Math.max(rounded, min), max)
}

export const AVATAR_IMAGE_SIZE = clampInteger(
  Number(process.env.AVATAR_IMAGE_SIZE || DEFAULT_AVATAR_IMAGE_SIZE),
  DEFAULT_AVATAR_IMAGE_SIZE,
  1,
  DEFAULT_AVATAR_IMAGE_SIZE,
)

export const AVATAR_WEBP_QUALITY = clampInteger(
  Number(process.env.AVATAR_WEBP_QUALITY || DEFAULT_AVATAR_WEBP_QUALITY),
  DEFAULT_AVATAR_WEBP_QUALITY,
  1,
  100,
)

export type ProcessedAvatarImage = {
  buffer: Buffer
  contentType: 'image/webp'
  height: number
  size: number
  width: number
}

export type ProfileImageInfo = {
  contentType: 'image/jpeg' | 'image/png' | 'image/webp'
  height: number
  size: number
  width: number
}

const profileImageFormatToContentType = {
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
} as const

export function getAvatarDerivativePath(objectPath: string) {
  const cleanPath = objectPath.replace(/^\/+/, '')
  const withoutExtension = cleanPath.replace(/\.[^/.]+$/, '')
  return `${withoutExtension}-avatar.webp`
}

export async function inspectProfileImage(input: Buffer): Promise<ProfileImageInfo> {
  let metadata: Metadata
  try {
    metadata = await sharp(input).metadata()
  } catch {
    throw new Error('Only JPEG, PNG, and WebP profile images are supported.')
  }

  const contentType =
    metadata.format && metadata.format in profileImageFormatToContentType
      ? profileImageFormatToContentType[metadata.format as keyof typeof profileImageFormatToContentType]
      : null

  if (!contentType || !metadata.width || !metadata.height) {
    throw new Error('Only JPEG, PNG, and WebP profile images are supported.')
  }

  return {
    contentType,
    height: metadata.height,
    size: input.byteLength,
    width: metadata.width,
  }
}

export async function processAvatarImage(input: Buffer): Promise<ProcessedAvatarImage> {
  const output = await sharp(input)
    .rotate()
    .resize({
      fit: 'cover',
      height: AVATAR_IMAGE_SIZE,
      position: 'center',
      width: AVATAR_IMAGE_SIZE,
      withoutEnlargement: false,
    })
    .webp({ quality: AVATAR_WEBP_QUALITY })
    .toBuffer({ resolveWithObject: true })

  return {
    buffer: output.data,
    contentType: 'image/webp',
    height: output.info.height,
    size: output.info.size,
    width: output.info.width,
  }
}
