import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

import { ArticleHero, BlogCTA, BlogShell, BlogVideoBlock, RelatedPosts } from '../_components/BlogComponents'
import { BlogArticleBody } from '../_components/BlogArticleBody'
import { getBlogPostBySlug } from '../_lib/blogData'
import { getBlogPageContent } from '../_lib/blogPageContent'
import { getBlogPostMetadata } from '../_lib/blogSeo'
import { getMarketingSiteSettings } from '../../_lib/marketing'
import { getCurrentNavUser } from '../../_lib/session'
import styles from '../page.module.css'

export const revalidate = 60

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const blogPage = await getBlogPageContent()
  const post = await getBlogPostBySlug(slug, {
    categoryLabels: blogPage.categoryLabels,
    dateFallbackLabel: blogPage.listingLabels.dateFallbackLabel,
    defaultExcerpt: blogPage.listingLabels.defaultExcerpt,
    readingTimeSuffix: blogPage.listingLabels.readingTimeSuffix,
  })

  if (!post) {
    return {
      title: blogPage.seoTitle,
    }
  }

  return getBlogPostMetadata(post, blogPage)
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const blogPagePromise = getBlogPageContent()
  const navUserPromise = getCurrentNavUser()
  const siteSettingsPromise = getMarketingSiteSettings()
  const [blogPage, siteSettings] = await Promise.all([blogPagePromise, siteSettingsPromise])
  const siteName = siteSettings.siteName || 'Thorns Tavern'
  const [navUser, post] = await Promise.all([
    navUserPromise,
    getBlogPostBySlug(slug, {
      categoryLabels: blogPage.categoryLabels,
      dateFallbackLabel: blogPage.listingLabels.dateFallbackLabel,
      defaultExcerpt: blogPage.listingLabels.defaultExcerpt,
      readingTimeSuffix: blogPage.listingLabels.readingTimeSuffix,
      siteName,
    }),
  ])

  if (!post) {
    notFound()
  }

  return (
    <BlogShell navUser={navUser} siteSettings={siteSettings}>
      <div className={styles.articleShell}>
        <article className={styles.article}>
          <ArticleHero labels={blogPage.articleLabels} post={post} siteName={siteName} />
          <BlogVideoBlock labels={blogPage.articleLabels} videoUrl={post.videoUrl} />
          <BlogArticleBody content={post.content} labels={blogPage.articleLabels} />
        </article>
        <RelatedPosts labels={blogPage.articleLabels} posts={post.relatedPosts} siteName={siteName} />
        <BlogCTA cta={blogPage.articleCTA} />
      </div>
      <script type="application/ld+json">{JSON.stringify(post.jsonLd)}</script>
    </BlogShell>
  )
}
