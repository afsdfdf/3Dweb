import type { Where } from 'payload'

import { getCachedPayload } from '@/lib/getCachedPayload'
import type { Post } from '@/payload-types'

import type { Locale } from '../../_lib/locale'
import { defaultBlogPageContent, type BlogPageCategoryLabels } from './blogPageDefaults'
import { getGuestReadableBlogImageURL } from './blogSafety'
import { blogCategories, type BlogCategory, type BlogListData, type BlogPostCardData, type BlogPostDetailData } from './blogTypes'

const BLOG_PAGE_LIMIT = 12
const RELATED_POST_LIMIT = 3

type LexicalNode = {
  children?: unknown[]
  text?: unknown
  type?: unknown
}

type BlogPostLabelOptions = {
  categoryLabels?: BlogPageCategoryLabels
  dateFallbackLabel?: string
  defaultExcerpt?: string
  locale?: Locale
  readingTimeSuffix?: string
  siteName?: string
}

type ResolvedBlogPostLabelOptions = Required<Omit<BlogPostLabelOptions, 'locale'>> & {
  locale: Locale
}

const defaultCategoryLabels = defaultBlogPageContent.categoryLabels
const defaultLocale: Locale = 'en'

const getLabels = (labels?: BlogPostLabelOptions): ResolvedBlogPostLabelOptions => {
  return {
    categoryLabels: labels?.categoryLabels || defaultCategoryLabels,
    dateFallbackLabel: labels?.dateFallbackLabel || defaultBlogPageContent.listingLabels.dateFallbackLabel,
    defaultExcerpt: labels?.defaultExcerpt || defaultBlogPageContent.listingLabels.defaultExcerpt,
    locale: labels?.locale || defaultLocale,
    readingTimeSuffix: labels?.readingTimeSuffix || defaultBlogPageContent.listingLabels.readingTimeSuffix,
    siteName: labels?.siteName?.trim() || 'Thorns Tavern',
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

export function normalizeBlogCategory(value: unknown): BlogCategory | null {
  return typeof value === 'string' && blogCategories.includes(value as BlogCategory) ? (value as BlogCategory) : null
}

export function normalizeBlogPage(value: unknown) {
  const page = Number(value ?? 1)
  return Number.isFinite(page) && page > 0 ? Math.floor(page) : 1
}

export function normalizeBlogQuery(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim().slice(0, 80) : ''
}

export function normalizeBlogSlug(value: unknown) {
  if (typeof value !== 'string') return ''

  const slug = value.trim()
  if (!slug) return ''

  try {
    return decodeURIComponent(slug).trim()
  } catch {
    return slug
  }
}

export function getBlogCategoryLabel(category: BlogCategory, categoryLabels: BlogPageCategoryLabels = defaultCategoryLabels) {
  const labels: Record<BlogCategory, string> = {
    announcement: categoryLabels.announcements,
    article: categoryLabels.articles,
    event: categoryLabels.events,
  }

  return labels[category]
}

function getImageAlt(value: unknown, fallback: string) {
  if (!isRecord(value)) return fallback
  return typeof value.alt === 'string' && value.alt.trim() ? value.alt.trim() : fallback
}

function getPublishedTime(post: Post) {
  return post.publishedAt || post.createdAt || post.updatedAt
}

function formatPostDate(value: null | string | undefined, fallbackLabel: string, locale: Locale) {
  if (!value) return fallbackLabel

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return fallbackLabel

  return new Intl.DateTimeFormat(locale === 'zh' ? 'zh-CN' : 'en', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function collectLexicalText(value: unknown): string {
  if (!value) return ''

  if (typeof value === 'string') return value

  if (Array.isArray(value)) {
    return value.map(collectLexicalText).filter(Boolean).join(' ')
  }

  if (!isRecord(value)) return ''

  const node = value as LexicalNode
  const currentText = typeof node.text === 'string' ? node.text : ''
  const childText = Array.isArray(node.children) ? node.children.map(collectLexicalText).filter(Boolean).join(' ') : ''

  if (isRecord(value.root)) {
    return collectLexicalText(value.root)
  }

  return [currentText, childText].filter(Boolean).join(' ')
}

export function estimateReadingTime(content: unknown, suffix = defaultBlogPageContent.listingLabels.readingTimeSuffix) {
  const wordCount = collectLexicalText(content).split(/\s+/).filter(Boolean).length
  const minutes = Math.max(1, Math.ceil(wordCount / 220))
  return `${minutes} ${suffix}`
}

function buildPublicPostsWhere(args: { category?: BlogCategory | null; excludeId?: number; query?: string; slug?: string }): Where {
  const clauses: Where[] = [
    {
      _status: {
        equals: 'published',
      },
    },
    {
      isVisible: {
        equals: true,
      },
    },
    {
      title: {
        exists: true,
      },
    },
    {
      or: [
        {
          publishedAt: {
            exists: false,
          },
        },
        {
          publishedAt: {
            less_than_equal: new Date().toISOString(),
          },
        },
      ],
    },
  ]

  if (args.slug) {
    clauses.push({
      slug: {
        equals: args.slug,
      },
    })
  }

  if (args.category) {
    clauses.push({
      category: {
        equals: args.category,
      },
    })
  }

  if (args.excludeId) {
    clauses.push({
      id: {
        not_equals: args.excludeId,
      },
    })
  }

  if (args.query) {
    clauses.push({
      or: [
        {
          title: {
            contains: args.query,
          },
        },
        {
          excerpt: {
            contains: args.query,
          },
        },
      ],
    })
  }

  return { and: clauses }
}

function normalizePostCard(post: Post, labelOptions?: BlogPostLabelOptions): BlogPostCardData {
  const labels = getLabels(labelOptions)
  const category = normalizeBlogCategory(post.category) || 'article'
  const title = post.title || 'Untitled journal note'
  const excerpt = post.excerpt?.trim() || labels.defaultExcerpt
  const coverImage = post.coverImage

  return {
    category,
    categoryLabel: getBlogCategoryLabel(category, labels.categoryLabels),
    coverAlt: getImageAlt(coverImage, title),
    coverSrc: getGuestReadableBlogImageURL(coverImage),
    excerpt,
    href: `/blog/${encodeURIComponent(post.slug)}`,
    id: Number(post.id),
    isPinned: post.isPinned === true,
    publishedLabel: formatPostDate(getPublishedTime(post), labels.dateFallbackLabel, labels.locale),
    readingTimeLabel: estimateReadingTime(post.content, labels.readingTimeSuffix),
    slug: post.slug,
    title,
  }
}

function getEmptyPagination(page: number): BlogListData['pagination'] {
  return {
    hasNextPage: false,
    hasPrevPage: page > 1,
    limit: BLOG_PAGE_LIMIT,
    page,
    totalDocs: 0,
    totalPages: 1,
  }
}

export async function getBlogListData(args: {
  category?: BlogCategory | null
  categoryLabels?: BlogPageCategoryLabels
  dateFallbackLabel?: string
  defaultExcerpt?: string
  locale?: Locale
  page?: number
  query?: string
  readingTimeSuffix?: string
}): Promise<BlogListData> {
  const page = normalizeBlogPage(args.page)
  const query = normalizeBlogQuery(args.query)
  const activeCategory = args.category || null
  const labelOptions = getLabels(args)

  try {
    const payload = await getCachedPayload()
    const result = await payload.find({
      collection: 'posts',
      depth: 1,
      fallbackLocale: false,
      limit: BLOG_PAGE_LIMIT,
      locale: labelOptions.locale,
      overrideAccess: false,
      page,
      pagination: true,
      sort: ['-isPinned', 'sortOrder', '-publishedAt'],
      where: buildPublicPostsWhere({
        category: activeCategory,
        query,
      }),
    })

    const posts = result.docs.map((post) => normalizePostCard(post as Post, labelOptions))
    const featuredPost = posts.find((post) => post.isPinned) || posts[0] || null

    return {
      activeCategory,
      featuredPost,
      pagination: {
        hasNextPage: Boolean(result.hasNextPage),
        hasPrevPage: Boolean(result.hasPrevPage),
        limit: Number(result.limit || BLOG_PAGE_LIMIT),
        page: Number(result.page || page),
        totalDocs: Number(result.totalDocs || 0),
        totalPages: Math.max(1, Number(result.totalPages || 1)),
      },
      posts: featuredPost ? posts.filter((post) => post.id !== featuredPost.id) : posts,
      query,
    }
  } catch {
    return {
      activeCategory,
      featuredPost: null,
      pagination: getEmptyPagination(page),
      posts: [],
      query,
    }
  }
}

export async function getRelatedBlogPosts(post: BlogPostCardData, labelOptions?: BlogPostLabelOptions): Promise<BlogPostCardData[]> {
  try {
    const payload = await getCachedPayload()
    const result = await payload.find({
      collection: 'posts',
      depth: 1,
      fallbackLocale: false,
      limit: RELATED_POST_LIMIT,
      locale: getLabels(labelOptions).locale,
      overrideAccess: false,
      pagination: false,
      sort: ['-isPinned', 'sortOrder', '-publishedAt'],
      where: buildPublicPostsWhere({
        category: post.category,
        excludeId: post.id,
      }),
    })

    return result.docs.map((item) => normalizePostCard(item as Post, labelOptions))
  } catch {
    return []
  }
}

export async function getBlogPostBySlug(slug: string, labelOptions?: BlogPostLabelOptions): Promise<BlogPostDetailData | null> {
  const normalizedSlug = normalizeBlogSlug(slug)
  if (!normalizedSlug) return null

  try {
    const payload = await getCachedPayload()
    const result = await payload.find({
      collection: 'posts',
      depth: 1,
      fallbackLocale: false,
      limit: 1,
      locale: getLabels(labelOptions).locale,
      overrideAccess: false,
      pagination: false,
      where: buildPublicPostsWhere({
        slug: normalizedSlug,
      }),
    })

    const post = result.docs[0] as Post | undefined
    if (!post) return null

    const labels = getLabels(labelOptions)
    const card = normalizePostCard(post, labels)
    const relatedPosts = await getRelatedBlogPosts(card, labels)
    const publisherName = labels.siteName

    return {
      ...card,
      content: post.content,
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'Article',
        author: {
          '@type': 'Organization',
          name: publisherName,
        },
        dateModified: post.updatedAt,
        datePublished: getPublishedTime(post),
        description: card.excerpt,
        headline: card.title,
        image: card.coverSrc || undefined,
        publisher: {
          '@type': 'Organization',
          name: publisherName,
        },
      },
      relatedPosts,
      updatedAt: post.updatedAt,
      videoUrl: typeof post.videoUrl === 'string' && post.videoUrl.trim() ? post.videoUrl.trim() : null,
    }
  } catch {
    return null
  }
}
