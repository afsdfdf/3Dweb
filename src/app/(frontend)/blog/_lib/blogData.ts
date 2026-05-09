import type { Where } from 'payload'

import { getCachedPayload } from '@/lib/getCachedPayload'
import { isGuestReadableMedia } from '@/lib/mediaVisibility'
import type { Post } from '@/payload-types'

import { blogCategories, type BlogCategory, type BlogListData, type BlogPostCardData, type BlogPostDetailData } from './blogTypes'

const BLOG_PAGE_LIMIT = 12
const RELATED_POST_LIMIT = 3

type ImageLike = {
  alt?: null | string
  publicAccess?: null | boolean
  purpose?: null | string
  thumbnailURL?: null | string
  url?: null | string
}

type LexicalNode = {
  children?: unknown[]
  text?: unknown
  type?: unknown
}

const categoryLabels: Record<BlogCategory, string> = {
  announcement: 'Announcements',
  article: 'Articles',
  event: 'Events',
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

export function getBlogCategoryLabel(category: BlogCategory) {
  return categoryLabels[category]
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
  return typeof value.alt === 'string' && value.alt.trim() ? value.alt.trim() : fallback
}

function getPublishedTime(post: Post) {
  return post.publishedAt || post.createdAt || post.updatedAt
}

function formatPostDate(value: null | string | undefined) {
  if (!value) return 'Recently'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Recently'

  return new Intl.DateTimeFormat('en', {
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

export function estimateReadingTime(content: unknown) {
  const wordCount = collectLexicalText(content).split(/\s+/).filter(Boolean).length
  const minutes = Math.max(1, Math.ceil(wordCount / 220))
  return `${minutes} min read`
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

function normalizePostCard(post: Post): BlogPostCardData {
  const category = normalizeBlogCategory(post.category) || 'article'
  const title = post.title || 'Untitled journal note'
  const excerpt = post.excerpt?.trim() || 'A production note from the Thorns Tavern team.'
  const coverImage = post.coverImage

  return {
    category,
    categoryLabel: getBlogCategoryLabel(category),
    coverAlt: getImageAlt(coverImage, title),
    coverSrc: getImageURL(coverImage),
    excerpt,
    href: `/blog/${encodeURIComponent(post.slug)}`,
    id: Number(post.id),
    isPinned: post.isPinned === true,
    publishedLabel: formatPostDate(getPublishedTime(post)),
    readingTimeLabel: estimateReadingTime(post.content),
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

export async function getBlogListData(args: { category?: BlogCategory | null; page?: number; query?: string }): Promise<BlogListData> {
  const page = normalizeBlogPage(args.page)
  const query = normalizeBlogQuery(args.query)
  const activeCategory = args.category || null

  try {
    const payload = await getCachedPayload()
    const result = await payload.find({
      collection: 'posts',
      depth: 1,
      fallbackLocale: 'en' as never,
      limit: BLOG_PAGE_LIMIT,
      locale: 'en' as never,
      overrideAccess: false,
      page,
      pagination: true,
      sort: ['-isPinned', 'sortOrder', '-publishedAt'],
      where: buildPublicPostsWhere({
        category: activeCategory,
        query,
      }),
    })

    const posts = result.docs.map((post) => normalizePostCard(post as Post))
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

export async function getRelatedBlogPosts(post: BlogPostCardData): Promise<BlogPostCardData[]> {
  try {
    const payload = await getCachedPayload()
    const result = await payload.find({
      collection: 'posts',
      depth: 1,
      fallbackLocale: 'en' as never,
      limit: RELATED_POST_LIMIT,
      locale: 'en' as never,
      overrideAccess: false,
      pagination: false,
      sort: ['-isPinned', 'sortOrder', '-publishedAt'],
      where: buildPublicPostsWhere({
        category: post.category,
        excludeId: post.id,
      }),
    })

    return result.docs.map((item) => normalizePostCard(item as Post))
  } catch {
    return []
  }
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPostDetailData | null> {
  const normalizedSlug = typeof slug === 'string' ? slug.trim() : ''
  if (!normalizedSlug) return null

  const payload = await getCachedPayload()
  const result = await payload.find({
    collection: 'posts',
    depth: 1,
    fallbackLocale: 'en' as never,
    limit: 1,
    locale: 'en' as never,
    overrideAccess: false,
    pagination: false,
    where: buildPublicPostsWhere({
      slug: normalizedSlug,
    }),
  })

  const post = result.docs[0] as Post | undefined
  if (!post) return null

  const card = normalizePostCard(post)
  const relatedPosts = await getRelatedBlogPosts(card)

  return {
    ...card,
    content: post.content,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Article',
      author: {
        '@type': 'Organization',
        name: 'Thorns Tavern',
      },
      dateModified: post.updatedAt,
      datePublished: getPublishedTime(post),
      description: card.excerpt,
      headline: card.title,
      image: card.coverSrc || undefined,
      publisher: {
        '@type': 'Organization',
        name: 'Thorns Tavern',
      },
    },
    relatedPosts,
    updatedAt: post.updatedAt,
    videoUrl: typeof post.videoUrl === 'string' && post.videoUrl.trim() ? post.videoUrl.trim() : null,
  }
}
