import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

import { ArticleHero, BlogCTA, BlogShell, BlogVideoBlock, RelatedPosts } from '../_components/BlogComponents'
import { BlogArticleBody } from '../_components/BlogArticleBody'
import { getBlogPostBySlug } from '../_lib/blogData'
import { getBlogPostMetadata } from '../_lib/blogSeo'
import { getMarketingSiteData } from '../../_lib/marketing'
import { getCurrentNavUser } from '../../_lib/session'
import styles from '../page.module.css'

export const revalidate = 60

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = await getBlogPostBySlug(slug)

  if (!post) {
    return {
      title: 'Tavern Journal | Thorns Tavern',
    }
  }

  return getBlogPostMetadata(post)
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const [navUser, marketing, post] = await Promise.all([getCurrentNavUser(), getMarketingSiteData(), getBlogPostBySlug(slug)])

  if (!post) {
    notFound()
  }

  return (
    <BlogShell navUser={navUser} siteSettings={marketing.siteSettings}>
      <div className={styles.articleShell}>
        <article className={styles.article}>
          <ArticleHero post={post} />
          <BlogVideoBlock videoUrl={post.videoUrl} />
          <BlogArticleBody content={post.content} />
        </article>
        <RelatedPosts posts={post.relatedPosts} />
        <BlogCTA />
      </div>
      <script type="application/ld+json">{JSON.stringify(post.jsonLd)}</script>
    </BlogShell>
  )
}
