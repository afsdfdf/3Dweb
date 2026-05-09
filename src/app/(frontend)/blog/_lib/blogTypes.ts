export const blogCategories = ['article', 'event', 'announcement'] as const

export type BlogCategory = (typeof blogCategories)[number]

export type BlogPagination = {
  hasNextPage: boolean
  hasPrevPage: boolean
  limit: number
  page: number
  totalDocs: number
  totalPages: number
}

export type BlogPostCardData = {
  category: BlogCategory
  categoryLabel: string
  coverAlt: string
  coverSrc: null | string
  excerpt: string
  href: string
  id: number
  isPinned: boolean
  publishedLabel: string
  readingTimeLabel: string
  slug: string
  title: string
}

export type BlogPostDetailData = BlogPostCardData & {
  content: unknown
  jsonLd: Record<string, unknown>
  relatedPosts: BlogPostCardData[]
  updatedAt: string
  videoUrl: null | string
}

export type BlogListData = {
  activeCategory: BlogCategory | null
  featuredPost: BlogPostCardData | null
  pagination: BlogPagination
  posts: BlogPostCardData[]
  query: string
}
