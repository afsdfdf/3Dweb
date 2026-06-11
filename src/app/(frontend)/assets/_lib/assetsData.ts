import type { Where } from 'payload'

import { getCurrentUser } from '@/app/(frontend)/_lib/session'
import { getCachedPayload } from '@/lib/getCachedPayload'
import { getMediaAccessURL } from '@/lib/mediaAccessURL'
import { getModelPreviewURL } from '@/lib/modelAssetURL'

import type { AssetsPreviewCreator, AssetsPreviewModel } from '../../assets-preview/assetsPreviewData'

type ImageLike = {
  thumbnailURL?: null | string
  url?: null | string
}

type UserLike = {
  avatar?: null | number | ImageLike
  bio?: null | string
  displayName?: null | string
  email?: null | string
  followersCount?: null | number
  fullName?: null | string
  id?: number | string
  profileBackground?: null | number | ImageLike
  profileVisibility?: null | string
}

type ModelLike = {
  createdAt?: null | string
  favoritesCount?: null | number
  id?: number | string
  likesCount?: null | number
  owner?: unknown
  previewImage?: unknown
  sourceTask?: unknown
  title?: null | string
  updatedAt?: null | string
  viewCount?: null | number
  visibility?: null | string
}

type RelationLike = {
  createdAt?: null | string
  followee?: unknown
  model?: unknown
}

export type AssetsPageInitialData = {
  creators: AssetsPreviewCreator[]
  currentCreatorId: string
  models: AssetsPreviewModel[]
}

const fallbackAvatarSrc = '/ui-lab/top-navigation/icon-user-avatar-placeholder.png'
const fallbackBannerSrc = '/ui/workbench/model-detail/sketch-assets/rail-banner-bg.webp'
const fallbackModelImageSrc = '/ui-lab/workbench-assets/monk-large.webp'

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

const normalizeText = (value: unknown) => {
  return typeof value === 'string' && value.trim() ? value.trim() : null
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

async function resolveMediaURL(payload: Awaited<ReturnType<typeof getCachedPayload>>, value: null | string | undefined) {
  const normalized = normalizeBrowserMediaURL(value)
  if (!normalized) return null
  if (normalized.startsWith('/')) return normalized

  return normalizeBrowserMediaURL(await getMediaAccessURL({ payload, url: normalized }))
}

function getImageURL(value: unknown) {
  if (!isRecord(value)) return null

  return normalizeText(value.thumbnailURL) || normalizeText(value.url)
}

function getRelationId(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  if (typeof value === 'string' && value.trim()) return value.trim()
  if (isRecord(value) && (typeof value.id === 'number' || typeof value.id === 'string')) {
    return String(value.id)
  }

  return null
}

function compactCount(value: unknown, fallback = '0') {
  const count = Number(value ?? 0)
  if (!Number.isFinite(count) || count <= 0) return fallback
  if (count >= 1000) return `${(count / 1000).toFixed(count >= 10000 ? 0 : 1)}k`
  return String(count)
}

function getAgeLabel(value: null | string | undefined) {
  if (!value) return 'Recently'

  const timestamp = new Date(value).getTime()
  if (!Number.isFinite(timestamp)) return 'Recently'

  const days = Math.max(1, Math.round((Date.now() - timestamp) / 86_400_000))
  if (days < 30) return `${days} Days ago`

  const months = Math.max(1, Math.round(days / 30))
  return `${months} Months ago`
}

function getDisplayName(user: UserLike | null | undefined, fallbackId: string) {
  return (
    normalizeText(user?.displayName) ||
    normalizeText(user?.fullName) ||
    normalizeText(user?.email)?.split('@')[0] ||
    `Creator ${fallbackId}`
  )
}

async function countCreatorModels(args: {
  currentUser: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>
  isCurrentUser: boolean
  ownerId: string
  payload: Awaited<ReturnType<typeof getCachedPayload>>
}) {
  const filters: Where[] = [
    {
      owner: {
        equals: args.ownerId,
      },
    },
  ]

  if (!args.isCurrentUser) {
    filters.push({
      visibility: {
        equals: 'public',
      },
    })
  }

  const result = await args.payload.count({
    collection: 'models',
    overrideAccess: false,
    user: args.currentUser,
    where: filters.length === 1 ? filters[0] : { and: filters },
  })

  return Number(result.totalDocs || 0)
}

export async function getAssetsPageData(): Promise<AssetsPageInitialData | null> {
  const currentUser = await getCurrentUser()
  if (!currentUser) return null

  const payload = await getCachedPayload()
  const currentCreatorId = String(currentUser.id)
  const userCache = new Map<string, Promise<UserLike | null>>()
  const modelCountCache = new Map<string, Promise<number>>()
  const creatorCache = new Map<string, Promise<AssetsPreviewCreator>>()

  const getUserById = (userId: string) => {
    const cached = userCache.get(userId)
    if (cached) return cached

    const next = payload
      .findByID({
        collection: 'users',
        depth: 1,
        id: userId,
        ...(userId === currentCreatorId
          ? {
              overrideAccess: false,
              user: currentUser,
            }
          : {
              overrideAccess: true,
            }),
      })
      .then((user) => user as UserLike)
      .catch(() => null)

    userCache.set(userId, next)
    return next
  }

  const getCreatorModelCount = (ownerId: string) => {
    const cached = modelCountCache.get(ownerId)
    if (cached) return cached

    const next = countCreatorModels({
      currentUser,
      isCurrentUser: ownerId === currentCreatorId,
      ownerId,
      payload,
    }).catch(() => 0)

    modelCountCache.set(ownerId, next)
    return next
  }

  const getCreator = (ownerId: string, followedCreatorIds: Set<string>) => {
    const cached = creatorCache.get(ownerId)
    if (cached) return cached

    const next = (async () => {
      const user = await getUserById(ownerId)
      const canShowProfileMedia = ownerId === currentCreatorId || user?.profileVisibility === 'public'
      const [avatarSrc, bannerSrc, modelsCount] = await Promise.all([
        canShowProfileMedia ? resolveMediaURL(payload, getImageURL(user?.avatar)) : Promise.resolve(null),
        canShowProfileMedia ? resolveMediaURL(payload, getImageURL(user?.profileBackground)) : Promise.resolve(null),
        getCreatorModelCount(ownerId),
      ])

      return {
        avatarSrc: avatarSrc || fallbackAvatarSrc,
        bannerSrc: bannerSrc || fallbackBannerSrc,
        bio: canShowProfileMedia
          ? normalizeText(user?.bio) || 'Creator assets and printable model library.'
          : 'Creator assets and printable model library.',
        displayName: getDisplayName(user, ownerId),
        followersLabel: compactCount(user?.followersCount),
        id: ownerId,
        isFollowing: ownerId !== currentCreatorId && followedCreatorIds.has(ownerId),
        modelsLabel: compactCount(modelsCount),
      } satisfies AssetsPreviewCreator
    })()

    creatorCache.set(ownerId, next)
    return next
  }

  const [ownedModelsResult, favoritesResult, followsResult] = await Promise.all([
    payload.find({
      collection: 'models',
      depth: 2,
      limit: 80,
      overrideAccess: false,
      pagination: false,
      sort: '-updatedAt',
      user: currentUser,
      where: {
        owner: {
          equals: currentCreatorId,
        },
      },
    }),
    payload.find({
      collection: 'model-favorites',
      depth: 2,
      limit: 80,
      overrideAccess: false,
      pagination: false,
      sort: '-createdAt',
      user: currentUser,
      where: {
        user: {
          equals: currentCreatorId,
        },
      },
    }),
    payload.find({
      collection: 'user-follows',
      depth: 1,
      limit: 80,
      overrideAccess: false,
      pagination: false,
      sort: '-createdAt',
      user: currentUser,
      where: {
        follower: {
          equals: currentCreatorId,
        },
      },
    }),
  ])

  const favoriteDocs = favoritesResult.docs as RelationLike[]
  const followDocs = followsResult.docs as RelationLike[]
  const favoriteModelIds = new Set(favoriteDocs.map((favorite) => getRelationId(favorite.model)).filter((id): id is string => Boolean(id)))
  const followedCreatorIds = new Set(followDocs.map((follow) => getRelationId(follow.followee)).filter((id): id is string => Boolean(id)))
  const followedCreatorList = [...followedCreatorIds]

  const followedModelsResult = followedCreatorList.length > 0
    ? await payload.find({
        collection: 'models',
        depth: 2,
        limit: 80,
        overrideAccess: false,
        pagination: false,
        sort: '-updatedAt',
        user: currentUser,
        where: {
          and: [
            {
              visibility: {
                equals: 'public',
              },
            },
            {
              owner: {
                in: followedCreatorList,
              },
            },
          ],
        },
      })
    : { docs: [] }

  const modelsById = new Map<string, ModelLike>()
  for (const model of ownedModelsResult.docs as ModelLike[]) {
    const id = getRelationId(model)
    if (id) modelsById.set(id, model)
  }
  for (const favorite of favoriteDocs) {
    if (isRecord(favorite.model)) {
      const id = getRelationId(favorite.model)
      if (id) modelsById.set(id, favorite.model as ModelLike)
    }
  }
  for (const model of followedModelsResult.docs as ModelLike[]) {
    const id = getRelationId(model)
    if (id) modelsById.set(id, model)
  }

  const creatorIds = new Set<string>([currentCreatorId, ...followedCreatorIds])
  const models: Array<AssetsPreviewModel | null> = await Promise.all(
    [...modelsById.values()].map(async (model) => {
      const modelId = getRelationId(model)
      if (!modelId) return null

      const creatorId = getRelationId(model.owner) || currentCreatorId
      creatorIds.add(creatorId)
      const previewURL = await resolveMediaURL(payload, getModelPreviewURL(model))
      const title = normalizeText(model.title) || `Model ${modelId}`

      return {
        ageLabel: getAgeLabel(model.updatedAt || model.createdAt),
        createdAt: normalizeText(model.updatedAt) || normalizeText(model.createdAt) || new Date(0).toISOString(),
        creatorId,
        favoritesLabel: compactCount(model.favoritesCount),
        id: modelId,
        imageSrc: previewURL || fallbackModelImageSrc,
        isFavorited: favoriteModelIds.has(modelId),
        isOwned: creatorId === currentCreatorId,
        likesLabel: compactCount(model.likesCount),
        title,
        tone: 'steel',
        viewsLabel: compactCount(model.viewCount),
        visibility: model.visibility === 'public' ? 'public' : 'private',
      } satisfies AssetsPreviewModel
    }),
  )

  const creators = await Promise.all([...creatorIds].map((creatorId) => getCreator(creatorId, followedCreatorIds)))

  return {
    creators,
    currentCreatorId,
    models: models.filter((model): model is AssetsPreviewModel => Boolean(model)),
  }
}
