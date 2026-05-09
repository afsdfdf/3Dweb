import { BlogCategoryTabs, BlogEmptyState, BlogHero, BlogPagination, BlogPostCard, BlogSearchForm, BlogShell, BlogSidebar, FeaturedPostCard } from './_components/BlogComponents'
import { getBlogPageContent } from './_lib/blogPageContent'
import { getBlogListData, normalizeBlogCategory, normalizeBlogPage, normalizeBlogQuery } from './_lib/blogData'
import { getMarketingSiteData } from '../_lib/marketing'
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
  const [navUser, marketing, blog, blogPage] = await Promise.all([
    getCurrentNavUser(),
    getMarketingSiteData(),
    getBlogListData({
      category: activeCategory,
      page,
      query,
    }),
    getBlogPageContent(),
  ])

  return (
    <BlogShell navUser={navUser} siteSettings={marketing.siteSettings}>
      <div className={styles.shell}>
        <BlogHero content={blogPage} totalPosts={blog.pagination.totalDocs} />
        {blog.featuredPost ? <FeaturedPostCard post={blog.featuredPost} /> : null}
        <section className={styles.toolbar} aria-label="Journal filters">
          <BlogCategoryTabs activeCategory={blog.activeCategory} />
          <BlogSearchForm activeCategory={blog.activeCategory} query={blog.query} />
        </section>
        <section className={styles.contentGrid}>
          <div className={styles.postGridWrap}>
            {blog.posts.length > 0 ? (
              <div className={styles.postGrid}>
                {blog.posts.map((post) => (
                  <BlogPostCard key={post.id} post={post} />
                ))}
              </div>
            ) : blog.featuredPost ? null : (
              <BlogEmptyState />
            )}
            <BlogPagination activeCategory={blog.activeCategory} pagination={blog.pagination} query={blog.query} />
          </div>
          <BlogSidebar featuredPost={blog.featuredPost} posts={blog.posts} />
        </section>
      </div>
    </BlogShell>
  )
}
