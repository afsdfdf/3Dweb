import type { PayloadRequest } from 'payload'

const INTERNAL_ACCESS = true

const normalizeContent = (value: unknown) => {
  if (typeof value !== 'string') return ''
  return value.trim()
}

async function syncModelCommentCount(args: {
  modelId: number
  req: PayloadRequest
}) {
  const count = await args.req.payload.count({
    collection: 'model-comments',
    overrideAccess: true,
    req: args.req,
    where: {
      and: [
        {
          model: {
            equals: args.modelId,
          },
        },
        {
          status: {
            equals: 'visible',
          },
        },
      ],
    },
  })

  await args.req.payload.update({
    collection: 'models',
    data: {
      commentsCount: count.totalDocs,
    },
    id: args.modelId,
    overrideAccess: true,
    req: args.req,
  })
}

const resolveModelId = (value: unknown) => {
  if (typeof value === 'number') return value
  if (typeof value === 'string' && value.trim()) return Number(value)
  if (value && typeof value === 'object' && 'id' in value) {
    const candidate = (value as { id?: number | string | null }).id
    return candidate !== undefined && candidate !== null ? Number(candidate) : 0
  }
  return 0
}

async function assertPublicModel(args: {
  modelId: number
  req: PayloadRequest
}) {
  const model = await args.req.payload.findByID({
    collection: 'models',
    depth: 1,
    id: args.modelId,
    overrideAccess: true,
    req: args.req,
  })

  if (model.visibility !== 'public') {
    throw new Error('Comments are available only for public models.')
  }

  return model
}

export async function listModelComments(args: {
  limit?: number
  modelId: number
  page?: number
  req: PayloadRequest
}) {
  await assertPublicModel({
    modelId: args.modelId,
    req: args.req,
  })

  return args.req.payload.find({
    collection: 'model-comments',
    depth: 1,
    limit: Math.min(50, Math.max(1, Number(args.limit || 20))),
    overrideAccess: true,
    page: Math.max(1, Number(args.page || 1)),
    req: args.req,
    sort: '-createdAt',
    where: {
      and: [
        {
          model: {
            equals: args.modelId,
          },
        },
        {
          status: {
            equals: 'visible',
          },
        },
      ],
    },
  })
}

export async function createModelComment(args: {
  content: string
  modelId: number
  req: PayloadRequest
}) {
  if (!args.req.user) {
    throw new Error('Unauthorized')
  }

  const content = normalizeContent(args.content)
  if (content.length < 1 || content.length > 500) {
    throw new Error('Comment content must be between 1 and 500 characters.')
  }

  await assertPublicModel({
    modelId: args.modelId,
    req: args.req,
  })

  const comment = await args.req.payload.create({
    collection: 'model-comments',
    data: {
      author: args.req.user.id,
      content,
      model: args.modelId,
      status: 'visible',
    },
    overrideAccess: INTERNAL_ACCESS,
    req: args.req,
  })

  await syncModelCommentCount({
    modelId: args.modelId,
    req: args.req,
  })

  return comment
}

export async function deleteModelComment(args: {
  commentId: number
  modelId?: number
  req: PayloadRequest
}) {
  if (!args.req.user) {
    throw new Error('Unauthorized')
  }

  const comment = await args.req.payload.findByID({
    collection: 'model-comments',
    depth: 0,
    id: args.commentId,
    overrideAccess: true,
    req: args.req,
  })

  const authorId = typeof comment.author === 'object' && comment.author ? Number(comment.author.id) : Number(comment.author)
  const isStaff = ['admin', 'operator'].includes(String(args.req.user.role || 'customer'))
  if (!isStaff && Number(args.req.user.id) !== authorId) {
    throw new Error('You can delete only your own comments.')
  }

  const modelId = typeof comment.model === 'object' && comment.model ? Number(comment.model.id) : Number(comment.model)
  if (args.modelId && modelId !== args.modelId) {
    throw new Error('Comment does not belong to the requested model.')
  }

  await args.req.payload.delete({
    collection: 'model-comments',
    id: args.commentId,
    overrideAccess: true,
    req: args.req,
  })

  if (modelId) {
    await syncModelCommentCount({
      modelId,
      req: args.req,
    })
  }

  return {
    commentId: args.commentId,
    deleted: true,
  }
}

export async function moderateModelComment(args: {
  commentId: number
  modelId?: number
  req: PayloadRequest
  status: 'hidden' | 'visible'
}) {
  if (!args.req.user) {
    throw new Error('Unauthorized')
  }

  const isStaff = ['admin', 'operator'].includes(String(args.req.user.role || 'customer'))
  if (!isStaff) {
    throw new Error('Only staff can moderate comments.')
  }

  const comment = await args.req.payload.findByID({
    collection: 'model-comments',
    depth: 0,
    id: args.commentId,
    overrideAccess: true,
    req: args.req,
  })

  const modelId = resolveModelId(comment.model)
  if (args.modelId && modelId !== args.modelId) {
    throw new Error('Comment does not belong to the requested model.')
  }
  const updated = await args.req.payload.update({
    collection: 'model-comments',
    data: {
      status: args.status,
    },
    id: args.commentId,
    overrideAccess: true,
    req: args.req,
  })

  if (modelId) {
    await syncModelCommentCount({
      modelId,
      req: args.req,
    })
  }

  return updated
}
