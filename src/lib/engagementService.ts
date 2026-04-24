import { createHash } from 'node:crypto'

import type { PayloadRequest } from 'payload'

import { getRequestIP } from '@/lib/requestSecurity'

type EngagementTargetType = 'creator-profile' | 'model'

const VIEW_DEDUPE_WINDOW_MS = 30 * 60 * 1000

const hashViewerKey = (value: string) => createHash('sha256').update(value).digest('hex')

async function assertPublicTarget(args: {
  req: PayloadRequest
  targetId: number
  targetType: EngagementTargetType
}) {
  if (args.targetType === 'creator-profile') {
    const user = await args.req.payload.findByID({
      collection: 'users',
      depth: 0,
      id: args.targetId,
      overrideAccess: true,
      req: args.req,
    })

    if (user.profileVisibility !== 'public') {
      throw new Error('Creator profile is not public.')
    }

    return {
      targetModel: null,
      targetUser: args.targetId,
    }
  }

  const model = await args.req.payload.findByID({
    collection: 'models',
    depth: 0,
    id: args.targetId,
    overrideAccess: true,
    req: args.req,
  })

  if (model.visibility !== 'public') {
    throw new Error('Model is not public.')
  }

  return {
    targetModel: args.targetId,
    targetUser: null,
  }
}

const buildViewerKeyHash = (req: PayloadRequest) => {
  if (req.user?.id !== undefined && req.user?.id !== null) {
    return hashViewerKey(`user:${String(req.user.id)}`)
  }

  const ip = getRequestIP(req.headers)
  const userAgent = req.headers.get('user-agent') || 'unknown'
  return hashViewerKey(`guest:${ip}:${userAgent}`)
}

async function incrementTargetViewCount(args: {
  req: PayloadRequest
  targetId: number
  targetType: EngagementTargetType
}) {
  if (args.targetType === 'creator-profile') {
    const user = await args.req.payload.findByID({
      collection: 'users',
      depth: 0,
      id: args.targetId,
      overrideAccess: true,
      req: args.req,
    })

    await args.req.payload.update({
      collection: 'users',
      data: {
        profileViewCount: Number(user.profileViewCount || 0) + 1,
      },
      id: args.targetId,
      overrideAccess: true,
      req: args.req,
    })

    return
  }

  const model = await args.req.payload.findByID({
    collection: 'models',
    depth: 0,
    id: args.targetId,
    overrideAccess: true,
    req: args.req,
  })

  await args.req.payload.update({
    collection: 'models',
    data: {
      viewCount: Number(model.viewCount || 0) + 1,
    },
    id: args.targetId,
    overrideAccess: true,
    req: args.req,
  })
}

export async function recordEngagementView(args: {
  req: PayloadRequest
  targetId: number
  targetType: EngagementTargetType
}) {
  const { req, targetId, targetType } = args
  const targets = await assertPublicTarget({
    req,
    targetId,
    targetType,
  })
  const viewerKeyHash = buildViewerKeyHash(req)
  const now = new Date()

  const existing = await req.payload.find({
    collection: 'engagement-views',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    req,
    where: {
      and: [
        {
          targetType: {
            equals: targetType,
          },
        },
        ...(targets.targetUser
          ? [
              {
                targetUser: {
                  equals: targets.targetUser,
                },
              },
            ]
          : []),
        ...(targets.targetModel
          ? [
              {
                targetModel: {
                  equals: targets.targetModel,
                },
              },
            ]
          : []),
        {
          viewerKeyHash: {
            equals: viewerKeyHash,
          },
        },
      ],
    },
  })

  const row = existing.docs[0]
  const lastViewedAtMs = row?.lastViewedAt ? new Date(String(row.lastViewedAt)).getTime() : 0
  const shouldIncrement = !row || !Number.isFinite(lastViewedAtMs) || now.getTime() - lastViewedAtMs >= VIEW_DEDUPE_WINDOW_MS

  if (!row) {
    await req.payload.create({
      collection: 'engagement-views',
      data: {
        lastViewedAt: now.toISOString(),
        targetModel: targets.targetModel,
        targetType,
        targetUser: targets.targetUser,
        viewer: req.user?.id,
        viewerKeyHash,
      },
      overrideAccess: true,
      req,
    })
  } else {
    await req.payload.update({
      collection: 'engagement-views',
      data: {
        lastViewedAt: now.toISOString(),
        viewer: req.user?.id || null,
      },
      id: row.id,
      overrideAccess: true,
      req,
    })
  }

  if (shouldIncrement) {
    await incrementTargetViewCount({
      req,
      targetId,
      targetType,
    })
  }

  return {
    counted: shouldIncrement,
    targetId,
    targetType,
  }
}
