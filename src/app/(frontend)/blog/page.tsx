import { BlogCategoryTabs, BlogEmptyState, BlogHero, BlogPagination, BlogPostCard, BlogSearchForm, BlogShell, BlogSidebar, FeaturedPostCard } from './_components/BlogComponents'
import { getBlogPageContent } from './_lib/blogPageContent'
import { getBlogListData, normalizeBlogCategory, normalizeBlogPage, normalizeBlogQuery } from './_lib/blogData'
import { getCurrentLocale } from '../_lib/locale-server'
import { getMarketingSiteSettings } from '../_lib/marketing'
import { getCurrentNavUser } from '../_lib/session'
import styles from './page.module.css'
import type { Metadata } from 'next'

export const revalidate = 60

export async function generateMetadata(): Promise<Metadata> {
  const blogPage = await getBlogPageContent()

  return {
    description: blogPage.seoDescription,
    title: blogPage.seoTitle,
  }
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{
    category?: string
    page?: string
    q?: string
  }>
}) {
  const params = await searchParams
  const activeCategory = normalizeBlogCategory(params.category)
  const page = normalizeBlogPage(params.page)
  const query = normalizeBlogQuery(params.q)
  const blogPagePromise = getBlogPageContent()
  const localePromise = getCurrentLocale()
  const navUserPromise = getCurrentNavUser()
  const siteSettingsPromise = getMarketingSiteSettings()
  const [blogPage, locale] = await Promise.all([blogPagePromise, localePromise])
  const [navUser, siteSettings, blog] = await Promise.all([
    navUserPromise,
    siteSettingsPromise,
    getBlogListData({
      category: activeCategory,
      categoryLabels: blogPage.categoryLabels,
      dateFallbackLabel: blogPage.listingLabels.dateFallbackLabel,
      defaultExcerpt: blogPage.listingLabels.defaultExcerpt,
      locale,
      page,
      query,
      readingTimeSuffix: blogPage.listingLabels.readingTimeSuffix,
    }),
  ])
  const siteName = siteSettings.siteName || 'Thorns Tavern'

  return (
    <BlogShell navUser={navUser} siteSettings={siteSettings}>
      <div className={styles.shell}>
        <BlogHero content={blogPage} totalPosts={blog.pagination.totalDocs} />
        {blog.featuredPost ? <FeaturedPostCard post={blog.featuredPost} readArticleLabel={blogPage.listingLabels.readArticleLabel} siteName={siteName} /> : null}
        <section className={styles.toolbar} aria-label="Journal filters">
          <BlogCategoryTabs activeCategory={blog.activeCategory} labels={blogPage.categoryLabels} />
          <BlogSearchForm activeCategory={blog.activeCategory} labels={blogPage.listingLabels} query={blog.query} />
        </section>
        <section className={styles.contentGrid}>
          <div className={styles.postGridWrap}>
            {blog.posts.length > 0 ? (
              <div className={styles.postGrid}>
                {blog.posts.map((post) => (
                  <BlogPostCard key={post.id} post={post} siteName={siteName} />
                ))}
              </div>
            ) : blog.featuredPost ? null : (
              <BlogEmptyState labels={blogPage.listingLabels} />
            )}
            <BlogPagination activeCategory={blog.activeCategory} labels={blogPage.paginationLabels} pagination={blog.pagination} query={blog.query} />
          </div>
          <BlogSidebar cta={blogPage.articleCTA} featuredPost={blog.featuredPost} labels={blogPage.listingLabels} posts={blog.posts} />
        </section>
      </div>
    </BlogShell>
  )
}
