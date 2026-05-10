import type { PayloadRequest } from 'payload'

const INTERNAL_ACCESS = true

async function assertPublicModel(args: {
  modelId: number
  req: PayloadRequest
}) {
  const model = await args.req.payload.findByID({
    collection: 'models',
    depth: 0,
    id: args.modelId,
    overrideAccess: true,
    req: args.req,
  })

  if (model.visibility !== 'public') {
    throw new Error('Reactions are available only for public models.')
  }

  return model
}

async function syncModelReactionCounts(args: {
  modelId: number
  req: PayloadRequest
}) {
  const [likesCount, favoritesCount] = await Promise.all([
    args.req.payload.count({
      collection: 'model-likes',
      overrideAccess: true,
      req: args.req,
      where: {
        model: {
          equals: args.modelId,
        },
      },
    }),
    args.req.payload.count({
      collection: 'model-favorites',
      overrideAccess: true,
      req: args.req,
      where: {
        model: {
          equals: args.modelId,
        },
      },
    }),
  ])

  await args.req.payload.update({
    collection: 'models',
    data: {
      favoritesCount: favoritesCount.totalDocs,
      likesCount: likesCount.totalDocs,
    },
    id: args.modelId,
    overrideAccess: true,
    req: args.req,
  })

  return {
    favoritesCount: favoritesCount.totalDocs,
    likesCount: likesCount.totalDocs,
  }
}

async function getExistingReaction(args: {
  collection: 'model-favorites' | 'model-likes'
  modelId: number
  req: PayloadRequest
}) {
  if (!args.req.user) {
    return null
  }

  const existing = await args.req.payload.find({
    collection: args.collection,
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    req: args.req,
    where: {
      and: [
        {
          model: {
            equals: args.modelId,
          },
        },
        {
          user: {
            equals: args.req.user.id,
          },
        },
      ],
    },
  })

  return existing.docs[0] || null
}

async function createReaction(args: {
  collection: 'model-favorites' | 'model-likes'
  modelId: number
  req: PayloadRequest
}) {
  if (!args.req.user) {
    throw new Error('Unauthorized')
  }

  await assertPublicModel({
    modelId: args.modelId,
    req: args.req,
  })

  const existing = await getExistingReaction(args)
  if (!existing) {
    await args.req.payload.create({
      collection: args.collection,
      data: {
        model: args.modelId,
        user: args.req.user.id,
      },
      overrideAccess: INTERNAL_ACCESS,
      req: args.req,
    })
  }

  return syncModelReactionCounts({
    modelId: args.modelId,
    req: args.req,
  })
}

async function deleteReaction(args: {
  collection: 'model-favorites' | 'model-likes'
  modelId: number
  req: PayloadRequest
}) {
  if (!args.req.user) {
    throw new Error('Unauthorized')
  }

  const existing = await getExistingReaction(args)
  if (existing) {
    await args.req.payload.delete({
      collection: args.collection,
      id: existing.id,
      overrideAccess: true,
      req: args.req,
    })
  }

  return syncModelReactionCounts({
    modelId: args.modelId,
    req: args.req,
  })
}

export async function likeModel(args: { modelId: number; req: PayloadRequest }) {
  const counts = await createReaction({
    collection: 'model-likes',
    modelId: args.modelId,
    req: args.req,
  })

  return {
    isLiked: true,
    ...counts,
  }
}

export async function unlikeModel(args: { modelId: number; req: PayloadRequest }) {
  const counts = await deleteReaction({
    collection: 'model-likes',
    modelId: args.modelId,
    req: args.req,
  })

  return {
    isLiked: false,
    ...counts,
  }
}

export async function favoriteModel(args: { modelId: number; req: PayloadRequest }) {
  const counts = await createReaction({
    collection: 'model-favorites',
    modelId: args.modelId,
    req: args.req,
  })

  return {
    isFavorited: true,
    ...counts,
  }
}

export async function unfavoriteModel(args: { modelId: number; req: PayloadRequest }) {
  const counts = await deleteReaction({
    collection: 'model-favorites',
    modelId: args.modelId,
    req: args.req,
  })

  return {
    isFavorited: false,
    ...counts,
  }
}

export async function getModelReactionState(args: {
  modelId: number
  req: PayloadRequest
}) {
  const model = await assertPublicModel({
    modelId: args.modelId,
    req: args.req,
  })

  const [liked, favorited] = await Promise.all([
    getExistingReaction({
      collection: 'model-likes',
      modelId: args.modelId,
      req: args.req,
    }),
    getExistingReaction({
      collection: 'model-favorites',
      modelId: args.modelId,
      req: args.req,
    }),
  ])

  return {
    favoritesCount: Number(model.favoritesCount || 0),
    isFavorited: Boolean(favorited),
    isLiked: Boolean(liked),
    likesCount: Number(model.likesCount || 0),
    modelId: args.modelId,
  }
}

export async function listCurrentUserFavoriteModels(req: PayloadRequest) {
  if (!req.user) {
    throw new Error('Unauthorized')
  }

  return req.payload.find({
    collection: 'model-favorites',
    depth: 1,
    limit: 50,
    overrideAccess: false,
    req,
    sort: '-createdAt',
    user: req.user,
  })
}
