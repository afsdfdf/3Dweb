import { getCachedPayload } from '@/lib/getCachedPayload'

import { getCurrentLocale } from '../../_lib/locale-server'
import {
  defaultBlogPageContent,
  type BlogPageArticleCTA,
  type BlogPageArticleLabels,
  type BlogPageCTA,
  type BlogPageCategoryLabels,
  type BlogPageContent,
  type BlogPageListingLabels,
  type BlogPagePaginationLabels,
} from './blogPageDefaults'
import { getGuestReadableBlogImageURL, normalizeBlogHref } from './blogSafety'

type CMSBlogPage = Partial<Omit<BlogPageContent, 'categoryLabels' | 'heroImageAlt' | 'heroImageSrc' | 'heroPrimaryCTA' | 'heroSecondaryCTA'>> & {
  articleCTA?: null | Partial<Omit<BlogPageArticleCTA, 'primaryCTA' | 'secondaryCTA'>> & {
    primaryCTA?: null | Partial<BlogPageCTA>
    secondaryCTA?: null | Partial<BlogPageCTA>
  }
  articleLabels?: null | Partial<BlogPageArticleLabels>
  categoryLabels?: null | Partial<BlogPageCategoryLabels>
  heroImage?: null | unknown
  heroImageAlt?: null | string
  heroPrimaryCTA?: null | Partial<BlogPageCTA>
  heroSecondaryCTA?: null | Partial<BlogPageCTA>
  listingLabels?: null | Partial<BlogPageListingLabels>
  paginationLabels?: null | Partial<BlogPagePaginationLabels>
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
  const fallbackHref = normalizeBlogHref(fallback.href, '/') || '/'

  return {
    href: normalizeBlogHref(value?.href, fallbackHref) || fallbackHref,
    label: pickText(value?.label, fallback.label),
  }
}

function resolveOptionalCTA(fallback?: BlogPageCTA, value?: null | Partial<BlogPageCTA>) {
  const sourceHref = pickOptionalText(value?.href)
  const sourceLabel = pickOptionalText(value?.label)

  if (!fallback && (!sourceHref || !sourceLabel)) return undefined

  return resolveCTA(fallback || { href: sourceHref || '/', label: sourceLabel || 'Learn more' }, value)
}

function getImageAlt(value: unknown, fallback: string) {
  if (!isRecord(value)) return fallback
  return pickText(value.alt, fallback)
}

function resolveCategoryLabels(fallback: BlogPageCategoryLabels, value?: null | Partial<BlogPageCategoryLabels>): BlogPageCategoryLabels {
  return {
    announcements: pickText(value?.announcements, fallback.announcements),
    all: pickText(value?.all, fallback.all),
    articles: pickText(value?.articles, fallback.articles),
    events: pickText(value?.events, fallback.events),
  }
}

function resolveBlogListingLabels(fallback: BlogPageListingLabels, value?: null | Partial<BlogPageListingLabels>): BlogPageListingLabels {
  return {
    dateFallbackLabel: pickText(value?.dateFallbackLabel, fallback.dateFallbackLabel),
    defaultExcerpt: pickText(value?.defaultExcerpt, fallback.defaultExcerpt),
    emptyCTAHref: pickText(value?.emptyCTAHref, fallback.emptyCTAHref),
    emptyCTALabel: pickText(value?.emptyCTALabel, fallback.emptyCTALabel),
    emptyText: pickText(value?.emptyText, fallback.emptyText),
    emptyTitle: pickText(value?.emptyTitle, fallback.emptyTitle),
    pinnedEmptyText: pickText(value?.pinnedEmptyText, fallback.pinnedEmptyText),
    pinnedTitle: pickText(value?.pinnedTitle, fallback.pinnedTitle),
    readArticleLabel: pickText(value?.readArticleLabel, fallback.readArticleLabel),
    readingTimeSuffix: pickText(value?.readingTimeSuffix, fallback.readingTimeSuffix),
    searchAriaLabel: pickText(value?.searchAriaLabel, fallback.searchAriaLabel),
    searchButtonLabel: pickText(value?.searchButtonLabel, fallback.searchButtonLabel),
    searchPlaceholder: pickText(value?.searchPlaceholder, fallback.searchPlaceholder),
  }
}

function resolveBlogPaginationLabels(fallback: BlogPagePaginationLabels, value?: null | Partial<BlogPagePaginationLabels>): BlogPagePaginationLabels {
  return {
    nextLabel: pickText(value?.nextLabel, fallback.nextLabel),
    ofLabel: pickText(value?.ofLabel, fallback.ofLabel),
    pageLabel: pickText(value?.pageLabel, fallback.pageLabel),
    previousLabel: pickText(value?.previousLabel, fallback.previousLabel),
  }
}

function resolveBlogArticleLabels(fallback: BlogPageArticleLabels, value?: null | Partial<BlogPageArticleLabels>): BlogPageArticleLabels {
  return {
    articleImageFallbackAlt: pickText(value?.articleImageFallbackAlt, fallback.articleImageFallbackAlt),
    breadcrumbRootLabel: pickText(value?.breadcrumbRootLabel, fallback.breadcrumbRootLabel),
    emptyBodyText: pickText(value?.emptyBodyText, fallback.emptyBodyText),
    relatedEyebrow: pickText(value?.relatedEyebrow, fallback.relatedEyebrow),
    relatedTitle: pickText(value?.relatedTitle, fallback.relatedTitle),
    videoEyebrow: pickText(value?.videoEyebrow, fallback.videoEyebrow),
    videoFallbackLabel: pickText(value?.videoFallbackLabel, fallback.videoFallbackLabel),
    videoIframeTitle: pickText(value?.videoIframeTitle, fallback.videoIframeTitle),
    videoOpenLabel: pickText(value?.videoOpenLabel, fallback.videoOpenLabel),
  }
}

function resolveBlogArticleCTA(fallback: BlogPageArticleCTA, value?: null | CMSBlogPage['articleCTA']): BlogPageArticleCTA {
  return {
    eyebrow: pickText(value?.eyebrow, fallback.eyebrow),
    primaryCTA: resolveCTA(fallback.primaryCTA, value?.primaryCTA),
    secondaryCTA: resolveCTA(fallback.secondaryCTA, value?.secondaryCTA),
    text: pickText(value?.text, fallback.text),
    title: pickText(value?.title, fallback.title),
  }
}

function resolveBlogPage(fallback: BlogPageContent, value?: null | CMSBlogPage): BlogPageContent {
  if (!value) return fallback

  const heroImageSrc = getGuestReadableBlogImageURL(value.heroImage) || fallback.heroImageSrc

  return {
    articleCTA: resolveBlogArticleCTA(fallback.articleCTA, value.articleCTA),
    articleLabels: resolveBlogArticleLabels(fallback.articleLabels, value.articleLabels),
    categoryLabels: resolveCategoryLabels(fallback.categoryLabels, value.categoryLabels),
    dispatchesLabel: pickText(value.dispatchesLabel, fallback.dispatchesLabel),
    heroEyebrow: pickText(value.heroEyebrow, fallback.heroEyebrow),
    heroImageAlt: pickText(value.heroImageAlt, getImageAlt(value.heroImage, fallback.heroImageAlt)),
    heroImageSrc,
    heroPrimaryCTA: resolveCTA(fallback.heroPrimaryCTA, value.heroPrimaryCTA),
    heroSecondaryCTA: resolveOptionalCTA(fallback.heroSecondaryCTA, value.heroSecondaryCTA),
    heroText: pickText(value.heroText, fallback.heroText),
    heroTitle: pickText(value.heroTitle, fallback.heroTitle),
    listingLabels: resolveBlogListingLabels(fallback.listingLabels, value.listingLabels),
    paginationLabels: resolveBlogPaginationLabels(fallback.paginationLabels, value.paginationLabels),
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
