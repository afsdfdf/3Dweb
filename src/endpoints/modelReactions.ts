import type { PayloadRequest } from 'payload'

import {
  favoriteModel,
  getModelReactionState,
  likeModel,
  listCurrentUserFavoriteModels,
  unfavoriteModel,
  unlikeModel,
} from '@/lib/reactionService'
import { rejectRateLimitedEndpoint } from '@/lib/endpointRateLimit'
import { ensurePayloadRequestUser } from '@/lib/payloadAuthFallback'
import { rejectDisallowedMutationOrigin } from '@/lib/requestSecurity'

const unauthorized = () => Response.json({ message: 'Please sign in first.' }, { status: 401 })

const parseModelId = (req: PayloadRequest) => {
  const modelId = Number(String(req.routeParams?.modelId || '0'))
  return Number.isFinite(modelId) && modelId > 0 ? modelId : 0
}

export const getModelReactionStateEndpoint = {
  path: '/social/models/:modelId/reactions',
  method: 'get' as const,
  handler: async (req: PayloadRequest) => {
    try {
      await ensurePayloadRequestUser(req)

      const modelId = parseModelId(req)
      if (!modelId) {
        return Response.json({ message: 'Invalid model ID.' }, { status: 400 })
      }

      const result = await getModelReactionState({
        modelId,
        req,
      })

      return Response.json(result)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load reaction state.'
      const status = message.includes('public models') ? 404 : 400
      return Response.json({ message }, { status })
    }
  },
}

export const likeModelEndpoint = {
  path: '/social/models/:modelId/like',
  method: 'post' as const,
  handler: async (req: PayloadRequest) => {
    const blocked = await rejectDisallowedMutationOrigin(req)
    if (blocked) return blocked

    const rateLimited = await rejectRateLimitedEndpoint({
      req,
      scope: 'social-reaction-write',
    })
    if (rateLimited) return rateLimited

    await ensurePayloadRequestUser(req)
    if (!req.user) return unauthorized()

    try {
      const modelId = parseModelId(req)
      if (!modelId) {
        return Response.json({ message: 'Invalid model ID.' }, { status: 400 })
      }

      const result = await likeModel({
        modelId,
        req,
      })

      return Response.json({
        message: 'Model liked successfully.',
        ...result,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to like model.'
      return Response.json({ message }, { status: 400 })
    }
  },
}

export const unlikeModelEndpoint = {
  path: '/social/models/:modelId/like',
  method: 'delete' as const,
  handler: async (req: PayloadRequest) => {
    const blocked = await rejectDisallowedMutationOrigin(req)
    if (blocked) return blocked

    const rateLimited = await rejectRateLimitedEndpoint({
      req,
      scope: 'social-reaction-write',
    })
    if (rateLimited) return rateLimited

    await ensurePayloadRequestUser(req)
    if (!req.user) return unauthorized()

    try {
      const modelId = parseModelId(req)
      if (!modelId) {
        return Response.json({ message: 'Invalid model ID.' }, { status: 400 })
      }

      const result = await unlikeModel({
        modelId,
        req,
      })

      return Response.json({
        message: 'Model unliked successfully.',
        ...result,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to unlike model.'
      return Response.json({ message }, { status: 400 })
    }
  },
}

export const favoriteModelEndpoint = {
  path: '/social/models/:modelId/favorite',
  method: 'post' as const,
  handler: async (req: PayloadRequest) => {
    const blocked = await rejectDisallowedMutationOrigin(req)
    if (blocked) return blocked

    const rateLimited = await rejectRateLimitedEndpoint({
      req,
      scope: 'social-reaction-write',
    })
    if (rateLimited) return rateLimited

    await ensurePayloadRequestUser(req)
    if (!req.user) return unauthorized()

    try {
      const modelId = parseModelId(req)
      if (!modelId) {
        return Response.json({ message: 'Invalid model ID.' }, { status: 400 })
      }

      const result = await favoriteModel({
        modelId,
        req,
      })

      return Response.json({
        message: 'Model favorited successfully.',
        ...result,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to favorite model.'
      return Response.json({ message }, { status: 400 })
    }
  },
}

export const unfavoriteModelEndpoint = {
  path: '/social/models/:modelId/favorite',
  method: 'delete' as const,
  handler: async (req: PayloadRequest) => {
    const blocked = await rejectDisallowedMutationOrigin(req)
    if (blocked) return blocked

    const rateLimited = await rejectRateLimitedEndpoint({
      req,
      scope: 'social-reaction-write',
    })
    if (rateLimited) return rateLimited

    await ensurePayloadRequestUser(req)
    if (!req.user) return unauthorized()

    try {
      const modelId = parseModelId(req)
      if (!modelId) {
        return Response.json({ message: 'Invalid model ID.' }, { status: 400 })
      }

      const result = await unfavoriteModel({
        modelId,
        req,
      })

      return Response.json({
        message: 'Model unfavorited successfully.',
        ...result,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to unfavorite model.'
      return Response.json({ message }, { status: 400 })
    }
  },
}

export const listCurrentUserFavoritesEndpoint = {
  path: '/account/favorites',
  method: 'get' as const,
  handler: async (req: PayloadRequest) => {
    await ensurePayloadRequestUser(req)
    if (!req.user) return unauthorized()

    try {
      const favorites = await listCurrentUserFavoriteModels(req)
      return Response.json(favorites)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load favorite models.'
      return Response.json({ message }, { status: 400 })
    }
  },
}
