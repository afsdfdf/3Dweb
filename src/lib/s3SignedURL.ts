import type { Payload } from 'payload'

import { getS3StorageSettings } from '@/lib/s3Settings'
import {
  createSupabaseStorageSignedUrl,
  getSupabaseStorageObjectPathFromURL,
  getSupabaseStoragePublicUrl,
} from '@/lib/supabase/storage'

const ABSOLUTE_URL_PROTOCOLS = new Set(['http:', 'https:'])
const PAYLOAD_MEDIA_FILE_PREFIX = '/api/media/file/'

function normalizeAbsoluteURL(value: null | string | undefined) {
  if (!value) return null

  try {
    const parsed = new URL(value.trim())
    if (!ABSOLUTE_URL_PROTOCOLS.has(parsed.protocol)) {
      return null
    }

    return parsed.toString()
  } catch {
    return null
  }
}

function isSupabaseStorageURL(value: string) {
  try {
    const parsed = new URL(value)
    return parsed.hostname.endsWith('.supabase.co') && parsed.pathname.startsWith('/storage/v1/object/')
  } catch {
    return false
  }
}

function isSupabasePublicStorageURL(value: string) {
  try {
    const parsed = new URL(value)
    return parsed.hostname.endsWith('.supabase.co') && parsed.pathname.startsWith('/storage/v1/object/public/')
  } catch {
    return false
  }
}

export async function getMediaAccessURL(args: {
  payload: Payload
  ttlSeconds?: number
  url?: null | string
}) {
  const { payload, ttlSeconds = 3600, url } = args
  const rawURL = typeof url === 'string' ? url.trim() : ''
  if (!rawURL) return null

  if (rawURL.startsWith(PAYLOAD_MEDIA_FILE_PREFIX)) {
    return rawURL
  }

  const absoluteURL = normalizeAbsoluteURL(rawURL)
  if (!absoluteURL) return null

  if (!isSupabaseStorageURL(absoluteURL)) {
    return absoluteURL
  }

  if (isSupabasePublicStorageURL(absoluteURL)) {
    return absoluteURL
  }

  const settings = await getS3StorageSettings(payload)
  if (!settings.enabled || !settings.bucket) {
    return absoluteURL
  }

  const objectPath = getSupabaseStorageObjectPathFromURL({
    bucket: settings.bucket,
    url: absoluteURL,
  })

  if (!objectPath) {
    return absoluteURL
  }

  if (!settings.signedDownloads) {
    return getSupabaseStoragePublicUrl({
      bucket: settings.bucket,
      path: objectPath,
    })
  }

  try {
    return await createSupabaseStorageSignedUrl({
      bucket: settings.bucket,
      expiresIn: ttlSeconds,
      path: objectPath,
    })
  } catch (error) {
    payload.logger.warn({
      error: error instanceof Error ? error.message : String(error),
      msg: 'Supabase Storage signed URL creation failed; returning original media URL.',
    })
    return absoluteURL
  }
}
