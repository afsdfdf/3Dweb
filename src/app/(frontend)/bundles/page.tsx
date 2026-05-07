/* eslint-disable @next/next/no-img-element */
import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getCachedPayload } from '@/lib/getCachedPayload'
import { getPublicBundleList, type PublicBundleListResult } from '@/lib/bundleService'

import { SiteShell } from '../_components/SiteShell'
import { getMarketingSiteData } from '../_lib/marketing'
import { getCurrentUser } from '../_lib/session'

type BundlesPageProps = {
  searchParams?: Promise<{
    page?: string
    q?: string
    type?: string
  }>
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

export default async function BundlesPage({ searchParams }: BundlesPageProps) {
  const query = (await searchParams) ?? {}
  const currentType = normalizeText(query.type)
  const currentQuery = normalizeText(query.q)
  const currentPage = Math.max(1, Number(query.page || 1) || 1)
  const bundleLimit = 12
  const payload = await getCachedPayload()
  const [user, marketing] = await Promise.all([
    getCurrentUser(),
    getMarketingSiteData(),
  ])
  const bundleList = await getPublicBundleList(payload, {
    bundleType: currentType,
    limit: bundleLimit,
    page: currentPage,
    query: currentQuery,
    withPagination: true,
  }).catch(() => getEmptyBundleList({ limit: bundleLimit, page: currentPage }))
  const { siteSettings } = marketing
  const featuredBundle = bundleList.bundles.find((bundle) => bundle.isFeatured) ?? bundleList.bundles[0] ?? null
  const remainingBundles = featuredBundle
    ? bundleList.bundles.filter((bundle) => bundle.id !== featuredBundle.id)
    : bundleList.bundles

  return (
    <SiteShell
      announcement={siteSettings.announcement}
      currentPath="/bundles"
      footer={siteSettings.footer}
      navigation={siteSettings.headerNav}
      user={user}
    >
      <main className="bg-background text-foreground">
        <section className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 sm:py-12">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.04fr)_minmax(320px,0.96fr)] lg:items-end">
            <div>
              <Badge variant="secondary">Model Bundles</Badge>
              <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight sm:text-5xl">Curated model packs for tabletop worlds</h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                Browse themed sets assembled from public models, then open the included previews or continue the theme in Workbench.
              </p>
            </div>

            <form action="/bundles" className="grid gap-3 rounded-lg border border-border/70 bg-card p-3 sm:grid-cols-[1fr_auto]">
              <label className="sr-only" htmlFor="bundle-search">
                Search bundles
              </label>
              <input
                className="min-h-11 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                defaultValue={currentQuery}
                id="bundle-search"
                name="q"
                placeholder="Search model packs"
                type="search"
              />
              {currentType ? <input name="type" type="hidden" value={currentType} /> : null}
              <Button type="submit">Search</Button>
            </form>
          </div>

          <nav aria-label="Bundle types" className="flex gap-2 overflow-x-auto pb-1">
            {bundleTypeFilters.map((filter) => {
              const active = currentType === filter.value

              return (
                <Button asChild key={filter.value || 'all'} size="sm" variant={active ? 'default' : 'outline'}>
                  <Link href={buildBundlesHref({ query: currentQuery, type: filter.value })}>{filter.label}</Link>
                </Button>
              )
            })}
          </nav>

          {featuredBundle ? (
            <section className="grid gap-6 rounded-lg border border-border/70 bg-card p-4 md:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] md:p-5">
              <Link className="group block overflow-hidden rounded-md bg-muted" href={featuredBundle.href}>
                {featuredBundle.coverSrc ? (
                  <img
                    alt={featuredBundle.title}
                    className="aspect-[16/10] h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.025]"
                    src={featuredBundle.coverSrc}
                  />
                ) : (
                  <div className="grid aspect-[16/10] place-items-center text-sm text-muted-foreground">No cover image</div>
                )}
              </Link>
              <div className="flex flex-col justify-center">
                <div className="flex flex-wrap gap-2">
                  <Badge>{featuredBundle.badgeLabel}</Badge>
                  <Badge variant="outline">{featuredBundle.bundleTypeLabel}</Badge>
                  <Badge variant="outline">{featuredBundle.modelCountLabel}</Badge>
                </div>
                <h2 className="mt-4 text-3xl font-semibold tracking-tight">{featuredBundle.title}</h2>
                {featuredBundle.subtitle ? <p className="mt-2 text-base text-muted-foreground">{featuredBundle.subtitle}</p> : null}
                <p className="mt-4 text-sm leading-6 text-muted-foreground">{featuredBundle.summary}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {featuredBundle.tags.slice(0, 5).map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Button asChild>
                    <Link href={featuredBundle.href}>View bundle</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/workbench">Use in Workbench</Link>
                  </Button>
                </div>
              </div>
            </section>
          ) : null}

          {bundleList.bundles.length > 0 ? (
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {remainingBundles.map((bundle) => (
                <Card className="overflow-hidden border-border/70" key={bundle.id}>
                  <Link className="group block bg-muted" href={bundle.href}>
                    {bundle.coverSrc ? (
                      <img
                        alt={bundle.title}
                        className="aspect-[4/3] w-full object-cover transition-transform duration-300 group-hover:scale-[1.025]"
                        src={bundle.coverSrc}
                      />
                    ) : (
                      <div className="grid aspect-[4/3] place-items-center text-sm text-muted-foreground">No cover image</div>
                    )}
                  </Link>
                  <CardHeader>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">{bundle.bundleTypeLabel}</Badge>
                      <Badge variant="outline">{bundle.modelCountLabel}</Badge>
                    </div>
                    <CardTitle className="line-clamp-2 text-xl">
                      <Link href={bundle.href}>{bundle.title}</Link>
                    </CardTitle>
                    <CardDescription className="line-clamp-3">{bundle.summary}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button asChild className="w-full" variant="secondary">
                      <Link href={bundle.href}>Open bundle</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </section>
          ) : (
            <section className="rounded-lg border border-border/70 bg-card p-8 text-center">
              <h2 className="text-2xl font-semibold tracking-tight">No bundles found</h2>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
                Published bundles will appear here after they are marked visible and include public models with guest-readable previews.
              </p>
              <Button asChild className="mt-6" variant="outline">
                <Link href="/bundles">Reset filters</Link>
              </Button>
            </section>
          )}

          {bundleList.pagination.totalPages > 1 ? (
            <nav aria-label="Bundle pages" className="flex items-center justify-center gap-3">
              {bundleList.pagination.hasPrevPage ? (
                <Button asChild variant="outline">
                  <Link href={buildBundlesHref({ page: Math.max(1, bundleList.pagination.page - 1), query: currentQuery, type: currentType })}>Previous</Link>
                </Button>
              ) : (
                <Button disabled variant="outline">
                  Previous
                </Button>
              )}
              <span className="text-sm text-muted-foreground">
                Page {bundleList.pagination.page} of {bundleList.pagination.totalPages}
              </span>
              {bundleList.pagination.hasNextPage ? (
                <Button asChild variant="outline">
                  <Link href={buildBundlesHref({ page: Math.min(bundleList.pagination.totalPages, bundleList.pagination.page + 1), query: currentQuery, type: currentType })}>Next</Link>
                </Button>
              ) : (
                <Button disabled variant="outline">
                  Next
                </Button>
              )}
            </nav>
          ) : null}
        </section>
      </main>
    </SiteShell>
  )
}
