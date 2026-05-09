import { getCachedPayload } from '@/lib/getCachedPayload'
import { isGuestReadableMedia } from '@/lib/mediaVisibility'

import { getCurrentLocale } from '../../_lib/locale-server'
import { defaultBlogPageContent, type BlogPageCTA, type BlogPageCategoryLabels, type BlogPageContent } from './blogPageDefaults'

type ImageLike = {
  alt?: null | string
  publicAccess?: null | boolean
  purpose?: null | string
  thumbnailURL?: null | string
  url?: null | string
}

type CMSBlogPage = Partial<Omit<BlogPageContent, 'categoryLabels' | 'heroImageAlt' | 'heroImageSrc' | 'heroPrimaryCTA' | 'heroSecondaryCTA'>> & {
  categoryLabels?: null | Partial<BlogPageCategoryLabels>
  heroImage?: null | unknown
  heroImageAlt?: null | string
  heroPrimaryCTA?: null | Partial<BlogPageCTA>
  heroSecondaryCTA?: null | Partial<BlogPageCTA>
}

type FormalPagesGlobalContent = {
  blogPage?: null | CMSBlogPage
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

const hasText = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0

function pickText(value: unknown, fallback: string) {
  return hasText(value) ? value.trim() : fallback
}

function pickOptionalText(value: unknown) {
  return hasText(value) ? value.trim() : undefined
}

function resolveCTA(fallback: BlogPageCTA, value?: null | Partial<BlogPageCTA>): BlogPageCTA {
  return {
    href: pickText(value?.href, fallback.href),
    label: pickText(value?.label, fallback.label),
  }
}

function resolveOptionalCTA(fallback?: BlogPageCTA, value?: null | Partial<BlogPageCTA>) {
  const sourceHref = pickOptionalText(value?.href)
  const sourceLabel = pickOptionalText(value?.label)

  if (!fallback && (!sourceHref || !sourceLabel)) return undefined

  return resolveCTA(fallback || { href: sourceHref || '#', label: sourceLabel || 'Learn more' }, value)
}

function normalizeBrowserMediaURL(value: null | string | undefined) {
  if (!value) return null

  const trimmed = value.trim()
  if (!trimmed) return null
  if (trimmed.startsWith('/')) return trimmed

  try {
    const parsed = new URL(trimmed)

    if ((parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') && parsed.pathname.startsWith('/api/media/file/')) {
      return `${parsed.pathname}${parsed.search}`
    }

    if (parsed.hostname.endsWith('.supabase.co') && parsed.pathname.startsWith('/storage/v1/object/') && !parsed.pathname.startsWith('/storage/v1/object/public/')) {
      return null
    }

    return parsed.toString()
  } catch {
    return null
  }
}

function getImageURL(value: unknown) {
  if (!isRecord(value)) return null

  if ('publicAccess' in value || 'purpose' in value) {
    if (!isGuestReadableMedia(value as ImageLike)) return null
  }

  const thumbnailURL = typeof value.thumbnailURL === 'string' && value.thumbnailURL ? value.thumbnailURL : null
  const url = typeof value.url === 'string' && value.url ? value.url : null

  return normalizeBrowserMediaURL(thumbnailURL || url)
}

function getImageAlt(value: unknown, fallback: string) {
  if (!isRecord(value)) return fallback
  return pickText(value.alt, fallback)
}

function resolveCategoryLabels(fallback: BlogPageCategoryLabels, value?: null | Partial<BlogPageCategoryLabels>): BlogPageCategoryLabels {
  return {
    announcements: pickText(value?.announcements, fallback.announcements),
    articles: pickText(value?.articles, fallback.articles),
    events: pickText(value?.events, fallback.events),
  }
}

function resolveBlogPage(fallback: BlogPageContent, value?: null | CMSBlogPage): BlogPageContent {
  if (!value) return fallback

  const heroImageSrc = getImageURL(value.heroImage) || fallback.heroImageSrc

  return {
    categoryLabels: resolveCategoryLabels(fallback.categoryLabels, value.categoryLabels),
    dispatchesLabel: pickText(value.dispatchesLabel, fallback.dispatchesLabel),
    heroEyebrow: pickText(value.heroEyebrow, fallback.heroEyebrow),
    heroImageAlt: pickText(value.heroImageAlt, getImageAlt(value.heroImage, fallback.heroImageAlt)),
    heroImageSrc,
    heroPrimaryCTA: resolveCTA(fallback.heroPrimaryCTA, value.heroPrimaryCTA),
    heroSecondaryCTA: resolveOptionalCTA(fallback.heroSecondaryCTA, value.heroSecondaryCTA),
    heroText: pickText(value.heroText, fallback.heroText),
    heroTitle: pickText(value.heroTitle, fallback.heroTitle),
    seoDescription: pickText(value.seoDescription, fallback.seoDescription),
    seoTitle: pickText(value.seoTitle, fallback.seoTitle),
  }
}

async function getFormalPagesGlobal() {
  const locale = await getCurrentLocale()

  try {
    const payload = await getCachedPayload()
    return (await payload.findGlobal({
      depth: 1,
      fallbackLocale: 'en' as never,
      locale: locale as never,
      overrideAccess: false,
      slug: 'formal-pages',
    })) as FormalPagesGlobalContent
  } catch {
    return null
  }
}

export async function getBlogPageContent(): Promise<BlogPageContent> {
  const global = await getFormalPagesGlobal()
  return resolveBlogPage(defaultBlogPageContent, global?.blogPage)
}
