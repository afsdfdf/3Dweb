import type { PayloadRequest } from 'payload'

import { rejectRateLimitedEndpoint } from '@/lib/endpointRateLimit'
import {
  getUnreadNotificationCount,
  listAccountNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  serializeNotification,
} from '@/lib/notificationService'
import { ensurePayloadRequestUser } from '@/lib/payloadAuthFallback'
import { rejectDisallowedMutationOrigin } from '@/lib/requestSecurity'

const unauthorized = () => Response.json({ message: 'Please sign in first.' }, { status: 401 })

const getRequestURL = (req: PayloadRequest) => {
  return new URL(req.url || 'http://127.0.0.1')
}

const getRouteParam = (value: unknown) => {
  if (Array.isArray(value)) return value[0]
  return typeof value === 'string' ? value : ''
}

export const listAccountNotificationsEndpoint = {
  path: '/account/notifications',
  method: 'get' as const,
  handler: async (req: PayloadRequest) => {
    await ensurePayloadRequestUser(req)
    if (!req.user) return unauthorized()

    try {
      const url = getRequestURL(req)
      const result = await listAccountNotifications({
        limit: url.searchParams.get('limit'),
        req,
        userId: req.user.id,
      })

      return Response.json({
        notifications: result.docs.map(serializeNotification),
        unreadCount: result.unreadCount,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load notifications.'
      return Response.json({ message }, { status: 400 })
    }
  },
}

export const getUnreadNotificationCountEndpoint = {
  path: '/account/notifications/unread-count',
  method: 'get' as const,
  handler: async (req: PayloadRequest) => {
    await ensurePayloadRequestUser(req)
    if (!req.user) return unauthorized()

    try {
      const unreadCount = await getUnreadNotificationCount({
        req,
        userId: req.user.id,
      })

      return Response.json({ unreadCount })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load notifications.'
      return Response.json({ message }, { status: 400 })
    }
  },
}

export const markNotificationReadEndpoint = {
  path: '/account/notifications/:notificationId/read',
  method: 'patch' as const,
  handler: async (req: PayloadRequest) => {
    const blocked = await rejectDisallowedMutationOrigin(req)
    if (blocked) return blocked

    const rateLimited = await rejectRateLimitedEndpoint({
      req,
      scope: 'account-notifications-write',
    })
    if (rateLimited) return rateLimited

    await ensurePayloadRequestUser(req)
    if (!req.user) return unauthorized()

    try {
      const notification = await markNotificationRead({
        notificationId: getRouteParam(req.routeParams?.notificationId),
        req,
        userId: req.user.id,
      })

      return Response.json({
        notification: serializeNotification(notification),
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update notification.'
      return Response.json({ message }, { status: 400 })
    }
  },
}

export const markAllNotificationsReadEndpoint = {
  path: '/account/notifications/read-all',
  method: 'post' as const,
  handler: async (req: PayloadRequest) => {
    const blocked = await rejectDisallowedMutationOrigin(req)
    if (blocked) return blocked

    const rateLimited = await rejectRateLimitedEndpoint({
      req,
      scope: 'account-notifications-write',
    })
    if (rateLimited) return rateLimited

    await ensurePayloadRequestUser(req)
    if (!req.user) return unauthorized()

    try {
      const result = await markAllNotificationsRead({
        req,
        userId: req.user.id,
      })

      return Response.json(result)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update notifications.'
      return Response.json({ message }, { status: 400 })
    }
  },
}
