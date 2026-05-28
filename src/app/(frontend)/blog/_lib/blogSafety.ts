import { isGuestReadableMedia } from '@/lib/mediaVisibility'

type BlogHrefOptions = {
  allowHash?: boolean
  allowMailto?: boolean
}

type ImageLike = {
  alt?: null | string
  publicAccess?: null | boolean
  purpose?: null | string
  thumbnailURL?: null | string
  url?: null | string
}

const controlCharacters = /[\u0000-\u001F\u007F]/

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function getTrimmedText(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

export function isInternalBlogHref(value: string) {
  return value.startsWith('/') && !value.startsWith('//')
}

export function normalizeBlogHref(
  value: unknown,
  fallback: null | string = null,
  options: BlogHrefOptions = {},
): null | string {
  const trimmed = getTrimmedText(value)
  const normalized = normalizeSingleBlogHref(trimmed, options)

  if (normalized) return normalized
  if (fallback === null) return null

  return normalizeSingleBlogHref(getTrimmedText(fallback), options)
}

export function isSafeBlogHref(value: unknown, options: BlogHrefOptions = {}) {
  return normalizeBlogHref(value, null, options) !== null
}

function normalizeSingleBlogHref(value: string, options: BlogHrefOptions) {
  if (!value || controlCharacters.test(value)) return null
  if (value.startsWith('//')) return null
  if (value.startsWith('/')) return value
  if (options.allowHash && value.startsWith('#')) return value

  try {
    const parsed = new URL(value)
    const protocol = parsed.protocol.toLowerCase()

    if (protocol === 'http:' || protocol === 'https:') {
      return parsed.toString()
    }

    if (options.allowMailto && protocol === 'mailto:') {
      return parsed.toString()
    }

    return null
  } catch {
    return null
  }
}

export function normalizeBlogImageURL(value: unknown): null | string {
  const trimmed = getTrimmedText(value)
  if (!trimmed || controlCharacters.test(trimmed)) return null
  if (trimmed.startsWith('//')) return null
  if (trimmed.startsWith('/')) return trimmed

  try {
    const parsed = new URL(trimmed)

    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return null
    }

    if (
      (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') &&
      parsed.pathname.startsWith('/api/media/file/')
    ) {
      return `${parsed.pathname}${parsed.search}`
    }

    if (
      parsed.hostname.endsWith('.supabase.co') &&
      parsed.pathname.startsWith('/storage/v1/object/') &&
      !parsed.pathname.startsWith('/storage/v1/object/public/')
    ) {
      return null
    }

    return parsed.toString()
  } catch {
    return null
  }
}

export function getGuestReadableBlogImageURL(value: unknown) {
  if (!isRecord(value)) return null

  if (('publicAccess' in value || 'purpose' in value) && !isGuestReadableMedia(value as ImageLike)) {
    return null
  }

  const thumbnailURL = getTrimmedText(value.thumbnailURL)
  const url = getTrimmedText(value.url)

  return normalizeBlogImageURL(thumbnailURL || url)
}
