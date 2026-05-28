import { isGuestReadableMedia } from '@/lib/mediaVisibility'

import type { FooterContent } from '../../_lib/marketing-content'

type FooterImageLike = {
  publicAccess?: boolean | null
  purpose?: null | string
  thumbnailURL?: null | string
  url?: null | string
}

export const defaultFooterLogoSrc = '/ui/nav/brand-wordmark.png'

const controlCharacters = /[\u0000-\u001F\u007F]/

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function getTrimmedText(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeFooterImageURL(value: unknown): null | string {
  const trimmed = getTrimmedText(value)
  if (!trimmed || controlCharacters.test(trimmed) || trimmed.startsWith('//')) return null
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

export function normalizeFooterHref(value: unknown) {
  const href = getTrimmedText(value)
  if (!href || controlCharacters.test(href) || href.startsWith('//')) return null
  if (href.startsWith('/') || href.startsWith('#')) return href

  try {
    const parsed = new URL(href)
    const protocol = parsed.protocol.toLowerCase()

    return protocol === 'http:' || protocol === 'https:' || protocol === 'mailto:' ? parsed.toString() : null
  } catch {
    return null
  }
}

export function getFooterBrandLogoSrc(footerContent: Pick<FooterContent, 'brandLogo'>) {
  const brandLogo = footerContent.brandLogo
  if (!isRecord(brandLogo) || !isGuestReadableMedia(brandLogo as FooterImageLike)) return defaultFooterLogoSrc

  return normalizeFooterImageURL(brandLogo.thumbnailURL || brandLogo.url) || defaultFooterLogoSrc
}
