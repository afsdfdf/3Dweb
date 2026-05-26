/* eslint-disable @next/next/no-img-element */
import Link from 'next/link'
import type { Where } from 'payload'
import { ArrowRight, Box, Eye, Sparkles } from 'lucide-react'

import { AuthModalStage } from '@/components/auth/AuthModalStage'
import { TopNavigation } from '@/components/ui-lab/top-navigation'
import { getCachedPayload } from '@/lib/getCachedPayload'
import { getMediaAccessURL } from '@/lib/mediaAccessURL'
import { getPublicNavigationActiveID, resolvePublicNavigationItems } from '@/lib/publicNavigation'
import { getSupabasePreviewImageURL } from '@/lib/supabase/imageTransform'

import { getMarketingPageContent } from '../_lib/formal-page-content'
import { getMarketingSiteData } from '../_lib/marketing'
import { getCurrentNavUser } from '../_lib/session'
import { FooterBar } from '../_components/shell/FooterBar'
import styles from './page.module.css'

type ShowcaseModel = {
  formats: string[]
  href: string
  id: number
  previewURL: string | null
  printReady: boolean
  summary: string
  title: string
}

type ShowcaseListResult = {
  models: ShowcaseModel[]
  pagination: {
    hasNextPage: boolean
    hasPrevPage: boolean
    limit: number
    page: number
    totalDocs: number
    totalPages: number
  }
}

type ShowcasePageProps = {
  searchParams?: Promise<{
    page?: string
    q?: string
  }>
}

const SHOWCASE_PAGE_LIMIT = 20

const normalizeText = (value: unknown) => {
  return typeof value === 'string' && value.trim() ? value.trim() : ''
}

const normalizePageNumber = (value: unknown) => {
  const next = Number(value ?? 1)
  return Number.isFinite(next) && next > 0 ? Math.floor(next) : 1
}

function buildShowcaseHref(args: { page?: number; query?: string }) {
  const params = new URLSearchParams()
  const query = normalizeText(args.query)

  if (query) params.set('q', query)
  if (args.page && args.page > 1) params.set('page', String(args.page))

  const suffix = params.toString()
  return suffix ? `/showcase?${suffix}` : '/showcase'
}

function buildShowcaseWhere(query: string): Where {
  const normalizedQuery = normalizeText(query).slice(0, 80)
  const publicWhere: Where = {
    visibility: {
      equals: 'public',
    },
  }

  if (!normalizedQuery) return publicWhere

  return {
    and: [
      publicWhere,
      {
        or: [
          {
            title: {
              contains: normalizedQuery,
            },
          },
          {
            description: {
              contains: normalizedQuery,
            },
          },
          {
            'tags.label': {
              contains: normalizedQuery,
            },
          },
        ],
      },
    ],
  }
}

function getEmptyShowcaseList(args: { limit: number; page: number }): ShowcaseListResult {
  return {
    models: [],
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

function getPreviewURL(model: any) {
  const preview = model?.previewImage
  if (preview && typeof preview === 'object') {
    if (typeof preview.thumbnailURL === 'string' && preview.thumbnailURL) return preview.thumbnailURL
    if (typeof preview.url === 'string' && preview.url) return preview.url
  }

  const sourceTask =
    model?.sourceTask && typeof model.sourceTask === 'object' && !Array.isArray(model.sourceTask) ? model.sourceTask : null
  const callbackPayload =
    sourceTask?.callbackPayload && typeof sourceTask.callbackPayload === 'object' && !Array.isArray(sourceTask.callbackPayload)
      ? sourceTask.callbackPayload
      : null

  return callbackPayload && typeof callbackPayload.thumbnailUrl === 'string' ? callbackPayload.thumbnailUrl : null
}

function getFormats(model: any): string[] {
  const formats = Array.isArray(model?.formats) ? model.formats : []
  const normalizedFormats = formats.map((item: any) => String(item?.format || '').toUpperCase()).filter(Boolean)
  return Array.from(new Set<string>(normalizedFormats)).slice(0, 4)
}

function getModelTags(model: ShowcaseModel) {
  const formatTags = model.formats.length > 0 ? model.formats.slice(0, 2) : ['Preview']
  const readinessTag = model.printReady ? 'Print Ready' : 'Ready'
  return Array.from(new Set([...formatTags, readinessTag])).slice(0, 3)
}

async function getShowcaseModels(args: { limit: number; page: number; query: string }): Promise<ShowcaseListResult> {
  const payload = await getCachedPayload()
  const result = await payload
    .find({
      collection: 'models',
      depth: 2,
      limit: args.limit,
      overrideAccess: false,
      page: args.page,
      pagination: true,
      sort: '-id',
      where: buildShowcaseWhere(args.query),
    })
    .catch(() => null)

  if (!result) return getEmptyShowcaseList({ limit: args.limit, page: args.page })

  const models = await Promise.all(
    result.docs.map(async (model: any) => {
      const id = Number(model.id)
      const previewURL = await getMediaAccessURL({
        payload,
        url: getPreviewURL(model),
      }).catch(() => null)

      return {
        formats: getFormats(model),
        href: `/model-detail?id=${encodeURIComponent(String(id))}`,
        id,
        previewURL,
        printReady: model.printReady === true,
        summary:
          typeof model.description === 'string' && model.description.trim()
            ? model.description
            : 'A real imported 3D model asset connected to preview, delivery, download, and tabletop production workflows.',
        title: typeof model.title === 'string' && model.title.trim() ? model.title : `Showcase ${model.id}`,
      } satisfies ShowcaseModel
    }),
  )

  return {
    models,
    pagination: {
      hasNextPage: Boolean(result.hasNextPage),
      hasPrevPage: Boolean(result.hasPrevPage),
      limit: Number(result.limit || args.limit),
      page: Number(result.page || args.page),
      totalDocs: Number(result.totalDocs || models.length),
      totalPages: Math.max(1, Number(result.totalPages || 1)),
    },
  }
}

function Pager({
  currentPage,
  currentQuery,
  list,
}: {
  currentPage: number
  currentQuery: string
  list: ShowcaseListResult
}) {
  if (list.pagination.totalPages <= 1) return null

  return (
    <nav aria-label="Showcase pages" className={styles.pager}>
      {list.pagination.hasPrevPage ? (
        <Link href={buildShowcaseHref({ page: Math.max(1, currentPage - 1), query: currentQuery })}>Previous</Link>
      ) : (
        <span aria-disabled="true">Previous</span>
      )}
      <strong>
        Page {list.pagination.page} / {list.pagination.totalPages}
      </strong>
      {list.pagination.hasNextPage ? (
        <Link href={buildShowcaseHref({ page: Math.min(list.pagination.totalPages, currentPage + 1), query: currentQuery })}>Next</Link>
      ) : (
        <span aria-disabled="true">Next</span>
      )}
    </nav>
  )
}

export default async function ShowcasePage({ searchParams }: ShowcasePageProps) {
  const query = (await searchParams) ?? {}
  const currentQuery = normalizeText(query.q)
  const currentPage = normalizePageNumber(query.page)
  const [navUser, marketing, pageContent, showcaseList] = await Promise.all([
    getCurrentNavUser(),
    getMarketingSiteData(),
    getMarketingPageContent('showcase'),
    getShowcaseModels({
      limit: SHOWCASE_PAGE_LIMIT,
      page: currentPage,
      query: currentQuery,
    }).catch(() => getEmptyShowcaseList({ limit: SHOWCASE_PAGE_LIMIT, page: currentPage })),
  ])
  const { models, pagination } = showcaseList
  const supportEmail = marketing.siteSettings.supportEmail || 'support@example.com'
  const siteDescription = marketing.siteSettings.siteDescription || 'An AI 3D product platform for character creation, asset management, and print fulfillment.'
  const navigationItems = resolvePublicNavigationItems(marketing.siteSettings.headerNav)
  const mobileNavigationItems = navigationItems.filter((item) => item.href !== '/').slice(0, 3)
  const previewReadyCount = models.filter((model) => model.previewURL).length
  const printReadyCount = models.filter((model) => model.printReady).length
  const introSection = pageContent.sections[0]

  return (
    <main className={styles.page}>
      <AuthModalStage>
        <TopNavigation active={getPublicNavigationActiveID('/showcase', navigationItems)} className={styles.topNavigation} fitViewport items={navigationItems} user={navUser} />
        <header className={styles.mobileHeader}>
          <Link href="/" aria-label="Thorns Tavern home">
            <img alt="Thorns Tavern" src="/ui-lab/top-navigation/logo-wordmark.png" />
          </Link>
          <nav aria-label="Mobile navigation">
            {mobileNavigationItems.map((item) => (
              <Link href={item.href} key={item.href}>
                {item.label}
              </Link>
            ))}
          </nav>
        </header>

        <div className={styles.shell}>
          <section aria-label={pageContent.heroEyebrow} className={styles.heroSection}>
            <div className={styles.heroImageShell}>
              <img
                alt="Thorns Tavern showcase model scene"
                className={styles.heroImage}
                decoding="async"
                fetchPriority="high"
                src="/ui/workbench/model-detail/sketch-assets/rail-banner-bg.png"
              />
            </div>

            <div className={styles.heroContent}>
              <div className={styles.heroCopy}>
                <span className={styles.eyebrow}>{pageContent.heroEyebrow}</span>
                <h1>{pageContent.heroTitle}</h1>
                <p className={styles.summary}>{pageContent.heroText}</p>
                <div className={styles.metaPills}>
                  <span>{pagination.totalDocs} Public Models</span>
                  <span>{previewReadyCount} Page Previews</span>
                  <span>{printReadyCount} Page Print Ready</span>
                  <span>GLB Delivery</span>
                </div>
              </div>

              <div className={styles.heroActions}>
                <Link className={[styles.actionButton, styles.primaryAction].join(' ')} href={pageContent.heroPrimaryCTA.href}>
                  {pageContent.heroPrimaryCTA.label}
                  <ArrowRight aria-hidden="true" size={18} />
                </Link>
                {pageContent.heroSecondaryCTA ? (
                  <Link className={styles.actionButton} href={pageContent.heroSecondaryCTA.href}>
                    {pageContent.heroSecondaryCTA.label}
                    <ArrowRight aria-hidden="true" size={18} />
                  </Link>
                ) : null}
              </div>
            </div>
          </section>

          <section aria-label="Showcase stats" className={styles.statGrid}>
            <article className={styles.statCard}>
              <span className={styles.cardIcon}>
                <Box aria-hidden="true" size={20} />
              </span>
              <strong>{pagination.totalDocs}</strong>
              <span>{currentQuery ? 'Matching public cases' : 'Public model cases'}</span>
            </article>
            <article className={styles.statCard}>
              <span className={styles.cardIcon}>
                <Eye aria-hidden="true" size={20} />
              </span>
              <strong>{previewReadyCount}</strong>
              <span>Ready previews on this page</span>
            </article>
            <article className={styles.statCard}>
              <span className={styles.cardIcon}>
                <Sparkles aria-hidden="true" size={20} />
              </span>
              <strong>3D</strong>
              <span>Viewer and delivery path</span>
            </article>
          </section>

          <section className={styles.modelsSection}>
            <div className={styles.sectionHeader}>
              <div>
                <span className={styles.sectionEyebrow}>{introSection?.eyebrow ?? pageContent.heroEyebrow}</span>
                <h2>{introSection?.title ?? 'Open a model and inspect the result'}</h2>
                <p>{introSection?.text ?? 'Cards use the same thumbnail crop and dark gold presentation language as the curated bundle pages.'}</p>
              </div>
              <span className={styles.countChip}>
                {models.length} / {pagination.totalDocs} Cases
              </span>
            </div>

            <form action="/showcase" className={styles.searchForm}>
              <label className={styles.srOnly} htmlFor="showcase-search">
                Search showcase models
              </label>
              <input
                defaultValue={currentQuery}
                id="showcase-search"
                name="q"
                placeholder="Search public models"
                type="search"
              />
              <button type="submit">Search</button>
              {currentQuery ? (
                <Link className={styles.resetLink} href="/showcase">
                  Reset
                </Link>
              ) : null}
            </form>

            {models.length > 0 ? (
              <div className={styles.modelGrid}>
                {models.map((model) => (
                  <article className={styles.modelCard} key={model.id}>
                    <Link className={styles.modelImageLink} href={model.href}>
                      {model.previewURL ? (
                        <img
                          alt={model.title}
                          className={styles.modelImage}
                          decoding="async"
                          loading="lazy"
                          src={getSupabasePreviewImageURL(model.previewURL, 'model-card')}
                        />
                      ) : (
                        <div className={styles.emptyImage}>No preview image</div>
                      )}
                    </Link>
                    <div className={styles.modelBody}>
                      <h2>
                        <Link href={model.href}>{model.title}</Link>
                      </h2>
                      <div className={styles.modelTags}>
                        {getModelTags(model).map((tag) => (
                          <span key={`${model.id}-${tag}`}>{tag}</span>
                        ))}
                      </div>
                      <p>{model.summary}</p>
                      <Link className={styles.inlineLink} href={model.href}>
                        View Model
                        <ArrowRight aria-hidden="true" size={16} />
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <h2>{currentQuery ? 'No matching showcase models' : 'No public showcase models yet'}</h2>
                <p>
                  {currentQuery
                    ? 'Try another keyword or reset the search to browse all public model cases.'
                    : 'Published public model assets will appear here automatically after they have guest-readable previews.'}
                </p>
                <Link className={[styles.actionButton, styles.primaryAction].join(' ')} href="/workbench">
                  Open Workbench
                  <ArrowRight aria-hidden="true" size={18} />
                </Link>
              </div>
            )}

            <Pager currentPage={currentPage} currentQuery={currentQuery} list={showcaseList} />
          </section>

          <FooterBar footerContent={marketing.siteSettings.footer} siteDescription={siteDescription} supportEmail={supportEmail} />
        </div>
      </AuthModalStage>
    </main>
  )
}
