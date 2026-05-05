import Link from 'next/link'
import { notFound } from 'next/navigation'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { getCachedPayload } from '@/lib/getCachedPayload'
import { getMediaAccessURL } from '@/lib/mediaAccessURL'

import { SiteShell } from '../../_components/SiteShell'
import { getMarketingSiteData } from '../../_lib/marketing'
import { getCurrentUser } from '../../_lib/session'

type ImageLike = {
  thumbnailURL?: null | string
  url?: null | string
}

type ModelLike = {
  description?: null | string
  id?: number | string
  previewImage?: null | number | ImageLike
  title?: null | string
  visibility?: null | string
}

type BundleLike = {
  coverImage?: null | number | ImageLike
  id?: number | string
  isFeatured?: null | boolean
  models?: null | ModelLike[]
  slug?: null | string
  summary?: null | string
  tags?: null | { label?: null | string }[]
  title?: null | string
}

type BundleModelCard = {
  href: string
  id: string
  imageSrc: null | string
  summary: string
  title: string
}

type BundleDetail = {
  coverSrc: null | string
  id: string
  isFeatured: boolean
  models: BundleModelCard[]
  slug: string
  summary: string
  tags: string[]
  title: string
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

const normalizeBrowserMediaURL = (value: null | string | undefined) => {
  if (!value) return null

  const trimmed = value.trim()
  if (!trimmed) return null
  if (trimmed.startsWith('/')) return trimmed

  try {
    const parsed = new URL(trimmed)

    if ((parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') && parsed.pathname.startsWith('/api/media/file/')) {
      return `${parsed.pathname}${parsed.search}`
    }
  } catch {
    return trimmed
  }

  return trimmed
}

const getImageURL = (value: unknown) => {
  if (!isRecord(value)) return null

  const thumbnailURL = typeof value.thumbnailURL === 'string' && value.thumbnailURL ? value.thumbnailURL : null
  const url = typeof value.url === 'string' && value.url ? value.url : null

  return thumbnailURL || url
}

const getText = (value: unknown, fallback: string) => {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

async function resolveMediaURL(payload: Awaited<ReturnType<typeof getCachedPayload>>, value: unknown) {
  const directURL = normalizeBrowserMediaURL(getImageURL(value))
  if (!directURL) return null
  if (directURL.startsWith('/')) return directURL

  return normalizeBrowserMediaURL(await getMediaAccessURL({ payload, url: directURL }))
}

async function getModelCard(payload: Awaited<ReturnType<typeof getCachedPayload>>, model: ModelLike): Promise<BundleModelCard> {
  const id = String(model.id ?? model.title ?? 'model')

  return {
    href: model.id ? `/model-detail?id=${encodeURIComponent(String(model.id))}` : '/showcase',
    id,
    imageSrc: await resolveMediaURL(payload, model.previewImage),
    summary: getText(model.description, 'Open this model to view its preview, delivery files, and print readiness.'),
    title: getText(model.title, `Model ${id}`),
  }
}

async function getBundleDetail(slug: string): Promise<BundleDetail | null> {
  const payload = await getCachedPayload()
  const result = await payload.find({
    collection: 'model-bundles',
    depth: 2,
    limit: 1,
    overrideAccess: false,
    pagination: false,
    where: {
      slug: {
        equals: slug,
      },
    },
  })

  const bundle = result.docs[0] as BundleLike | undefined
  if (!bundle) return null

  const bundleModels = Array.isArray(bundle.models)
    ? bundle.models.filter((model) => isRecord(model) && (typeof model.visibility !== 'string' || model.visibility === 'public'))
    : []
  const modelCards = await Promise.all(bundleModels.map((model) => getModelCard(payload, model as ModelLike)))
  const coverSrc = (await resolveMediaURL(payload, bundle.coverImage)) ?? modelCards.find((model) => model.imageSrc)?.imageSrc ?? null

  return {
    coverSrc,
    id: String(bundle.id ?? slug),
    isFeatured: bundle.isFeatured === true,
    models: modelCards,
    slug: getText(bundle.slug, slug),
    summary: getText(bundle.summary, 'A curated set of generated models selected for a focused tabletop creation theme.'),
    tags: Array.isArray(bundle.tags)
      ? bundle.tags
          .map((tag) => getText(tag?.label, ''))
          .filter(Boolean)
          .slice(0, 8)
      : [],
    title: getText(bundle.title, 'Model Bundle'),
  }
}

export default async function BundleDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const [{ slug }, user, marketing] = await Promise.all([params, getCurrentUser(), getMarketingSiteData()])
  const bundle = await getBundleDetail(decodeURIComponent(slug || ''))

  if (!bundle) {
    notFound()
  }

  const { siteSettings } = marketing

  return (
    <SiteShell
      announcement={siteSettings.announcement}
      currentPath="/bundles"
      footer={siteSettings.footer}
      navigation={siteSettings.headerNav}
      user={user}
    >
      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 sm:py-14">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-center">
          <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-black shadow-sm">
            {bundle.coverSrc ? (
              <img alt={bundle.title} className="aspect-[4/3] h-full w-full object-cover" src={bundle.coverSrc} />
            ) : (
              <div className="grid aspect-[4/3] place-items-center bg-muted text-sm text-muted-foreground">No cover image</div>
            )}
          </div>

          <div className="max-w-3xl">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Model bundle</Badge>
              {bundle.isFeatured ? <Badge variant="outline">Featured</Badge> : null}
              <Badge variant="outline">{bundle.models.length} models</Badge>
            </div>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl">{bundle.title}</h1>
            <p className="mt-5 text-base leading-7 text-muted-foreground sm:text-lg">{bundle.summary}</p>
            {bundle.tags.length > 0 ? (
              <div className="mt-6 flex flex-wrap gap-2">
                {bundle.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            ) : null}
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/workbench">Create a model</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/showcase">Browse showcase</Link>
              </Button>
            </div>
          </div>
        </div>

        <Separator />

        <section className="grid gap-5">
          <div>
            <Badge variant="outline">Included models</Badge>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight">Models in this bundle</h2>
          </div>

          {bundle.models.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {bundle.models.map((model) => (
                <Card key={model.id} className="overflow-hidden border-border/60 bg-card/80 shadow-sm">
                  {model.imageSrc ? (
                    <img alt={model.title} className="aspect-[4/3] w-full object-cover" src={model.imageSrc} />
                  ) : (
                    <div className="grid aspect-[4/3] place-items-center bg-muted text-sm text-muted-foreground">No preview</div>
                  )}
                  <CardHeader>
                    <CardTitle className="line-clamp-2 text-xl">{model.title}</CardTitle>
                    <CardDescription className="line-clamp-3">{model.summary}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button asChild className="w-full" variant="secondary">
                      <Link href={model.href}>View model</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-border/60 bg-card/80 shadow-sm">
              <CardHeader>
                <CardTitle>No public models are available</CardTitle>
                <CardDescription>This bundle is published, but its included models are not currently available for public viewing.</CardDescription>
              </CardHeader>
            </Card>
          )}
        </section>
      </section>
    </SiteShell>
  )
}
