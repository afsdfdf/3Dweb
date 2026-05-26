/* eslint-disable @next/next/no-img-element */
import Link from 'next/link'

import { AuthModalStage } from '@/components/auth/AuthModalStage'
import { HeroProductRibbon } from '@/components/ui-lab/hero-product-ribbon'
import { TopNavigation, migrationTestNavItems } from '@/components/ui-lab/top-navigation'
import { getPublicBundleBySlug, getPublicBundleList, type PublicBundleCard, type PublicBundleListResult } from '@/lib/bundleService'
import { getCachedPayload } from '@/lib/getCachedPayload'
import { getSupabasePreviewImageURL } from '@/lib/supabase/imageTransform'

import { getCurrentNavUser } from '../_lib/session'
import styles from './page.module.css'

type BundlesPageProps = {
  searchParams?: Promise<{
    page?: string
    q?: string
    type?: string
  }>
}

type SpotlightBundle = PublicBundleCard & {
  imageSrc?: null | string
}

const bundleTypeFilters = [
  { label: 'All', value: '' },
  { label: 'Starter', value: 'starter' },
  { label: 'Theme', value: 'theme-pack' },
  { label: 'Characters', value: 'character-pack' },
  { label: 'Terrain', value: 'terrain-pack' },
  { label: 'Event', value: 'event-pack' },
  { label: 'Monthly', value: 'monthly-release' },
]

const normalizeText = (value: unknown) => {
  return typeof value === 'string' && value.trim() ? value.trim() : ''
}

function buildBundlesHref(args: { page?: number; query?: string; type?: string }) {
  const params = new URLSearchParams()
  const query = normalizeText(args.query)
  const type = normalizeText(args.type)

  if (query) params.set('q', query)
  if (type) params.set('type', type)
  if (args.page && args.page > 1) params.set('page', String(args.page))

  const suffix = params.toString()
  return suffix ? `/bundles?${suffix}` : '/bundles'
}

function getEmptyBundleList(args: { limit: number; page: number }): PublicBundleListResult {
  return {
    bundles: [],
    pagination: {
      hasNextPage: false,
      hasPrevPage: args.page > 1,
      limit: args.limit,
      page: args.page,
      totalDocs: 0,
      totalPages: 1,
    },
  }
}

function getPriceLabel(bundle: PublicBundleCard) {
  if (bundle.ctaMode === 'coming-soon') return 'Coming Soon'
  if (bundle.priceCredits > 0) return `${bundle.priceCredits} Credits`
  return 'Free Preview'
}

function BundleTagList({ bundle }: { bundle: PublicBundleCard }) {
  const tags = bundle.tags.length > 0 ? bundle.tags.slice(0, 5) : [bundle.bundleTypeLabel, bundle.modelCountLabel]

  return (
    <div className={styles.tagRow}>
      {tags.map((tag) => (
        <span key={tag}>{tag}</span>
      ))}
    </div>
  )
}

function SpotlightCard({ bundle }: { bundle: SpotlightBundle }) {
  return (
    <article className={styles.spotlightCard}>
      <Link className={styles.spotlightImageLink} href={bundle.href}>
        {bundle.imageSrc ? (
          <img
            alt={bundle.title}
            className={styles.spotlightImage}
            decoding="async"
            fetchPriority="high"
            src={getSupabasePreviewImageURL(bundle.imageSrc, 'home-feature')}
          />
        ) : (
          <div className={styles.emptyImage}>No cover image</div>
        )}
      </Link>
      <div className={styles.spotlightBody}>
        <div className={styles.metaPills}>
          <span className={styles.metaPillPrimary}>{bundle.badgeLabel}</span>
          <span>{bundle.bundleTypeLabel}</span>
          <span>{bundle.modelCountLabel}</span>
        </div>
        <h2>
          <Link href={bundle.href}>{bundle.title}</Link>
        </h2>
        {bundle.subtitle ? <p className={styles.subtitle}>{bundle.subtitle}</p> : null}
        <p className={styles.summary}>{bundle.summary}</p>
        <BundleTagList bundle={bundle} />
        <div className={styles.cardActions}>
          <Link className={[styles.actionButton, styles.primaryAction].join(' ')} href={bundle.href}>
            View bundle
          </Link>
          <Link className={styles.actionButton} href="/workbench">
            Use in Workbench
          </Link>
        </div>
      </div>
    </article>
  )
}

function ResultCard({ bundle }: { bundle: PublicBundleCard }) {
  return (
    <article className={styles.resultCard}>
      <Link className={styles.resultImageLink} href={bundle.href}>
        {bundle.coverSrc ? (
          <img
            alt={bundle.title}
            className={styles.resultImage}
            decoding="async"
            loading="lazy"
            src={getSupabasePreviewImageURL(bundle.coverSrc, 'model-card')}
          />
        ) : (
          <div className={styles.emptyImage}>No cover image</div>
        )}
        <HeroProductRibbon className={styles.cardRibbon} label={bundle.badgeLabel} />
      </Link>
      <div className={styles.resultBody}>
        <div className={styles.resultMeta}>
          <span>{bundle.bundleTypeLabel}</span>
          <span>{bundle.modelCountLabel}</span>
          <span>{getPriceLabel(bundle)}</span>
        </div>
        <h2>
          <Link href={bundle.href}>{bundle.title}</Link>
        </h2>
        <p>{bundle.summary}</p>
        <Link className={styles.inlineLink} href={bundle.href}>
          Open bundle
        </Link>
      </div>
    </article>
  )
}

function Pager({
  currentPage,
  currentQuery,
  currentType,
  list,
}: {
  currentPage: number
  currentQuery: string
  currentType: string
  list: PublicBundleListResult
}) {
  if (list.pagination.totalPages <= 1) return null

  return (
    <nav aria-label="Bundle pages" className={styles.pager}>
      {list.pagination.hasPrevPage ? (
        <Link href={buildBundlesHref({ page: Math.max(1, currentPage - 1), query: currentQuery, type: currentType })}>
          Previous
        </Link>
      ) : (
        <span aria-disabled="true">Previous</span>
      )}
      <strong>
        Page {list.pagination.page} / {list.pagination.totalPages}
      </strong>
      {list.pagination.hasNextPage ? (
        <Link href={buildBundlesHref({ page: Math.min(list.pagination.totalPages, currentPage + 1), query: currentQuery, type: currentType })}>
          Next
        </Link>
      ) : (
        <span aria-disabled="true">Next</span>
      )}
    </nav>
  )
}

export default async function BundlesPage({ searchParams }: BundlesPageProps) {
  const query = (await searchParams) ?? {}
  const currentType = normalizeText(query.type)
  const currentQuery = normalizeText(query.q)
  const currentPage = Math.max(1, Number(query.page || 1) || 1)
  const bundleLimit = 12
  const payload = await getCachedPayload()
  const [navUser, bundleList] = await Promise.all([
    getCurrentNavUser(),
    getPublicBundleList(payload, {
      bundleType: currentType,
      limit: bundleLimit,
      page: currentPage,
      query: currentQuery,
      withPagination: true,
    }).catch(() => getEmptyBundleList({ limit: bundleLimit, page: currentPage })),
  ])
  const featuredBundle = bundleList.bundles.find((bundle) => bundle.isFeatured) ?? bundleList.bundles[0] ?? null
  const featuredDetail = featuredBundle ? await getPublicBundleBySlug(payload, featuredBundle.slug).catch(() => null) : null
  const spotlightBundle = featuredBundle
    ? {
        ...featuredBundle,
        imageSrc: featuredDetail?.heroSrc ?? featuredBundle.coverSrc,
      }
    : null
  const remainingBundles = spotlightBundle
    ? bundleList.bundles.filter((bundle) => bundle.id !== spotlightBundle.id)
    : bundleList.bundles

  return (
    <main className={styles.page}>
      <AuthModalStage>
        <TopNavigation active="SHOWCASE" className={styles.topNavigation} fitViewport items={migrationTestNavItems} user={navUser} />
        <header className={styles.mobileHeader}>
          <Link href="/" aria-label="Thorns Tavern home">
            <img alt="Thorns Tavern" src="/ui-lab/top-navigation/logo-wordmark.png" />
          </Link>
          <nav aria-label="Mobile navigation">
            <Link href="/workbench">Workbench</Link>
            <Link href="/pricing">Plans</Link>
          </nav>
        </header>
        <div className={styles.shell}>
          <section className={styles.headerSection}>
            <div className={styles.headerCopy}>
              <span className={styles.eyebrow}>Model Bundles</span>
              <h1>Curated model packs for tabletop worlds</h1>
              <p>Browse themed sets assembled from public models, then open the included previews or continue the theme in Workbench.</p>
            </div>
            <form action="/bundles" className={styles.searchForm}>
              <label className={styles.srOnly} htmlFor="bundle-search">
                Search bundles
              </label>
              <input
                defaultValue={currentQuery}
                id="bundle-search"
                name="q"
                placeholder="Search model packs"
                type="search"
              />
              {currentType ? <input name="type" type="hidden" value={currentType} /> : null}
              <button type="submit">Search</button>
            </form>
          </section>

          <nav aria-label="Bundle types" className={styles.filterRow}>
            {bundleTypeFilters.map((filter) => {
              const active = currentType === filter.value

              return (
                <Link
                  className={[styles.filterChip, active ? styles.filterChipActive : ''].filter(Boolean).join(' ')}
                  href={buildBundlesHref({ query: currentQuery, type: filter.value })}
                  key={filter.value || 'all'}
                >
                  {filter.label}
                </Link>
              )
            })}
          </nav>

          {spotlightBundle ? <SpotlightCard bundle={spotlightBundle} /> : null}

          {remainingBundles.length > 0 ? (
            <section aria-label="More bundles" className={styles.resultGrid}>
              {remainingBundles.map((bundle) => (
                <ResultCard bundle={bundle} key={bundle.id} />
              ))}
            </section>
          ) : spotlightBundle ? null : (
            <section className={styles.emptyState}>
              <h2>No bundles found</h2>
              <p>Published bundles will appear here after they are marked visible and include public models.</p>
              <Link className={styles.actionButton} href="/bundles">
                Reset filters
              </Link>
            </section>
          )}

          <Pager currentPage={currentPage} currentQuery={currentQuery} currentType={currentType} list={bundleList} />
        </div>
      </AuthModalStage>
    </main>
  )
}
