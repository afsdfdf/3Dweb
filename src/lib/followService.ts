import type { PayloadRequest } from 'payload'

const INTERNAL_ACCESS = true

async function syncUserFollowCounts(args: {
  req: PayloadRequest
  userId: number
}) {
  const { req, userId } = args

  const [followersCount, followingCount] = await Promise.all([
    req.payload.count({
      collection: 'user-follows',
      overrideAccess: true,
      req,
      where: {
        followee: {
          equals: userId,
        },
      },
    }),
    req.payload.count({
      collection: 'user-follows',
      overrideAccess: true,
      req,
      where: {
        follower: {
          equals: userId,
        },
      },
    }),
  ])

  await req.payload.update({
    collection: 'users',
    data: {
      followersCount: followersCount.totalDocs,
      followingCount: followingCount.totalDocs,
    },
    id: userId,
    overrideAccess: true,
    req,
  })
}

export async function getFollowState(args: {
  req: PayloadRequest
  targetUserId: number
}) {
  if (!args.req.user) {
    return false
  }

  const existing = await args.req.payload.find({
    collection: 'user-follows',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    req: args.req,
    where: {
      and: [
        {
          follower: {
            equals: args.req.user.id,
          },
        },
        {
          followee: {
            equals: args.targetUserId,
          },
        },
      ],
    },
  })

  return Boolean(existing.docs[0])
}

async function assertFollowTargetIsPublic(args: {
  req: PayloadRequest
  targetUserId: number
}) {
  const user = await args.req.payload.findByID({
    collection: 'users',
    depth: 0,
    id: args.targetUserId,
    overrideAccess: true,
    req: args.req,
  })

  if (user.profileVisibility !== 'public') {
    throw new Error('Only public creator profiles can be followed.')
  }
}

export async function followCreator(args: {
  req: PayloadRequest
  targetUserId: number
}) {
  const { req, targetUserId } = args

  if (!req.user) {
    throw new Error('Unauthorized')
  }

  const followerId = Number(req.user.id)
  if (followerId === targetUserId) {
    throw new Error('You cannot follow your own account.')
  }

  await assertFollowTargetIsPublic({ req, targetUserId })

  const existing = await req.payload.find({
    collection: 'user-follows',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    req,
    where: {
      and: [
        {
          follower: {
            equals: followerId,
          },
        },
        {
          followee: {
            equals: targetUserId,
          },
        },
      ],
    },
  })

  if (!existing.docs[0]) {
    try {
      await req.payload.create({
        collection: 'user-follows',
        data: {
          followee: targetUserId,
          follower: followerId,
        },
        overrideAccess: INTERNAL_ACCESS,
        req,
      })
    } catch (error) {
      // A concurrent identical follow may insert between the check and create.
      // Re-check rather than surfacing the race as an error; counts are
      // recomputed from actual rows below so the result stays correct.
      const raced = await req.payload.find({
        collection: 'user-follows',
        depth: 0,
        limit: 1,
        overrideAccess: true,
        pagination: false,
        req,
        where: {
          and: [{ follower: { equals: followerId } }, { followee: { equals: targetUserId } }],
        },
      })
      if (!raced.docs[0]) {
        throw error
      }
    }
  }

  await Promise.all([
    syncUserFollowCounts({ req, userId: followerId }),
    syncUserFollowCounts({ req, userId: targetUserId }),
  ])

  return {
    isFollowing: true,
    targetUserId,
  }
}

export async function unfollowCreator(args: {
  req: PayloadRequest
  targetUserId: number
}) {
  const { req, targetUserId } = args

  if (!req.user) {
    throw new Error('Unauthorized')
  }

  const followerId = Number(req.user.id)
  const existing = await req.payload.find({
    collection: 'user-follows',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    req,
    where: {
      and: [
        {
          follower: {
            equals: followerId,
          },
        },
        {
          followee: {
            equals: targetUserId,
          },
        },
      ],
    },
  })

  const relation = existing.docs[0]
  if (relation) {
    await req.payload.delete({
      collection: 'user-follows',
      id: relation.id,
      overrideAccess: true,
      req,
    })
  }

  await Promise.all([
    syncUserFollowCounts({ req, userId: followerId }),
    syncUserFollowCounts({ req, userId: targetUserId }),
  ])

  return {
    isFollowing: false,
    targetUserId,
  }
}

export async function listCurrentUserFollows(req: PayloadRequest) {
  if (!req.user) {
    throw new Error('Unauthorized')
  }

  return req.payload.find({
    collection: 'user-follows',
    depth: 1,
    limit: 50,
    overrideAccess: false,
    req,
    sort: '-createdAt',
    user: req.user,
  })
}
