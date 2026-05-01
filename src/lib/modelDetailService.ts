import type { PayloadRequest } from 'payload'

import { listModelComments } from '@/lib/commentService'
import { getFollowState } from '@/lib/followService'
import { isGuestReadableMedia } from '@/lib/mediaVisibility'
import { getModelReactionState } from '@/lib/reactionService'

const accessOptions = (req: PayloadRequest) => {
  return req.user ? { overrideAccess: false as const, user: req.user } : { overrideAccess: false as const }
}

const normalizeText = (value: unknown) => (typeof value === 'string' && value.trim() ? value.trim() : null)

const getMediaUrl = (value: unknown) => {
  if (!value || typeof value !== 'object') return null
  const candidate = value as { thumbnailURL?: unknown; url?: unknown }
  if (typeof candidate.thumbnailURL === 'string' && candidate.thumbnailURL) return candidate.thumbnailURL
  if (typeof candidate.url === 'string' && candidate.url) return candidate.url
  return null
}

const getPublicMediaUrl = (value: unknown) => {
  if (!value || typeof value !== 'object' || !isGuestReadableMedia(value)) return null
  return getMediaUrl(value)
}

const normalizeFocalPoint = (value: unknown) => {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return 50
  return Math.max(0, Math.min(100, numeric))
}

const resolveRelationId = (value: unknown) => {
  if (typeof value === 'number') return value
  if (typeof value === 'string' && value.trim()) return Number(value)
  if (value && typeof value === 'object' && 'id' in value) {
    const candidate = (value as { id?: number | string | null }).id
    return candidate !== undefined && candidate !== null ? Number(candidate) : 0
  }
  return 0
}

export async function getModelDetail(args: {
  modelId: number
  req: PayloadRequest
}) {
  const model = await args.req.payload.findByID({
    collection: 'models',
    depth: 2,
    id: args.modelId,
    req: args.req,
    ...accessOptions(args.req),
  })

  const ownerId = resolveRelationId(model.owner)
  const owner =
    ownerId > 0
      ? await args.req.payload
          .findByID({
            collection: 'users',
            depth: 1,
            id: ownerId,
            overrideAccess: true,
            req: args.req,
          })
          .catch(() => null)
      : null
  const isOwner = args.req.user ? Number(args.req.user.id) === ownerId : false
  const isStaff = ['admin', 'operator'].includes(String(args.req.user?.role || 'customer'))
  const ownerProfileVisibility = String(owner?.profileVisibility || 'private')
  const ownerProfileIsPublic = ownerProfileVisibility === 'public'
  const followable = Boolean(ownerId && ownerProfileIsPublic && !isOwner)
  const isFollowingOwner = followable
    ? await getFollowState({
        req: args.req,
        targetUserId: ownerId,
      })
    : false

  const [reactionState, commentsPreview] = await Promise.all([
    getModelReactionState({
      modelId: args.modelId,
      req: args.req,
    }).catch(() => ({
      favoritesCount: Number(model.favoritesCount || 0),
      isFavorited: false,
      isLiked: false,
      likesCount: Number(model.likesCount || 0),
      modelId: args.modelId,
    })),
    model.visibility === 'public'
      ? listModelComments({
          limit: 3,
          modelId: args.modelId,
          page: 1,
          req: args.req,
        }).catch(() => ({ docs: [], totalDocs: Number(model.commentsCount || 0) }))
      : Promise.resolve({ docs: [], totalDocs: Number(model.commentsCount || 0) }),
  ])

  return {
    actions: {
      canComment: model.visibility === 'public' && Boolean(args.req.user),
      canDownload: model.visibility === 'public' || isOwner || isStaff,
      canEdit: isOwner || isStaff,
      canHide: isOwner || isStaff,
      canPrint: Boolean(model.printReady) && (isOwner || isStaff || model.visibility === 'public'),
      canPublish: isOwner || isStaff,
    },
    commentsPreview,
    model: {
      commentsCount: Number(model.commentsCount || 0),
      description: normalizeText(model.description),
      favoritesCount: Number(model.favoritesCount || 0),
      formats: Array.isArray(model.formats) ? model.formats : [],
      id: Number(model.id),
      likesCount: Number(model.likesCount || 0),
      previewImageUrl: getMediaUrl(model.previewImage),
      printReady: Boolean(model.printReady),
      status: String(model.status || 'draft'),
      tags: Array.isArray(model.tags) ? model.tags : [],
      title: String(model.title || ''),
      viewCount: Number(model.viewCount || 0),
      viewerUrl: normalizeText(model.viewerUrl),
      visibility: String(model.visibility || 'private'),
    },
    ownerProfile: owner
      ? {
          avatarFrame: String(owner.avatarFrame || 'none'),
          avatarUrl: getPublicMediaUrl(owner.avatar),
          backgroundUrl: getPublicMediaUrl(owner.profileBackground),
          bio: ownerProfileIsPublic ? normalizeText(owner.bio) : null,
          displayName: normalizeText(owner.displayName) || normalizeText(owner.fullName) || `Creator ${owner.id}`,
          followersCount: Number(owner.followersCount || 0),
          followingCount: Number(owner.followingCount || 0),
          id: ownerId,
          profileBanner: resolveRelationId(owner.profileBackground) || null,
          profileBannerFocalX: normalizeFocalPoint(owner.profileBannerFocalX),
          profileBannerFocalY: normalizeFocalPoint(owner.profileBannerFocalY),
          profileBannerUrl: getPublicMediaUrl(owner.profileBackground),
          profileViewCount: Number(owner.profileViewCount || 0),
          profileVisibility: ownerProfileVisibility,
        }
      : null,
    social: {
      ...reactionState,
      isFollowingOwner,
    },
  }
}
