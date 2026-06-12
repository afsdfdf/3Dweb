/* eslint-disable @next/next/no-img-element */
import Link from 'next/link'
import type { ReactNode } from 'react'
import { ArrowRight, BookOpen, ExternalLink, Play, Search, Sparkles } from 'lucide-react'

import { AuthModalStage } from '@/components/auth/AuthModalStage'
import { TopNavigation } from '@/components/ui-lab/top-navigation'
import { getPublicNavigationActiveID, resolvePublicNavigationItems } from '@/lib/publicNavigation'
import { getSupabasePreviewImageURL } from '@/lib/supabase/imageTransform'

import { FooterBar } from '../../_components/shell/FooterBar'
import type { getMarketingSiteSettings } from '../../_lib/marketing'
import type { getCurrentNavUser } from '../../_lib/session'
import type { BlogPageContent } from '../_lib/blogPageDefaults'
import { isInternalBlogHref, normalizeBlogHref } from '../_lib/blogSafety'
import type { BlogCategory, BlogListData, BlogPagination as BlogPaginationData, BlogPostCardData, BlogPostDetailData } from '../_lib/blogTypes'
import styles from '../page.module.css'

type SiteSettings = Awaited<ReturnType<typeof getMarketingSiteSettings>>
type NavUser = Awaited<ReturnType<typeof getCurrentNavUser>>

const categoryTabs: { href: string; labelKey: keyof BlogPageContent['categoryLabels']; value: BlogCategory | null }[] = [
  { href: '/blog', labelKey: 'all', value: null },
  { href: '/blog?category=article', labelKey: 'articles', value: 'article' },
  { href: '/blog?category=event', labelKey: 'events', value: 'event' },
  { href: '/blog?category=announcement', labelKey: 'announcements', value: 'announcement' },
]

function buildPageHref(args: { category?: BlogCategory | null; page?: number; query?: string }) {
  const params = new URLSearchParams()

  if (args.category) params.set('category', args.category)
  if (args.query) params.set('q', args.query)
  if (args.page && args.page > 1) params.set('page', String(args.page))

  const suffix = params.toString()
  return suffix ? `/blog?${suffix}` : '/blog'
}

function SafeBlogLink({
  children,
  className,
  fallbackHref = '/',
  href,
}: {
  children: ReactNode
  className?: string
  fallbackHref?: string
  href: string
}) {
  const safeHref = normalizeBlogHref(href, fallbackHref) || fallbackHref

  if (isInternalBlogHref(safeHref)) {
    return (
      <Link className={className} href={safeHref}>
        {children}
      </Link>
    )
  }

  return (
    <a className={className} href={safeHref} rel="noreferrer" target="_blank">
      {children}
    </a>
  )
}

function PostImage({
  className,
  post,
  siteName,
}: {
  className?: string
  post: BlogPostCardData
  siteName: string
}) {
  if (post.coverSrc) {
    return <img alt={post.coverAlt} className={className} decoding="async" src={getSupabasePreviewImageURL(post.coverSrc, 'home-feature')} />
  }

  return (
    <div className={[styles.placeholderImage, className].filter(Boolean).join(' ')} aria-label={post.coverAlt} role="img">
      <span>{siteName}</span>
    </div>
  )
}

function getSafeVideoURL(value: null | string) {
  if (!value) return null

  try {
    const parsed = new URL(value)
    return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? parsed : null
  } catch {
    return null
  }
}

function getEmbeddableVideoURL(value: null | string) {
  const parsed = getSafeVideoURL(value)
  if (!parsed) return null

  const host = parsed.hostname.replace(/^www\./, '')

  if (host === 'youtube.com' || host === 'm.youtube.com') {
    const videoId = parsed.searchParams.get('v')
    return videoId ? `https://www.youtube.com/embed/${encodeURIComponent(videoId)}` : null
  }

  if (host === 'youtu.be') {
    const videoId = parsed.pathname.split('/').filter(Boolean)[0]
    return videoId ? `https://www.youtube.com/embed/${encodeURIComponent(videoId)}` : null
  }

  if (host === 'vimeo.com') {
    const videoId = parsed.pathname.split('/').filter(Boolean)[0]
    return videoId ? `https://player.vimeo.com/video/${encodeURIComponent(videoId)}` : null
  }

  return null
}

export function BlogShell({
  children,
  navUser,
  siteSettings,
}: {
  children: ReactNode
  navUser: NavUser
  siteSettings: SiteSettings
}) {
  const siteDescription = siteSettings.siteDescription || 'An AI 3D product platform for character creation, asset management, and print fulfillment.'
  const siteName = siteSettings.siteName || 'Thorns Tavern'
  const supportEmail = siteSettings.supportEmail || 'support@example.com'
  const navigationItems = resolvePublicNavigationItems(siteSettings.headerNav)
  const mobileNavigationItems = navigationItems.filter((item) => item.href !== '/').slice(0, 3)

  return (
    <main className={styles.page}>
      <AuthModalStage>
        <TopNavigation
          active={getPublicNavigationActiveID('/blog', navigationItems)}
          className={styles.topNavigation}
          fitViewport
          items={navigationItems}
          subscriptionPromotion={siteSettings.navigationPromotion}
          user={navUser}
        />
        <header className={styles.mobileHeader}>
          <Link href="/" aria-label={`${siteName} home`}>
            <img alt={siteName} src="/ui-lab/top-navigation/logo-wordmark.png" />
          </Link>
          <nav aria-label="Mobile navigation">
            {mobileNavigationItems.map((item) => (
              <Link href={item.href} key={item.href}>
                {item.label}
              </Link>
            ))}
          </nav>
        </header>
        {children}
        <FooterBar footerContent={siteSettings.footer} siteDescription={siteDescription} supportEmail={supportEmail} />
      </AuthModalStage>
    </main>
  )
}

export function BlogHero({ content, totalPosts }: { content: BlogPageContent; totalPosts: number }) {
  return (
    <section className={styles.hero}>
      <div className={styles.heroImageShell}>
        <img
          alt={content.heroImageAlt}
          className={styles.heroImage}
          decoding="async"
          src={content.heroImageSrc}
        />
      </div>
      <div className={styles.heroContent}>
        <div>
          <span className={styles.eyebrow}>{content.heroEyebrow}</span>
          <h1>{content.heroTitle}</h1>
          <p>{content.heroText}</p>
          <div className={styles.metaPills}>
            <span>
              {totalPosts} {content.dispatchesLabel}
            </span>
            <span>{content.categoryLabels.articles}</span>
            <span>{content.categoryLabels.events}</span>
            <span>{content.categoryLabels.announcements}</span>
          </div>
        </div>
        <div className={styles.heroActions}>
          <SafeBlogLink className={[styles.actionButton, styles.primaryAction].join(' ')} href={content.heroPrimaryCTA.href}>
            {content.heroPrimaryCTA.label}
            <ArrowRight aria-hidden="true" size={18} />
          </SafeBlogLink>
          {content.heroSecondaryCTA ? (
            <SafeBlogLink className={styles.actionButton} href={content.heroSecondaryCTA.href}>
              {content.heroSecondaryCTA.label}
              <ArrowRight aria-hidden="true" size={18} />
            </SafeBlogLink>
          ) : null}
        </div>
      </div>
    </section>
  )
}

export function FeaturedPostCard({
  post,
  readArticleLabel,
  siteName,
}: {
  post: BlogPostCardData
  readArticleLabel: string
  siteName: string
}) {
  return (
    <article className={styles.featuredCard}>
      <Link className={styles.featuredImageLink} href={post.href}>
        <PostImage className={styles.featuredImage} post={post} siteName={siteName} />
      </Link>
      <div className={styles.featuredCopy}>
        <span className={styles.eyebrow}>{post.categoryLabel}</span>
        <h2>
          <Link href={post.href}>{post.title}</Link>
        </h2>
        <p>{post.excerpt}</p>
        <div className={styles.postMeta}>
          <span>{post.publishedLabel}</span>
          <span>{post.readingTimeLabel}</span>
        </div>
        <Link className={styles.inlineLink} href={post.href}>
          {readArticleLabel}
          <ArrowRight aria-hidden="true" size={16} />
        </Link>
      </div>
    </article>
  )
}

export function BlogCategoryTabs({
  activeCategory,
  labels,
}: {
  activeCategory: BlogCategory | null
  labels: BlogPageContent['categoryLabels']
}) {
  return (
    <nav aria-label="Journal categories" className={styles.categoryTabs}>
      {categoryTabs.map((tab) => (
        <Link className={tab.value === activeCategory ? styles.activeTab : ''} href={tab.href} key={tab.labelKey}>
          {labels[tab.labelKey]}
        </Link>
      ))}
    </nav>
  )
}

export function BlogSearchForm({
  activeCategory,
  labels,
  query,
}: {
  activeCategory: BlogCategory | null
  labels: BlogPageContent['listingLabels']
  query: string
}) {
  return (
    <form action="/blog" className={styles.searchForm}>
      {activeCategory ? <input name="category" type="hidden" value={activeCategory} /> : null}
      <Search aria-hidden="true" size={18} />
      <input aria-label={labels.searchAriaLabel} defaultValue={query} maxLength={80} name="q" placeholder={labels.searchPlaceholder} />
      <button type="submit">{labels.searchButtonLabel}</button>
    </form>
  )
}

export function BlogPostCard({ post, siteName }: { post: BlogPostCardData; siteName: string }) {
  return (
    <article className={styles.postCard}>
      <Link className={styles.cardImageLink} href={post.href}>
        <PostImage className={styles.cardImage} post={post} siteName={siteName} />
      </Link>
      <div className={styles.cardBody}>
        <span className={styles.cardCategory}>{post.categoryLabel}</span>
        <h2>
          <Link href={post.href}>{post.title}</Link>
        </h2>
        <p>{post.excerpt}</p>
        <div className={styles.postMeta}>
          <span>{post.publishedLabel}</span>
          <span>{post.readingTimeLabel}</span>
        </div>
      </div>
    </article>
  )
}

export function BlogEmptyState({ labels }: { labels: BlogPageContent['listingLabels'] }) {
  return (
    <section className={styles.emptyState}>
      <Sparkles aria-hidden="true" size={26} />
      <h2>{labels.emptyTitle}</h2>
      <p>{labels.emptyText}</p>
      <SafeBlogLink className={[styles.actionButton, styles.primaryAction].join(' ')} href={labels.emptyCTAHref}>
        {labels.emptyCTALabel}
        <ArrowRight aria-hidden="true" size={18} />
      </SafeBlogLink>
    </section>
  )
}

export function BlogPagination({
  activeCategory,
  labels,
  pagination,
  query,
}: {
  activeCategory: BlogCategory | null
  labels: BlogPageContent['paginationLabels']
  pagination: BlogPaginationData
  query: string
}) {
  if (!pagination.hasNextPage && !pagination.hasPrevPage) return null

  return (
    <nav aria-label="Journal pagination" className={styles.pagination}>
      {pagination.hasPrevPage ? (
        <Link href={buildPageHref({ category: activeCategory, page: Math.max(1, pagination.page - 1), query })}>{labels.previousLabel}</Link>
      ) : (
        <span>{labels.previousLabel}</span>
      )}
      <strong>
        {labels.pageLabel} {pagination.page} {labels.ofLabel} {pagination.totalPages}
      </strong>
      {pagination.hasNextPage ? (
        <Link href={buildPageHref({ category: activeCategory, page: pagination.page + 1, query })}>{labels.nextLabel}</Link>
      ) : (
        <span>{labels.nextLabel}</span>
      )}
    </nav>
  )
}

export function BlogSidebar({
  cta,
  featuredPost,
  labels,
  posts,
}: Pick<BlogListData, 'featuredPost' | 'posts'> & {
  cta: BlogPageContent['articleCTA']
  labels: BlogPageContent['listingLabels']
}) {
  const sidebarPosts = [featuredPost, ...posts].filter(Boolean).slice(0, 4) as BlogPostCardData[]

  return (
    <aside className={styles.sidebar}>
      <section className={styles.sidebarPanel}>
        <BookOpen aria-hidden="true" size={22} />
        <h2>{labels.pinnedTitle}</h2>
        <div className={styles.sidebarList}>
          {sidebarPosts.length > 0 ? (
            sidebarPosts.map((post) => (
              <Link href={post.href} key={post.id}>
                <span>{post.categoryLabel}</span>
                <strong>{post.title}</strong>
              </Link>
            ))
          ) : (
            <p>{labels.pinnedEmptyText}</p>
          )}
        </div>
      </section>
      <BlogCTA compact cta={cta} />
    </aside>
  )
}

export function BlogCTA({
  compact = false,
  cta,
}: {
  compact?: boolean
  cta: BlogPageContent['articleCTA']
}) {
  return (
    <section className={compact ? styles.sidebarCta : styles.articleCta}>
      <span className={styles.eyebrow}>{cta.eyebrow}</span>
      <h2>{cta.title}</h2>
      <p>{cta.text}</p>
      <div className={styles.ctaActions}>
        <SafeBlogLink className={[styles.actionButton, styles.primaryAction].join(' ')} href={cta.primaryCTA.href}>
          {cta.primaryCTA.label}
          <ArrowRight aria-hidden="true" size={18} />
        </SafeBlogLink>
        <SafeBlogLink className={styles.actionButton} href={cta.secondaryCTA.href}>
          {cta.secondaryCTA.label}
          <ArrowRight aria-hidden="true" size={18} />
        </SafeBlogLink>
      </div>
    </section>
  )
}

export function ArticleHero({
  labels,
  post,
  siteName,
}: {
  labels: BlogPageContent['articleLabels']
  post: BlogPostDetailData
  siteName: string
}) {
  return (
    <header className={styles.articleHero}>
      <nav aria-label="Breadcrumb" className={styles.breadcrumb}>
        <Link href="/blog">{labels.breadcrumbRootLabel}</Link>
        <span>/</span>
        <Link href={`/blog?category=${post.category}`}>{post.categoryLabel}</Link>
      </nav>
      <span className={styles.eyebrow}>{post.categoryLabel}</span>
      <h1>{post.title}</h1>
      <p>{post.excerpt}</p>
      <div className={styles.postMeta}>
        <span>{post.publishedLabel}</span>
        <span>{post.readingTimeLabel}</span>
      </div>
      <PostImage className={styles.articleCover} post={post} siteName={siteName} />
    </header>
  )
}

export function BlogVideoBlock({
  labels,
  videoUrl,
}: {
  labels: BlogPageContent['articleLabels']
  videoUrl: null | string
}) {
  const safeURL = getSafeVideoURL(videoUrl)
  if (!safeURL) return null

  const embedURL = getEmbeddableVideoURL(videoUrl)

  return (
    <section className={styles.videoBlock} aria-label="Article video">
      <div className={styles.videoHeader}>
        <span className={styles.eyebrow}>{labels.videoEyebrow}</span>
        <a href={safeURL.toString()} rel="noreferrer" target="_blank">
          {labels.videoOpenLabel}
          <ExternalLink aria-hidden="true" size={15} />
        </a>
      </div>
      {embedURL ? (
        <iframe
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          src={embedURL}
          title={labels.videoIframeTitle}
        />
      ) : (
        <a className={styles.videoLinkCard} href={safeURL.toString()} rel="noreferrer" target="_blank">
          <Play aria-hidden="true" size={22} />
          <span>{labels.videoFallbackLabel}</span>
          <ExternalLink aria-hidden="true" size={16} />
        </a>
      )}
    </section>
  )
}

export function RelatedPosts({
  labels,
  posts,
  siteName,
}: {
  labels: BlogPageContent['articleLabels']
  posts: BlogPostCardData[]
  siteName: string
}) {
  if (posts.length === 0) return null

  return (
    <section className={styles.relatedSection}>
      <div className={styles.sectionHeader}>
        <span className={styles.eyebrow}>{labels.relatedEyebrow}</span>
        <h2>{labels.relatedTitle}</h2>
      </div>
      <div className={styles.relatedGrid}>
        {posts.map((post) => (
          <BlogPostCard key={post.id} post={post} siteName={siteName} />
        ))}
      </div>
    </section>
  )
}
