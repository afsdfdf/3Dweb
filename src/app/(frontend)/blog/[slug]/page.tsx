import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

import { ArticleHero, BlogCTA, BlogShell, BlogVideoBlock, RelatedPosts } from '../_components/BlogComponents'
import { BlogArticleBody } from '../_components/BlogArticleBody'
import { getBlogPostBySlug } from '../_lib/blogData'
import { getBlogPageContent } from '../_lib/blogPageContent'
import { getBlogPostMetadata } from '../_lib/blogSeo'
import { getCurrentLocale } from '../../_lib/locale-server'
import { getMarketingSiteSettings } from '../../_lib/marketing'
import { getCurrentNavUser } from '../../_lib/session'
import styles from '../page.module.css'

export const revalidate = 60

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const [blogPage, locale] = await Promise.all([getBlogPageContent(), getCurrentLocale()])
  const post = await getBlogPostBySlug(slug, {
    categoryLabels: blogPage.categoryLabels,
    dateFallbackLabel: blogPage.listingLabels.dateFallbackLabel,
    defaultExcerpt: blogPage.listingLabels.defaultExcerpt,
    locale,
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
  const localePromise = getCurrentLocale()
  const navUserPromise = getCurrentNavUser()
  const siteSettingsPromise = getMarketingSiteSettings()
  const [blogPage, locale, siteSettings] = await Promise.all([blogPagePromise, localePromise, siteSettingsPromise])
  const siteName = siteSettings.siteName || 'Thorns Tavern'
  const [navUser, post] = await Promise.all([
    navUserPromise,
    getBlogPostBySlug(slug, {
      categoryLabels: blogPage.categoryLabels,
      dateFallbackLabel: blogPage.listingLabels.dateFallbackLabel,
      defaultExcerpt: blogPage.listingLabels.defaultExcerpt,
      locale,
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
      <script
        dangerouslySetInnerHTML={{
          // Escape `<` so a `</script>` sequence in CMS content cannot break out of
          // the tag, while keeping the JSON-LD valid for crawlers.
          __html: JSON.stringify(post.jsonLd).replace(/</g, '\\u003c'),
        }}
        type="application/ld+json"
      />
    </BlogShell>
  )
}
