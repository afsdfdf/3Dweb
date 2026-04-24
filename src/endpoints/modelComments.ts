import type { PayloadRequest } from 'payload'

import { createModelComment, deleteModelComment, listModelComments, moderateModelComment } from '@/lib/commentService'
import { rejectRateLimitedEndpoint } from '@/lib/endpointRateLimit'
import { ensurePayloadRequestUser } from '@/lib/payloadAuthFallback'
import { rejectDisallowedMutationOrigin } from '@/lib/requestSecurity'

const unauthorized = () => Response.json({ message: 'Please sign in first.' }, { status: 401 })

export const listModelCommentsEndpoint = {
  path: '/social/models/:modelId/comments',
  method: 'get' as const,
  handler: async (req: PayloadRequest) => {
    try {
      await ensurePayloadRequestUser(req)

      const modelId = Number(String(req.routeParams?.modelId || '0'))
      if (!Number.isFinite(modelId) || modelId <= 0) {
        return Response.json({ message: 'Invalid model ID.' }, { status: 400 })
      }

      const page = Number(String(req.query?.page || '1'))
      const limit = Number(String(req.query?.limit || '20'))
      const comments = await listModelComments({
        limit,
        modelId,
        page,
        req,
      })

      return Response.json(comments)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load comments.'
      const status = message.includes('public models') ? 404 : 400
      return Response.json({ message }, { status })
    }
  },
}

export const createModelCommentEndpoint = {
  path: '/social/models/:modelId/comments',
  method: 'post' as const,
  handler: async (req: PayloadRequest) => {
    const blocked = await rejectDisallowedMutationOrigin(req)
    if (blocked) return blocked

    const rateLimited = await rejectRateLimitedEndpoint({
      req,
      scope: 'social-comment-write',
    })
    if (rateLimited) return rateLimited

    await ensurePayloadRequestUser(req)
    if (!req.user) return unauthorized()

    try {
      const modelId = Number(String(req.routeParams?.modelId || '0'))
      if (!Number.isFinite(modelId) || modelId <= 0) {
        return Response.json({ message: 'Invalid model ID.' }, { status: 400 })
      }

      const body = req.json ? await req.json() : {}
      const comment = await createModelComment({
        content: String(body.content || ''),
        modelId,
        req,
      })

      return Response.json({
        comment,
        message: 'Comment created successfully.',
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create comment.'
      return Response.json({ message }, { status: 400 })
    }
  },
}

export const deleteModelCommentEndpoint = {
  path: '/social/models/:modelId/comments/:commentId',
  method: 'delete' as const,
  handler: async (req: PayloadRequest) => {
    const blocked = await rejectDisallowedMutationOrigin(req)
    if (blocked) return blocked

    const rateLimited = await rejectRateLimitedEndpoint({
      req,
      scope: 'social-comment-write',
    })
    if (rateLimited) return rateLimited

    await ensurePayloadRequestUser(req)
    if (!req.user) return unauthorized()

    try {
      const commentId = Number(String(req.routeParams?.commentId || '0'))
      const modelId = Number(String(req.routeParams?.modelId || '0'))
      if (!Number.isFinite(commentId) || commentId <= 0 || !Number.isFinite(modelId) || modelId <= 0) {
        return Response.json({ message: 'Invalid comment or model ID.' }, { status: 400 })
      }

      const result = await deleteModelComment({
        commentId,
        modelId,
        req,
      })

      return Response.json({
        message: 'Comment deleted successfully.',
        ...result,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete comment.'
      return Response.json({ message }, { status: 400 })
    }
  },
}

export const moderateModelCommentEndpoint = {
  path: '/social/models/:modelId/comments/:commentId/moderation',
  method: 'patch' as const,
  handler: async (req: PayloadRequest) => {
    const blocked = await rejectDisallowedMutationOrigin(req)
    if (blocked) return blocked

    const rateLimited = await rejectRateLimitedEndpoint({
      req,
      scope: 'social-comment-write',
    })
    if (rateLimited) return rateLimited

    await ensurePayloadRequestUser(req)
    if (!req.user) return unauthorized()

    try {
      const commentId = Number(String(req.routeParams?.commentId || '0'))
      const modelId = Number(String(req.routeParams?.modelId || '0'))
      if (!Number.isFinite(commentId) || commentId <= 0 || !Number.isFinite(modelId) || modelId <= 0) {
        return Response.json({ message: 'Invalid comment or model ID.' }, { status: 400 })
      }

      const body = req.json ? await req.json() : {}
      const status = body.status === 'hidden' ? 'hidden' : body.status === 'visible' ? 'visible' : null
      if (!status) {
        return Response.json({ message: 'Invalid moderation status.' }, { status: 400 })
      }

      const comment = await moderateModelComment({
        commentId,
        modelId,
        req,
        status,
      })

      return Response.json({
        comment,
        message: 'Comment moderation updated successfully.',
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to moderate comment.'
      return Response.json({ message }, { status: 400 })
    }
  },
}
