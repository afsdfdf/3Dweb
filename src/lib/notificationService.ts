import type { PayloadRequest } from 'payload'

const INTERNAL_ACCESS = true
const defaultNotificationLimit = 5
const maxNotificationLimit = 20

type NotificationType =
  | 'credits_purchased'
  | 'credits_adjusted'
  | 'generation_completed'
  | 'generation_failed'
  | 'order_paid'
  | 'order_status'
  | 'subscription_credits'
  | 'system_notice'

type NotificationSeverity = 'critical' | 'info' | 'success' | 'warning'

type UserNotification = {
  body: string
  createdAt: string
  href?: null | string
  id: number | string
  readAt?: null | string
  severity: NotificationSeverity
  title: string
  type: NotificationType
  updatedAt?: string
  user?: unknown
}

type CreateUserNotificationArgs = {
  body: string
  href?: null | string
  metadata?: Record<string, unknown>
  req: PayloadRequest
  severity?: NotificationSeverity
  sourceKey?: null | string
  sourceOrderId?: null | number | string
  sourceTaskId?: null | number | string
  title: string
  type: NotificationType
  userId: number | string
}

type CreateUserNotificationResult = {
  applied: boolean
  notification: UserNotification | null
}

const toNumericId = (value: number | string | null | undefined) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

const getRelationId = (value: unknown) => {
  if (typeof value === 'number' || typeof value === 'string') return toNumericId(value)
  if (value && typeof value === 'object' && 'id' in value) return toNumericId((value as { id?: unknown }).id as string | number)
  return null
}

const isUniqueConstraintError = (error: unknown) => {
  if (!error || typeof error !== 'object') return false
  const candidate = error as { code?: string; message?: string }
  const message = String(candidate.message || '').toLowerCase()
  return candidate.code === '23505' || message.includes('unique') || message.includes('duplicate')
}

const clampLimit = (value: unknown) => {
  const parsed = Number(value ?? defaultNotificationLimit)
  if (!Number.isFinite(parsed)) return defaultNotificationLimit
  return Math.min(maxNotificationLimit, Math.max(1, Math.floor(parsed)))
}

async function findNotificationBySourceKey(args: { req: PayloadRequest; sourceKey?: null | string }) {
  const sourceKey = String(args.sourceKey || '').trim()
  if (!sourceKey) return null

  const existing = await args.req.payload.find({
    collection: 'user-notifications',
    depth: 0,
    limit: 1,
    overrideAccess: INTERNAL_ACCESS,
    pagination: false,
    req: args.req,
    where: {
      sourceKey: {
        equals: sourceKey,
      },
    },
  })

  return (existing.docs[0] as UserNotification | undefined) || null
}

export async function createUserNotification(args: CreateUserNotificationArgs): Promise<CreateUserNotificationResult> {
  const userId = toNumericId(args.userId)
  if (!userId) {
    return {
      applied: false,
      notification: null,
    }
  }

  const sourceKey = String(args.sourceKey || '').trim() || undefined
  const existing = await findNotificationBySourceKey({ req: args.req, sourceKey })
  if (existing) {
    return {
      applied: false,
      notification: existing,
    }
  }

  try {
    const notification = (await args.req.payload.create({
      collection: 'user-notifications',
      data: {
        body: args.body,
        href: args.href || undefined,
        metadata: args.metadata,
        severity: args.severity || 'info',
        sourceKey,
        sourceOrder: args.sourceOrderId ? Number(args.sourceOrderId) : undefined,
        sourceTask: args.sourceTaskId ? Number(args.sourceTaskId) : undefined,
        title: args.title,
        type: args.type,
        user: userId,
      },
      overrideAccess: INTERNAL_ACCESS,
      req: args.req,
    })) as UserNotification

    return {
      applied: true,
      notification,
    }
  } catch (error) {
    if (sourceKey && isUniqueConstraintError(error)) {
      const duplicate = await findNotificationBySourceKey({ req: args.req, sourceKey })
      return {
        applied: false,
        notification: duplicate,
      }
    }

    throw error
  }
}

export async function createGenerationTaskNotification(args: {
  eventType: 'completed' | 'failed'
  message?: string
  req: PayloadRequest
  taskId: number | string
  userId: number | string
}) {
  const taskId = toNumericId(args.taskId)
  const userId = toNumericId(args.userId)
  if (!taskId || !userId) return null

  const task = await args.req.payload
    .findByID({
      collection: 'generation-tasks',
      depth: 0,
      id: taskId,
      overrideAccess: INTERNAL_ACCESS,
      req: args.req,
    })
    .catch(() => null)

  const taskCode = typeof task?.taskCode === 'string' && task.taskCode.trim() ? task.taskCode.trim() : ''
  const taskType = task?.taskType === 'image-generation' ? 'Image generation' : '3D generation'
  const succeeded = args.eventType === 'completed'

  return createUserNotification({
    body: succeeded
      ? `${taskCode || 'Your generation task'} is ready to review.`
      : args.message || `${taskCode || 'Your generation task'} could not be completed.`,
    href: taskCode ? `/results/${encodeURIComponent(taskCode)}` : '/account?section=tasks',
    metadata: {
      taskCode: taskCode || null,
      taskType: task?.taskType || null,
    },
    req: args.req,
    severity: succeeded ? 'success' : 'critical',
    sourceKey: `generation-task:${taskId}:${args.eventType}`,
    sourceTaskId: taskId,
    title: succeeded ? `${taskType} completed` : `${taskType} failed`,
    type: succeeded ? 'generation_completed' : 'generation_failed',
    userId,
  })
}

export async function listAccountNotifications(args: {
  limit?: unknown
  req: PayloadRequest
  userId: number | string
}) {
  const userId = toNumericId(args.userId)
  if (!userId) {
    return {
      docs: [],
      unreadCount: 0,
    }
  }

  const [notifications, unread] = await Promise.all([
    args.req.payload.find({
      collection: 'user-notifications',
      depth: 0,
      limit: clampLimit(args.limit),
      overrideAccess: false,
      pagination: false,
      req: args.req,
      sort: '-createdAt',
      user: args.req.user,
      where: {
        user: {
          equals: userId,
        },
      },
    }),
    args.req.payload.count({
      collection: 'user-notifications',
      overrideAccess: false,
      req: args.req,
      user: args.req.user,
      where: {
        and: [
          {
            user: {
              equals: userId,
            },
          },
          {
            readAt: {
              exists: false,
            },
          },
        ],
      },
    }),
  ])

  return {
    docs: notifications.docs as UserNotification[],
    unreadCount: unread.totalDocs,
  }
}

export async function getUnreadNotificationCount(args: { req: PayloadRequest; userId: number | string }) {
  const userId = toNumericId(args.userId)
  if (!userId) return 0

  const unread = await args.req.payload.count({
    collection: 'user-notifications',
    overrideAccess: false,
    req: args.req,
    user: args.req.user,
    where: {
      and: [
        {
          user: {
            equals: userId,
          },
        },
        {
          readAt: {
            exists: false,
          },
        },
      ],
    },
  })

  return unread.totalDocs
}

export async function markNotificationRead(args: {
  notificationId: number | string
  req: PayloadRequest
  userId: number | string
}) {
  const notificationId = toNumericId(args.notificationId)
  const userId = toNumericId(args.userId)
  if (!notificationId || !userId) {
    throw new Error('Notification not found.')
  }

  const notification = (await args.req.payload.findByID({
    collection: 'user-notifications',
    depth: 0,
    id: notificationId,
    overrideAccess: false,
    req: args.req,
    user: args.req.user,
  })) as UserNotification

  if (getRelationId(notification.user) !== userId) {
    throw new Error('Notification not found.')
  }

  if (notification.readAt) return notification

  return args.req.payload.update({
    collection: 'user-notifications',
    data: {
      readAt: new Date().toISOString(),
    },
    id: notificationId,
    overrideAccess: INTERNAL_ACCESS,
    req: args.req,
  }) as Promise<UserNotification>
}

export async function markAllNotificationsRead(args: { req: PayloadRequest; userId: number | string }) {
  const userId = toNumericId(args.userId)
  if (!userId) return { updated: 0 }

  let updated = 0

  while (true) {
    const unread = await args.req.payload.find({
      collection: 'user-notifications',
      depth: 0,
      limit: maxNotificationLimit,
      overrideAccess: false,
      pagination: false,
      req: args.req,
      sort: '-createdAt',
      user: args.req.user,
      where: {
        and: [
          {
            user: {
              equals: userId,
            },
          },
          {
            readAt: {
              exists: false,
            },
          },
        ],
      },
    })

    if (!unread.docs.length) break

    const readAt = new Date().toISOString()
    await Promise.all(
      unread.docs.map((notification) =>
        args.req.payload.update({
          collection: 'user-notifications',
          data: {
            readAt,
          },
          id: notification.id,
          overrideAccess: INTERNAL_ACCESS,
          req: args.req,
        }),
      ),
    )

    updated += unread.docs.length
    if (unread.docs.length < maxNotificationLimit) break
  }

  return {
    updated,
  }
}

export function serializeNotification(notification: UserNotification) {
  return {
    body: notification.body,
    createdAt: notification.createdAt,
    href: notification.href || null,
    id: notification.id,
    readAt: notification.readAt || null,
    severity: notification.severity,
    title: notification.title,
    type: notification.type,
  }
}
