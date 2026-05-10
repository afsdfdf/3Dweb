import type { Payload, Where } from 'payload'

import { getMediaAccessURL } from '@/lib/mediaAccessURL'
import { getModelPreviewURL } from '@/lib/modelAssetURL'

type ImageLike = {
  thumbnailURL?: null | string
  url?: null | string
}

type UserLike = {
  avatar?: null | number | ImageLike
  displayName?: null | string
  fullName?: null | string
  id?: number | string
  profileVisibility?: null | string
}

type ModelLike = {
  description?: null | string
  formats?: null | { format?: null | string }[]
  id?: number | string
  owner?: null | number | string | UserLike
  previewImage?: null | number | ImageLike
  printReady?: null | boolean
  tags?: null | { label?: null | string }[]
  title?: null | string
  visibility?: null | string
}

type BundleLike = {
  badgeLabel?: null | string
  bundleType?: null | string
  coverImage?: null | number | ImageLike
  cta?: null | {
    mode?: null | string
    priceCredits?: null | number
    primaryLabel?: null | string
    secondaryLabel?: null | string
  }
  heroImage?: null | number | ImageLike
  heroMarketing?: null | {
    eyebrow?: null | string
    sellingPointOne?: null | string
    sellingPointThree?: null | string
    sellingPointTwo?: null | string
    slogan?: null | string
    subtitle?: null | string
    title?: null | string
  }
  id?: number | string
  includedSummary?: null | string
  isFeatured?: null | boolean
  license?: null | {
    summary?: null | string
    type?: null | string
  }
  models?: null | ModelLike[]
  releaseNotes?: null | string
  slug?: null | string
  subtitle?: null | string
  summary?: null | string
  tags?: null | { label?: null | string }[]
  technicalSpecs?: null | {
    assetReadinessLabel?: null | string
    modelCountLabel?: null | string
    printReady?: null | boolean
    scaleLabel?: null | string
    supportedFormatsLabel?: null | string
    technicalNotes?: null | string
    textured?: null | boolean
  }
  title?: null | string
  updatedAt?: null | string
}

export type PublicBundleModelCard = {
  authorName: string
  avatarSrc: null | string
  description: string
  formats: string[]
  href: string
  id: string
  imageSrc: null | string
  printReady: boolean
  tags: string[]
  title: string
}

export type PublicBundleCard = {
  badgeLabel: string
  bundleType: string
  bundleTypeLabel: string
  coverSrc: null | string
  ctaMode: string
  href: string
  id: string
  isFeatured: boolean
  modelCount: number
  modelCountLabel: string
  priceCredits: number
  slug: string
  subtitle: string
  summary: string
  tags: string[]
  title: string
}

export type PublicBundleDetail = PublicBundleCard & {
  heroMarketing: {
    eyebrow: string
    sellingPoints: string[]
    slogan: string
    subtitle: string
    title: string
  }
  heroSrc: null | string
  includedSummary: string
  license: {
    label: string
    summary: string
    type: string
  }
  models: PublicBundleModelCard[]
  primaryCtaLabel: string
  relatedBundles: PublicBundleCard[]
  releaseNotes: string
  secondaryCtaLabel: string
  technicalSpecs: {
    assetReadinessLabel: string
    formatsLabel: string
    modelCountLabel: string
    printReady: boolean
    scaleLabel: string
    technicalNotes: string
    textured: boolean
  }
}

export type PublicBundleListArgs = {
  bundleType?: null | string
  limit?: number
  page?: number
  query?: null | string
  withPagination?: boolean
}

export type PublicBundleListResult = {
  bundles: PublicBundleCard[]
  pagination: {
    hasNextPage: boolean
    hasPrevPage: boolean
    limit: number
    page: number
    totalDocs: number
    totalPages: number
  }
}

type MapModelCardOptions = {
  includeOwnerProfile?: boolean
}

const BUNDLE_TYPE_LABELS: Record<string, string> = {
  'character-pack': 'Character Pack',
  'event-pack': 'Event Pack',
  'monthly-release': 'Monthly Release',
  showcase: 'Showcase Set',
  starter: 'Starter Pack',
  'terrain-pack': 'Terrain Pack',
  'theme-pack': 'Theme Pack',
}

const LICENSE_TYPE_LABELS: Record<string, string> = {
  commercial: 'Commercial Use',
  custom: 'Custom Terms',
  editorial: 'Editorial Use',
  personal: 'Personal Use',
}

const DEFAULT_BUNDLE_SUMMARY = 'A curated set of generated models selected for a focused tabletop creation theme.'
const DEFAULT_INCLUDED_SUMMARY = 'Open any model in this bundle to inspect its public preview, formats, and model detail page.'
const DEFAULT_LICENSE_SUMMARY = 'Review the operator-provided license terms before using this bundle outside personal previews.'
const PUBLIC_CONTENT_FALLBACK_LOCALE = 'en'
const PUBLIC_CONTENT_LOCALE = 'zh'

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

const normalizeText = (value: unknown, fallback = '') => {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

const normalizePositiveNumber = (value: unknown) => {
  const next = Number(value ?? 0)
  return Number.isFinite(next) && next > 0 ? next : 0
}

const normalizePageNumber = (value: unknown) => {
  const next = Number(value ?? 1)
  return Number.isFinite(next) && next > 0 ? Math.floor(next) : 1
}

const normalizeLimit = (value: unknown, fallback = 12) => {
  const next = Number(value ?? fallback)
  if (!Number.isFinite(next) || next <= 0) return fallback
  return Math.min(48, Math.floor(next))
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

  const thumbnailURL = normalizeText(value.thumbnailURL)
  const url = normalizeText(value.url)
  return thumbnailURL || url || null
}

const getRelationId = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  if (isRecord(value)) {
    const id = value.id
    if (typeof id === 'number' && Number.isFinite(id)) return id
    if (typeof id === 'string' && id.trim()) {
      const parsed = Number(id)
      return Number.isFinite(parsed) ? parsed : null
    }
  }
  return null
}

const getOwnerName = (owner: unknown) => {
  if (!isRecord(owner)) return 'Creator'

  const displayName = normalizeText(owner.displayName)
  const fullName = normalizeText(owner.fullName)
  const ownerId = getRelationId(owner.id)
  return displayName || fullName || (ownerId ? `Creator ${ownerId}` : 'Creator')
}

async function resolveMediaURL(payload: Payload, value: null | string | undefined) {
  const normalized = normalizeBrowserMediaURL(value)
  if (!normalized) return null
  if (normalized.startsWith('/')) return normalized

  return normalizeBrowserMediaURL(await getMediaAccessURL({ payload, url: normalized }))
}

async function getPublicOwnerProfile(payload: Payload, owner: unknown) {
  const ownerId = getRelationId(owner)
  if (!ownerId) return null

  try {
    const ownerDoc = (isRecord(owner) ? owner : null) as UserLike | null
    const resolvedOwner =
      ownerDoc?.profileVisibility !== undefined
        ? ownerDoc
        : ((await payload.findByID({
            collection: 'users',
            depth: 1,
            id: ownerId,
            overrideAccess: true,
            select: {
              avatar: true,
              displayName: true,
              fullName: true,
              profileVisibility: true,
            },
          })) as UserLike)

    const avatarURL = isRecord(resolvedOwner.avatar) ? getImageURL(resolvedOwner.avatar) : null

    return {
      avatarSrc: await resolveMediaURL(payload, avatarURL),
      name: getOwnerName(resolvedOwner),
    }
  } catch {
    return null
  }
}

const isPublicModel = (model: unknown): model is ModelLike => {
  return isRecord(model) && model.visibility === 'public'
}

const getTags = (items: unknown) => {
  if (!Array.isArray(items)) return []

  return items
    .map((tag) => (isRecord(tag) ? normalizeText(tag.label) : ''))
    .filter(Boolean)
    .slice(0, 8)
}

const getFormats = (model: ModelLike) => {
  if (!Array.isArray(model.formats)) return []

  return Array.from(
    new Set(
      model.formats
        .map((item) => normalizeText(isRecord(item) ? item.format : null).toUpperCase())
        .filter(Boolean),
    ),
  ).slice(0, 6)
}

async function mapModelCard(payload: Payload, model: ModelLike, options: MapModelCardOptions = {}): Promise<PublicBundleModelCard> {
  const id = String(model.id ?? model.title ?? 'model')
  const title = normalizeText(model.title, `Model ${id}`)
  const ownerProfile = options.includeOwnerProfile ? await getPublicOwnerProfile(payload, model.owner) : null

  return {
    authorName: ownerProfile?.name ?? getOwnerName(model.owner),
    avatarSrc: ownerProfile?.avatarSrc ?? null,
    description: normalizeText(model.description, 'Open this model to view its preview, delivery files, and print readiness.'),
    formats: getFormats(model),
    href: model.id ? `/model-detail?id=${encodeURIComponent(String(model.id))}` : '/showcase',
    id,
    imageSrc: await resolveMediaURL(payload, getModelPreviewURL(model)),
    printReady: model.printReady === true,
    tags: getTags(model.tags),
    title,
  }
}

function getPublicModels(bundle: BundleLike) {
  return Array.isArray(bundle.models) ? bundle.models.filter(isPublicModel) : []
}

async function resolveBundleCoverURL(payload: Payload, bundle: BundleLike, models: PublicBundleModelCard[]) {
  const directCover = await resolveMediaURL(payload, getImageURL(bundle.coverImage))
  if (directCover) return directCover

  return models.find((model) => model.imageSrc)?.imageSrc ?? null
}

async function resolveBundleHeroURL(payload: Payload, bundle: BundleLike, fallbackCoverSrc: null | string) {
  const directHero = await resolveMediaURL(payload, getImageURL(bundle.heroImage))
  return directHero || fallbackCoverSrc
}

function getDefaultFormatLabel(models: PublicBundleModelCard[]) {
  const formats = Array.from(new Set(models.flatMap((model) => model.formats))).slice(0, 4)
  return formats.length > 0 ? formats.join(', ') : 'Public model previews'
}

function getBundleTypeLabel(value: string) {
  return BUNDLE_TYPE_LABELS[value] ?? 'Theme Pack'
}

function getLicenseTypeLabel(value: string) {
  return LICENSE_TYPE_LABELS[value] ?? 'Personal Use'
}

function getHeroMarketing(bundle: BundleLike) {
  const heroMarketing = bundle.heroMarketing
  const sellingPoints = [
    normalizeText(heroMarketing?.sellingPointOne),
    normalizeText(heroMarketing?.sellingPointTwo),
    normalizeText(heroMarketing?.sellingPointThree),
  ].filter(Boolean)

  return {
    eyebrow: normalizeText(heroMarketing?.eyebrow),
    sellingPoints,
    slogan: normalizeText(heroMarketing?.slogan),
    subtitle: normalizeText(heroMarketing?.subtitle),
    title: normalizeText(heroMarketing?.title),
  }
}

async function mapBundleCard(payload: Payload, bundle: BundleLike): Promise<PublicBundleCard> {
  const publicModels = getPublicModels(bundle)
  const models = await Promise.all(publicModels.map((model) => mapModelCard(payload, model)))
  const slug = normalizeText(bundle.slug, String(bundle.id ?? 'bundle'))
  const bundleType = normalizeText(bundle.bundleType, 'theme-pack')
  const ctaMode = normalizeText(bundle.cta?.mode, 'free')
  const modelCount = models.length
  const modelCountLabel =
    normalizeText(bundle.technicalSpecs?.modelCountLabel) ||
    `${modelCount} ${modelCount === 1 ? 'Model' : 'Models'}`
  const title = normalizeText(bundle.title, 'Model Bundle')

  return {
    badgeLabel: normalizeText(bundle.badgeLabel, bundle.isFeatured ? 'Featured' : getBundleTypeLabel(bundleType)),
    bundleType,
    bundleTypeLabel: getBundleTypeLabel(bundleType),
    coverSrc: await resolveBundleCoverURL(payload, bundle, models),
    ctaMode,
    href: `/bundles/${encodeURIComponent(slug)}`,
    id: String(bundle.id ?? slug),
    isFeatured: bundle.isFeatured === true,
    modelCount,
    modelCountLabel,
    priceCredits: normalizePositiveNumber(bundle.cta?.priceCredits),
    slug,
    subtitle: normalizeText(bundle.subtitle),
    summary: normalizeText(bundle.summary, DEFAULT_BUNDLE_SUMMARY),
    tags: getTags(bundle.tags),
    title,
  }
}

async function mapBundleDetail(payload: Payload, bundle: BundleLike): Promise<Omit<PublicBundleDetail, 'relatedBundles'>> {
  const publicModels = getPublicModels(bundle)
  const models = await Promise.all(publicModels.map((model) => mapModelCard(payload, model, { includeOwnerProfile: true })))
  const card = await mapBundleCard(payload, bundle)
  const licenseType = normalizeText(bundle.license?.type, 'personal')

  return {
    ...card,
    heroMarketing: getHeroMarketing(bundle),
    heroSrc: await resolveBundleHeroURL(payload, bundle, card.coverSrc),
    includedSummary: normalizeText(bundle.includedSummary, DEFAULT_INCLUDED_SUMMARY),
    license: {
      label: getLicenseTypeLabel(licenseType),
      summary: normalizeText(bundle.license?.summary, DEFAULT_LICENSE_SUMMARY),
      type: licenseType,
    },
    models,
    primaryCtaLabel: normalizeText(bundle.cta?.primaryLabel, card.ctaMode === 'coming-soon' ? 'Coming Soon' : 'View Models'),
    releaseNotes: normalizeText(bundle.releaseNotes),
    secondaryCtaLabel: normalizeText(bundle.cta?.secondaryLabel, 'Use in Workbench'),
    technicalSpecs: {
      assetReadinessLabel: normalizeText(bundle.technicalSpecs?.assetReadinessLabel, models.some((model) => model.imageSrc) ? 'Preview ready' : 'Preview pending'),
      formatsLabel: normalizeText(bundle.technicalSpecs?.supportedFormatsLabel, getDefaultFormatLabel(models)),
      modelCountLabel: card.modelCountLabel,
      printReady: bundle.technicalSpecs?.printReady === true || models.some((model) => model.printReady),
      scaleLabel: normalizeText(bundle.technicalSpecs?.scaleLabel, 'Project scale varies by included model'),
      technicalNotes: normalizeText(bundle.technicalSpecs?.technicalNotes),
      textured: bundle.technicalSpecs?.textured === true,
    },
  }
}

function buildPublicBundleWhere(args: PublicBundleListArgs = {}) {
  const and: Where[] = []
  const query = normalizeText(args.query).slice(0, 80)
  const bundleType = normalizeText(args.bundleType)

  if (bundleType) {
    and.push({
      bundleType: {
        equals: bundleType,
      },
    })
  }

  if (query) {
    and.push({
      or: [
        {
          title: {
            contains: query,
          },
        },
        {
          subtitle: {
            contains: query,
          },
        },
        {
          summary: {
            contains: query,
          },
        },
        {
          'tags.label': {
            contains: query,
          },
        },
      ],
    })
  }

  return and.length > 0 ? ({ and } satisfies Where) : undefined
}

export async function getPublicBundleList(payload: Payload, args: PublicBundleListArgs = {}): Promise<PublicBundleListResult> {
  const limit = normalizeLimit(args.limit)
  const result = await payload.find({
    collection: 'model-bundles',
    depth: 2,
    fallbackLocale: PUBLIC_CONTENT_FALLBACK_LOCALE,
    limit,
    locale: PUBLIC_CONTENT_LOCALE,
    overrideAccess: false,
    page: normalizePageNumber(args.page),
    pagination: args.withPagination ?? true,
    sort: ['-isFeatured', 'sortOrder', '-updatedAt'],
    where: buildPublicBundleWhere(args),
  })
  const bundles = await Promise.all((result.docs as BundleLike[]).map((bundle) => mapBundleCard(payload, bundle)))

  return {
    bundles,
    pagination: {
      hasNextPage: Boolean(result.hasNextPage),
      hasPrevPage: Boolean(result.hasPrevPage),
      limit: Number(result.limit || limit),
      page: Number(result.page || args.page || 1),
      totalDocs: Number(result.totalDocs || bundles.length),
      totalPages: Math.max(1, Number(result.totalPages || 1)),
    },
  }
}

export async function getPublicBundleBySlug(payload: Payload, slug: string): Promise<PublicBundleDetail | null> {
  const normalizedSlug = normalizeText(decodeURIComponent(slug || ''))
  if (!normalizedSlug) return null

  const result = await payload.find({
    collection: 'model-bundles',
    depth: 2,
    fallbackLocale: PUBLIC_CONTENT_FALLBACK_LOCALE,
    limit: 1,
    locale: PUBLIC_CONTENT_LOCALE,
    overrideAccess: false,
    pagination: false,
    where: {
      slug: {
        equals: normalizedSlug,
      },
    },
  })
  const bundle = result.docs[0] as BundleLike | undefined
  if (!bundle) return null

  const detail = await mapBundleDetail(payload, bundle)
  const related = await getPublicBundleList(payload, {
    bundleType: detail.bundleType,
    limit: 4,
    withPagination: false,
  }).catch(() => ({
    bundles: [],
    pagination: {
      hasNextPage: false,
      hasPrevPage: false,
      limit: 4,
      page: 1,
      totalDocs: 0,
      totalPages: 1,
    },
  }))

  return {
    ...detail,
    relatedBundles: related.bundles.filter((item) => item.id !== detail.id).slice(0, 3),
  }
}
