import type { Metadata } from 'next'

import type { BlogPageContent } from './blogPageDefaults'
import type { BlogPostDetailData } from './blogTypes'

function getMetadataSiteName(blogPage: BlogPageContent, siteName?: string) {
  if (siteName?.trim()) return siteName.trim()

  const [, suffix] = blogPage.seoTitle.split('|').map((part) => part.trim())
  return suffix || 'Thorns Tavern'
}

export function getBlogPostMetadata(post: BlogPostDetailData, blogPage: BlogPageContent, siteName?: string): Metadata {
  const resolvedSiteName = getMetadataSiteName(blogPage, siteName)
  const title = `${post.title} | ${resolvedSiteName}`

  return {
    description: post.excerpt,
    openGraph: {
      description: post.excerpt,
      images: post.coverSrc ? [{ url: post.coverSrc }] : undefined,
      publishedTime: post.jsonLd.datePublished as string | undefined,
      siteName: resolvedSiteName,
      title,
      type: 'article',
    },
    title,
  }
}
