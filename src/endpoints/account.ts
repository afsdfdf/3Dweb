import type { PayloadRequest } from 'payload'

import {
  changeAccountPassword,
  getAccountDashboard,
  getAccountProfile,
  getPublicCreatorProfile,
  updateAccountProfile,
} from '@/lib/accountService'
import { rejectRateLimitedEndpoint } from '@/lib/endpointRateLimit'
import { followCreator, listCurrentUserFollows, unfollowCreator } from '@/lib/followService'
import { ensurePayloadRequestUser } from '@/lib/payloadAuthFallback'
import { rejectDisallowedMutationOrigin } from '@/lib/requestSecurity'

const unauthorized = () => Response.json({ message: 'Please sign in first.' }, { status: 401 })

export const getAccountProfileEndpoint = {
  path: '/account/profile',
  method: 'get' as const,
  handler: async (req: PayloadRequest) => {
    await ensurePayloadRequestUser(req)
    if (!req.user) return unauthorized()

    try {
      const profile = await getAccountProfile(req)
      return Response.json({ profile })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load account profile.'
      return Response.json({ message }, { status: 400 })
    }
  },
}

export const updateAccountProfileEndpoint = {
  path: '/account/profile',
  method: 'patch' as const,
  handler: async (req: PayloadRequest) => {
    const blocked = await rejectDisallowedMutationOrigin(req)
    if (blocked) return blocked

    const rateLimited = await rejectRateLimitedEndpoint({
      req,
      scope: 'social-follow-write',
    })
    if (rateLimited) return rateLimited

    await ensurePayloadRequestUser(req)
    if (!req.user) return unauthorized()

    try {
      const body = req.json ? await req.json() : {}
      const profile = await updateAccountProfile({
        input: {
          avatar: body.avatar,
          avatarFrame: body.avatarFrame,
          bio: body.bio,
          displayName: body.displayName,
          fullName: body.fullName,
          phone: body.phone,
          profileBackground: body.profileBackground,
          profileVisibility: body.profileVisibility,
        },
        req,
      })

      return Response.json({
        message: 'Profile updated successfully.',
        profile,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update profile.'
      return Response.json({ message }, { status: 400 })
    }
  },
}

export const getAccountDashboardEndpoint = {
  path: '/account/dashboard',
  method: 'get' as const,
  handler: async (req: PayloadRequest) => {
    await ensurePayloadRequestUser(req)
    if (!req.user) return unauthorized()

    try {
      const dashboard = await getAccountDashboard(req)
      return Response.json(dashboard)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load account dashboard.'
      return Response.json({ message }, { status: 400 })
    }
  },
}

export const changeAccountPasswordEndpoint = {
  path: '/account/password',
  method: 'post' as const,
  handler: async (req: PayloadRequest) => {
    const blocked = await rejectDisallowedMutationOrigin(req)
    if (blocked) return blocked

    const rateLimited = await rejectRateLimitedEndpoint({
      req,
      scope: 'social-follow-write',
    })
    if (rateLimited) return rateLimited

    await ensurePayloadRequestUser(req)
    if (!req.user) return unauthorized()

    try {
      const body = req.json ? await req.json() : {}
      const result = await changeAccountPassword({
        input: {
          confirmNewPassword: String(body.confirmNewPassword || ''),
          currentPassword: String(body.currentPassword || ''),
          newPassword: String(body.newPassword || ''),
        },
        req,
      })

      return Response.json({
        message: 'Password updated successfully.',
        ...result,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update password.'
      return Response.json({ message }, { status: 400 })
    }
  },
}

export const getCreatorProfileEndpoint = {
  path: '/creators/:userId',
  method: 'get' as const,
  handler: async (req: PayloadRequest) => {
    try {
      await ensurePayloadRequestUser(req)

      const userId = Number(String(req.routeParams?.userId || '0'))
      if (!Number.isFinite(userId) || userId <= 0) {
        return Response.json({ message: 'Invalid creator ID.' }, { status: 400 })
      }

      const creator = await getPublicCreatorProfile({
        req,
        userId,
      })

      return Response.json(creator)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load creator profile.'
      const status = message.includes('not public') ? 404 : 400
      return Response.json({ message }, { status })
    }
  },
}

export const listCurrentUserFollowsEndpoint = {
  path: '/account/follows',
  method: 'get' as const,
  handler: async (req: PayloadRequest) => {
    await ensurePayloadRequestUser(req)
    if (!req.user) return unauthorized()

    try {
      const follows = await listCurrentUserFollows(req)
      return Response.json(follows)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load follows.'
      return Response.json({ message }, { status: 400 })
    }
  },
}

export const followCreatorEndpoint = {
  path: '/creators/:userId/follow',
  method: 'post' as const,
  handler: async (req: PayloadRequest) => {
    const blocked = await rejectDisallowedMutationOrigin(req)
    if (blocked) return blocked
    const rateLimited = await rejectRateLimitedEndpoint({
      req,
      scope: 'social-follow-write',
    })
    if (rateLimited) return rateLimited

    await ensurePayloadRequestUser(req)
    if (!req.user) return unauthorized()

    try {
      const userId = Number(String(req.routeParams?.userId || '0'))
      if (!Number.isFinite(userId) || userId <= 0) {
        return Response.json({ message: 'Invalid creator ID.' }, { status: 400 })
      }

      const result = await followCreator({
        req,
        targetUserId: userId,
      })

      return Response.json({
        message: 'Creator followed successfully.',
        ...result,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to follow creator.'
      return Response.json({ message }, { status: 400 })
    }
  },
}

export const unfollowCreatorEndpoint = {
  path: '/creators/:userId/follow',
  method: 'delete' as const,
  handler: async (req: PayloadRequest) => {
    const blocked = await rejectDisallowedMutationOrigin(req)
    if (blocked) return blocked
    const rateLimited = await rejectRateLimitedEndpoint({
      req,
      scope: 'social-follow-write',
    })
    if (rateLimited) return rateLimited

    await ensurePayloadRequestUser(req)
    if (!req.user) return unauthorized()

    try {
      const userId = Number(String(req.routeParams?.userId || '0'))
      if (!Number.isFinite(userId) || userId <= 0) {
        return Response.json({ message: 'Invalid creator ID.' }, { status: 400 })
      }

      const result = await unfollowCreator({
        req,
        targetUserId: userId,
      })

      return Response.json({
        message: 'Creator unfollowed successfully.',
        ...result,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to unfollow creator.'
      return Response.json({ message }, { status: 400 })
    }
  },
}
