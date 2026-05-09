import type { Metadata } from 'next'

import type { BlogPostDetailData } from './blogTypes'

export const blogListMetadata: Metadata = {
  description: 'Tutorials, platform updates, creator stories, and 3D production notes from Thorns Tavern.',
  title: 'Tavern Journal | Thorns Tavern',
}

export function getBlogPostMetadata(post: BlogPostDetailData): Metadata {
  return {
    description: post.excerpt,
    openGraph: {
      description: post.excerpt,
      images: post.coverSrc ? [{ url: post.coverSrc }] : undefined,
      publishedTime: post.jsonLd.datePublished as string | undefined,
      title: `${post.title} | Thorns Tavern`,
      type: 'article',
    },
    title: `${post.title} | Thorns Tavern`,
  }
}
