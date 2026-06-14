import { getCachedPayload } from '@/lib/getCachedPayload'
import { getMediaAccessURL } from '@/lib/mediaAccessURL'
import { getPublicBundleList, type PublicBundleCard, type PublicBundleListResult } from '@/lib/bundleService'
import type { Where } from 'payload'
import { getFollowCreatorCardDataForOwner } from '@/components/ui-lab/follow-creator-card/follow-creator-card-data'
import type { FollowCreatorCardData } from '@/components/ui-lab/follow-creator-card'

import { getMarketingSiteData } from '../_lib/marketing'
import { defaultSiteSettings, type FooterContent, type NavigationPromotionContent } from '../_lib/marketing-content'
import { getCurrentNavUser } from '../_lib/session'

type ImageLike = {
  thumbnailURL?: null | string
  url?: null | string
}

type ModelLike = {
  commentsCount?: null | number
  createdAt?: null | string
  description?: null | string
  favoritesCount?: null | number
  formats?: null | { format?: null | string }[]
  id?: number | string
  likesCount?: null | number
  owner?: unknown
  previewImage?: null | number | ImageLike
  sourceTask?: null | {
    callbackPayload?: unknown
    inputMode?: null | string
  }
  tags?: null | { label?: null | string }[]
  title?: null | string
  updatedAt?: null | string
  viewCount?: null | number
  visibility?: null | string
}

type UserLike = {
  avatar?: null | number | ImageLike
  displayName?: null | string
  email?: null | string
  fullName?: null | string
  id?: number | string
  profileVisibility?: null | string
}

type HomepageItemLike = {
  altText?: null | string
  badgeLabel?: null | string
  coverImage?: null | number | ImageLike
  ctaLabel?: null | string
  customHref?: null | string
  id?: number | string
  itemCountLabel?: null | string
  linkedBundle?: null | number | {
    coverImage?: null | number | ImageLike
    id?: number | string
    models?: null | ModelLike[]
    slug?: null | string
    technicalSpecs?: null | {
      modelCountLabel?: null | string
    }
  }
  linkedModel?: null | number | ModelLike
  placement?: null | string
  railVariant?: null | string
  ribbonLabel?: null | string
  title?: null | string
}

export type HomeFeatureItem = {
  alt: string
  href?: null | string
  id: string
  imageSrc: string
  ribbonLabel?: string
  variant?: 'standard' | 'wide'
}

export type HomeShelfItem = {
  alt?: string
  count?: string
  href?: null | string
  id: string
  imageSrc: string
  title?: string
}

export type HomeInspirationFilter = 'image-tools' | 'image3d' | 'text3d'

export type HomeInspirationItem = {
  ageLabel: string
  alt: string
  authorName: string
  avatarSrc?: null | string
  creatorCard?: FollowCreatorCardData | null
  favoritesLabel: string
  filter: HomeInspirationFilter
  href?: null | string
  id: string
  imageSrc?: null | string
  likesLabel: string
  title: string
  viewsLabel: string
}

export type HomeData = {
  featuredItems: HomeFeatureItem[]
  footer: {
    content: FooterContent
    siteDescription: string
    supportEmail: string
  }
  heroHeaderBackgroundSrc?: null | string
  inspirationFilter: HomeInspirationFilter | 'all'
  inspirationItems: HomeInspirationItem[]
  inspirationPagination: {
    hasNextPage: boolean
    hasPrevPage: boolean
    limit: number
    page: number
    totalDocs: number
    totalPages: number
  }
  inspirationSearchQuery: string
  navUser: {
    avatarUrl?: null | string
    bio?: null | string
    credits: number
    creditsBalance?: null | number
    displayName: string
    email?: null | string
    followersCount?: null | number
    followingCount?: null | number
    hasActiveSubscription?: boolean | null
    id?: number | string
    modelsCount?: null | number
    name: string
    role?: null | string
  } | null
  navigationPromotion?: NavigationPromotionContent
  shelfItems: HomeShelfItem[]
}

export type HomeDataArgs = {
  inspirationPage?: number
  inspirationQuery?: null | string
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

async function resolveMediaAccessURL(payload: Awaited<ReturnType<typeof getCachedPayload>>, url: null | string | undefined) {
  const normalized = normalizeBrowserMediaURL(url)
  if (!normalized) return null
  if (normalized.startsWith('/')) return normalized

  return normalizeBrowserMediaURL(await getMediaAccessURL({ payload, url: normalized }))
}

const getImageURL = (value: unknown) => {
  if (!isRecord(value)) return null

  const thumbnailURL = typeof value.thumbnailURL === 'string' && value.thumbnailURL ? value.thumbnailURL : null
  const url = typeof value.url === 'string' && value.url ? value.url : null

  return thumbnailURL || url
}

const getOriginalImageURL = (value: unknown) => {
  if (!isRecord(value)) return null

  const url = typeof value.url === 'string' && value.url ? value.url : null
  const thumbnailURL = typeof value.thumbnailURL === 'string' && value.thumbnailURL ? value.thumbnailURL : null

  return url || thumbnailURL
}

const getCallbackThumbnailURL = (model: ModelLike) => {
  const sourceTask = model.sourceTask
  if (!isRecord(sourceTask)) return null

  const callbackPayload = sourceTask.callbackPayload
  if (!isRecord(callbackPayload)) return null

  return typeof callbackPayload.thumbnailUrl === 'string' ? callbackPayload.thumbnailUrl : null
}

const getModelPreviewURL = (model: ModelLike) => {
  return getImageURL(model.previewImage) || getCallbackThumbnailURL(model)
}

const getModelInspirationFilter = (model: ModelLike): HomeInspirationFilter => {
  const sourceTask = model.sourceTask
  const inputMode = isRecord(sourceTask) && typeof sourceTask.inputMode === 'string' ? sourceTask.inputMode : null

  if (inputMode === 'text') return 'text3d'
  if (inputMode === 'image' || inputMode === 'hybrid') return 'image3d'

  const searchableText = [
    model.title,
    model.description,
    ...(Array.isArray(model.tags) ? model.tags.map((tag) => tag.label) : []),
  ]
    .filter((value): value is string => typeof value === 'string')
    .join(' ')
    .toLowerCase()

  if (searchableText.includes('tool') || searchableText.includes('image gen') || searchableText.includes('imagegen')) {
    return 'image-tools'
  }

  return model.previewImage ? 'image3d' : 'text3d'
}

const compactCount = (value: unknown, fallback = '0') => {
  const count = Number(value ?? 0)
  if (!Number.isFinite(count) || count <= 0) return fallback
  if (count >= 1000) return `${(count / 1000).toFixed(count >= 10000 ? 0 : 1)}k`
  return String(count)
}

const getOwnerName = (owner: unknown) => {
  if (!isRecord(owner)) return 'Creator'

  const displayName = typeof owner.displayName === 'string' && owner.displayName.trim() ? owner.displayName.trim() : null
  const fullName = typeof owner.fullName === 'string' && owner.fullName.trim() ? owner.fullName.trim() : null
  const email = typeof owner.email === 'string' && owner.email.trim() ? owner.email.trim() : null

  return displayName || fullName || email?.split('@')[0] || 'Creator'
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

const getPublicAvatarURL = (owner: UserLike) => {
  const avatar = owner.avatar
  return isRecord(avatar) ? getImageURL(avatar) : null
}

async function getPublicOwnerProfile(payload: Awaited<ReturnType<typeof getCachedPayload>>, owner: unknown) {
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
              email: true,
              fullName: true,
              profileVisibility: true,
            },
          })) as UserLike)

    return {
      avatarSrc: await resolveMediaAccessURL(payload, getPublicAvatarURL(resolvedOwner)),
      name: getOwnerName(resolvedOwner),
    }
  } catch {
    return null
  }
}

const getAgeLabel = (value: null | string | undefined) => {
  if (!value) return 'Recently'

  const timestamp = new Date(value).getTime()
  if (!Number.isFinite(timestamp)) return 'Recently'

  const days = Math.max(1, Math.round((Date.now() - timestamp) / 86_400_000))
  if (days < 30) return `${days} Days ago`

  const months = Math.max(1, Math.round(days / 30))
  return `${months} Months ago`
}

const getHomepageItemHref = (item: HomepageItemLike) => {
  if (typeof item.customHref === 'string' && item.customHref.trim()) return item.customHref

  if (isRecord(item.linkedModel) && item.linkedModel.id) {
    return `/model-detail?id=${encodeURIComponent(String(item.linkedModel.id))}`
  }

  if (isRecord(item.linkedBundle)) {
    const slug = typeof item.linkedBundle.slug === 'string' && item.linkedBundle.slug.trim() ? item.linkedBundle.slug.trim() : null

    if (slug) {
      return `/bundles/${encodeURIComponent(slug)}`
    }
  }

  return null
}

async function resolveHomepageItemImage(payload: Awaited<ReturnType<typeof getCachedPayload>>, item: HomepageItemLike) {
  const directCover = getImageURL(item.coverImage)
  if (directCover) {
    return resolveMediaAccessURL(payload, directCover)
  }

  if (isRecord(item.linkedModel)) {
    return resolveMediaAccessURL(payload, getModelPreviewURL(item.linkedModel))
  }

  if (isRecord(item.linkedBundle)) {
    const coverURL = await resolveMediaAccessURL(payload, getImageURL(item.linkedBundle.coverImage))
    if (coverURL) return coverURL

    const publicModels = Array.isArray(item.linkedBundle.models)
      ? item.linkedBundle.models.filter((model) => isRecord(model) && model.visibility === 'public')
      : []

    for (const model of publicModels) {
      const previewURL = await resolveMediaAccessURL(payload, getModelPreviewURL(model as ModelLike))
      if (previewURL) return previewURL
    }
  }

  return null
}

function getShelfCount(item: HomepageItemLike) {
  if (typeof item.itemCountLabel === 'string' && item.itemCountLabel.trim()) {
    return item.itemCountLabel.trim()
  }

  if (isRecord(item.linkedBundle) && isRecord(item.linkedBundle.technicalSpecs)) {
    const modelCountLabel = item.linkedBundle.technicalSpecs.modelCountLabel
    if (typeof modelCountLabel === 'string' && modelCountLabel.trim()) {
      return modelCountLabel.trim()
    }
  }

  if (isRecord(item.linkedBundle) && Array.isArray(item.linkedBundle.models)) {
    const count = item.linkedBundle.models.filter((model) => isRecord(model) && model.visibility === 'public').length
    return `${count} ${count === 1 ? 'Model' : 'Models'}`
  }

  if (isRecord(item.linkedModel)) {
    return `${Math.max(1, Array.isArray(item.linkedModel.formats) ? item.linkedModel.formats.length : 1)} Formats`
  }

  return '1 Model'
}

const moreBundlesItem: HomeShelfItem = {
  alt: 'More bundles',
  href: '/bundles',
  id: 'all-bundles',
  imageSrc: '/ui/frames/allfollowed.png',
}

const withBundleMoreItem = (items: HomeShelfItem[]) => {
  const primaryItems = items.filter((item) => item.id !== moreBundlesItem.id)
  return [...primaryItems, moreBundlesItem]
}

export const getFirstBundleShelfItems = (items: HomeShelfItem[]) => {
  const moreItem = items.find((item) => item.id === moreBundlesItem.id)
  const contentItems = items.filter((item) => item.id !== moreBundlesItem.id).slice(0, 3)
  return moreItem ? [...contentItems, moreItem] : contentItems
}

const getBundleFeatureItems = (bundles: PublicBundleCard[]) => {
  return bundles
    .filter((bundle) => Boolean(bundle.coverSrc))
    .slice(0, 4)
    .map((bundle, index) => ({
      alt: bundle.title,
      href: bundle.href,
      id: `bundle-feature-${bundle.id}`,
      imageSrc: bundle.coverSrc as string,
      ribbonLabel: bundle.badgeLabel || (index === 0 ? 'Featured Bundle' : bundle.bundleTypeLabel),
      variant: index === 0 ? 'wide' : 'standard',
    }) satisfies HomeFeatureItem)
}

const getBundleShelfItems = (bundles: PublicBundleCard[]) => {
  return bundles
    .filter((bundle) => Boolean(bundle.coverSrc))
    .map((bundle) => ({
      count: bundle.modelCountLabel,
      href: bundle.href,
      id: `bundle-shelf-${bundle.id}`,
      imageSrc: bundle.coverSrc as string,
      title: bundle.title,
    }) satisfies HomeShelfItem)
}

async function getManagedHomeItems(payload: Awaited<ReturnType<typeof getCachedPayload>>) {
  const result = await payload.find({
    collection: 'homepage-items',
    depth: 2,
    limit: 20,
    overrideAccess: false,
    pagination: false,
    sort: ['placement', '-isPinned', 'sortOrder', '-publishAt'],
    where: {
      placement: {
        in: ['featured-rail', 'collection-shelf'],
      },
    },
  })

  const featuredItems: HomeFeatureItem[] = []
  const shelfItems: HomeShelfItem[] = []

  for (const item of result.docs as HomepageItemLike[]) {
    const imageSrc = await resolveHomepageItemImage(payload, item)
    if (!imageSrc) continue

    const title = normalizeItemText(item.title) || 'Homepage item'
    const alt = normalizeItemText(item.altText) || title
    const id = String(item.id ?? title)

    if (item.placement === 'featured-rail') {
      featuredItems.push({
        alt,
        href: getHomepageItemHref(item),
        id,
        imageSrc,
        ribbonLabel: normalizeItemText(item.ribbonLabel) || normalizeItemText(item.badgeLabel) || 'Featured',
        variant: item.railVariant === 'wide' ? 'wide' : 'standard',
      })
    }

    if (item.placement === 'collection-shelf') {
      shelfItems.push({
        count: getShelfCount(item),
        href: getHomepageItemHref(item),
        id,
        imageSrc,
        title,
      })
    }
  }

  return {
    featuredItems,
    shelfItems,
  }
}

const normalizeSearchQuery = (value: null | string | undefined) => {
  if (typeof value !== 'string') return ''
  return value.trim().slice(0, 80)
}

const normalizeItemText = (value: null | string | undefined) => {
  if (typeof value !== 'string') return ''
  return value.trim()
}

const normalizePageNumber = (value: number | string | null | undefined) => {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 1) return 1
  return Math.floor(parsed)
}

const emptyPagination = (limit: number) => ({
  hasNextPage: false,
  hasPrevPage: false,
  limit,
  page: 1,
  totalDocs: 0,
  totalPages: 1,
})

const emptyPublicBundleList = (limit: number): PublicBundleListResult => ({
  bundles: [],
  pagination: emptyPagination(limit),
})

async function getPublicModelItems(
  payload: Awaited<ReturnType<typeof getCachedPayload>>,
  args: {
    limit: number
    page?: number
    query?: string
    withPagination?: boolean
  },
) {
  const query = normalizeSearchQuery(args.query)
  const andConditions: Where[] = [
    {
      visibility: {
        equals: 'public',
      },
    },
  ]

  if (query.length > 0) {
    andConditions.push({
      or: [
        {
          title: {
            contains: query,
          },
        },
        {
          description: {
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

  const where: Where = andConditions.length === 1 ? andConditions[0] : { and: andConditions }

  const result = await payload.find({
    collection: 'models',
    depth: 2,
    limit: args.limit,
    overrideAccess: false,
    page: normalizePageNumber(args.page),
    pagination: args.withPagination ?? false,
    sort: '-updatedAt',
    where,
  })

  const ownerProfileCache = new Map<number, ReturnType<typeof getPublicOwnerProfile>>()
  const creatorCardCache = new Map<number, ReturnType<typeof getFollowCreatorCardDataForOwner>>()
  const getCachedOwnerProfile = (owner: unknown) => {
    const ownerId = getRelationId(owner)
    if (!ownerId) return Promise.resolve(null)

    const cached = ownerProfileCache.get(ownerId)
    if (cached) return cached

    const next = getPublicOwnerProfile(payload, owner)
    ownerProfileCache.set(ownerId, next)
    return next
  }
  const getCachedCreatorCard = (owner: unknown) => {
    const ownerId = getRelationId(owner)
    if (!ownerId) return Promise.resolve(null)

    const cached = creatorCardCache.get(ownerId)
    if (cached) return cached

    const next = getFollowCreatorCardDataForOwner(payload, owner)
    creatorCardCache.set(ownerId, next)
    return next
  }

  const items = await Promise.all(
    (result.docs as ModelLike[]).map(async (model) => {
      const title = typeof model.title === 'string' && model.title.trim() ? model.title.trim() : `Model ${model.id}`
      const [ownerProfile, creatorCard] = await Promise.all([
        getCachedOwnerProfile(model.owner),
        getCachedCreatorCard(model.owner),
      ])

      return {
        ageLabel: getAgeLabel(model.updatedAt || model.createdAt),
        alt: title,
        authorName: ownerProfile?.name ?? getOwnerName(model.owner),
        avatarSrc: ownerProfile?.avatarSrc ?? null,
        creatorCard,
        favoritesLabel: compactCount(model.favoritesCount),
        filter: getModelInspirationFilter(model),
        href: model.id ? `/model-detail?id=${encodeURIComponent(String(model.id))}` : null,
        id: String(model.id ?? title),
        imageSrc: await resolveMediaAccessURL(payload, getModelPreviewURL(model)),
        likesLabel: compactCount(model.likesCount),
        title,
        viewsLabel: compactCount(model.viewCount),
      } satisfies HomeInspirationItem
    }),
  )

  return {
    items,
    pagination: {
      hasNextPage: Boolean(result.hasNextPage),
      hasPrevPage: Boolean(result.hasPrevPage),
      limit: Number(result.limit || args.limit),
      page: Number(result.page || args.page || 1),
      totalDocs: Number(result.totalDocs || items.length),
      totalPages: Math.max(1, Number(result.totalPages || 1)),
    },
  }
}

export async function getHomeData(args: HomeDataArgs = {}): Promise<HomeData> {
  const inspirationLimit = 24
  const inspirationQuery = normalizeSearchQuery(args.inspirationQuery)
  const inspirationPage = normalizePageNumber(args.inspirationPage)
  const canReuseFallbackModels = inspirationPage === 1 && inspirationQuery.length === 0

  try {
    const payload = await getCachedPayload()
    const bundleLimit = 8
    const [marketing, navUser, managedItems, publicBundles, fallbackModels, separatePaginatedModels] = await Promise.all([
      getMarketingSiteData(),
      getCurrentNavUser(),
      getManagedHomeItems(payload),
      getPublicBundleList(payload, { limit: bundleLimit, withPagination: false }).catch(() => emptyPublicBundleList(bundleLimit)),
      getPublicModelItems(payload, { limit: inspirationLimit, withPagination: canReuseFallbackModels }),
      canReuseFallbackModels
        ? Promise.resolve(null)
        : getPublicModelItems(payload, {
            limit: inspirationLimit,
            page: inspirationPage,
            query: inspirationQuery,
            withPagination: true,
          }),
    ])
    const paginatedModels =
      separatePaginatedModels ??
      {
        items: fallbackModels.items.slice(0, inspirationLimit),
        pagination: {
          hasNextPage: Number(fallbackModels.pagination.totalDocs) > inspirationLimit,
          hasPrevPage: false,
          limit: inspirationLimit,
          page: 1,
          totalDocs: fallbackModels.pagination.totalDocs,
          totalPages: Math.max(1, Math.ceil(Number(fallbackModels.pagination.totalDocs || fallbackModels.items.length) / inspirationLimit)),
        },
      }
    const publicModels = fallbackModels.items
    const publicModelsWithImages = publicModels.filter((item) => Boolean(item.imageSrc))
    const bundleFeatureItems = getBundleFeatureItems(publicBundles.bundles)
    const bundleShelfItems = getBundleShelfItems(publicBundles.bundles)
    const featuredFallbackItems = publicModelsWithImages.slice(0, 4)
    const shelfFallbackItems = publicModelsWithImages.slice(4, 8)
    const modelShelfItems = (shelfFallbackItems.length > 0 ? shelfFallbackItems : featuredFallbackItems).map((item) => ({
      count: '1 Model',
      href: item.href,
      id: item.id,
      imageSrc: item.imageSrc as string,
      title: item.title,
    }))
    const heroHeaderBackgroundSrc = await resolveMediaAccessURL(
      payload,
      getOriginalImageURL(marketing.homepageContent.hero?.headerBackground),
    )

    return {
      featuredItems:
        managedItems.featuredItems.length > 0
          ? managedItems.featuredItems
          : bundleFeatureItems.length > 0
            ? bundleFeatureItems
            : featuredFallbackItems.map((item, index) => ({
                alt: item.title,
                href: item.href,
                id: `featured-${item.id}`,
                imageSrc: item.imageSrc as string,
                ribbonLabel: index === 0 ? 'New Product' : 'Featured',
                variant: index === 0 ? 'wide' : 'standard',
              })),
      footer: {
        content: marketing.siteSettings.footer,
        siteDescription: marketing.siteSettings.siteDescription || 'An AI 3D product platform for character creation, asset management, and print fulfillment.',
        supportEmail: marketing.siteSettings.supportEmail || 'service@thornstavern.com',
      },
      heroHeaderBackgroundSrc,
      inspirationFilter: 'all',
      inspirationItems: paginatedModels.items.filter((item) => Boolean(item.imageSrc)),
      inspirationPagination: paginatedModels.pagination,
      inspirationSearchQuery: inspirationQuery,
      navUser: navUser
        ? {
            avatarUrl: navUser.avatarUrl,
            bio: navUser.bio,
            credits: navUser.creditsBalance,
            creditsBalance: navUser.creditsBalance,
            displayName: navUser.displayName,
            email: navUser.email,
            followersCount: navUser.followersCount,
            followingCount: navUser.followingCount,
            hasActiveSubscription: navUser.hasActiveSubscription,
            id: navUser.id,
            modelsCount: navUser.modelsCount,
            name: navUser.displayName,
            role: navUser.role,
          }
        : null,
      navigationPromotion: marketing.siteSettings.navigationPromotion,
      shelfItems:
        managedItems.shelfItems.length > 0
          ? withBundleMoreItem(managedItems.shelfItems)
          : withBundleMoreItem(bundleShelfItems.length > 0 ? bundleShelfItems : modelShelfItems),
    }
  } catch {
    return {
      featuredItems: [],
      footer: {
        content: defaultSiteSettings.footer,
        siteDescription: defaultSiteSettings.siteDescription,
        supportEmail: defaultSiteSettings.supportEmail,
      },
      heroHeaderBackgroundSrc: null,
      inspirationFilter: 'all',
      inspirationItems: [],
      inspirationPagination: emptyPagination(inspirationLimit),
      inspirationSearchQuery: inspirationQuery,
      navUser: null,
      navigationPromotion: defaultSiteSettings.navigationPromotion,
      shelfItems: [],
    }
  }
}
