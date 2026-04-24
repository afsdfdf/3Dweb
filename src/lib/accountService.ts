import type { PayloadRequest } from 'payload'

import { getFollowState } from '@/lib/followService'

type AccountProfileUpdateInput = {
  avatar?: number | null
  avatarFrame?: 'ember' | 'emerald' | 'kick' | 'none'
  bio?: string | null
  displayName?: string | null
  fullName?: string | null
  phone?: string | null
  profileBackground?: number | null
  profileVisibility?: 'private' | 'public'
}

type ChangeAccountPasswordInput = {
  confirmNewPassword: string
  currentPassword: string
  newPassword: string
}

type PublicCreatorProfile = {
  avatarFrame: string
  avatarUrl: null | string
  backgroundUrl: null | string
  bio: null | string
  displayName: string
  followersCount: number
  followingCount: number
  id: number
  isFollowing: boolean
  modelCount: number
  profileViewCount: number
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

const accessOptions = (req: PayloadRequest) => {
  return req.user ? { overrideAccess: false as const } : {}
}

const normalizeOptionalText = (value: unknown) => {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

const normalizeProfileVisibility = (value: unknown) => {
  return value === 'public' ? 'public' : 'private'
}

const normalizeAvatarFrame = (value: unknown) => {
  return value === 'ember' || value === 'emerald' || value === 'kick' ? value : 'none'
}

const resolveRelationId = (value: unknown) => {
  if (typeof value === 'number') return value
  if (typeof value === 'string' && value.trim()) return Number(value)
  if (isRecord(value) && value.id !== undefined && value.id !== null) return Number(value.id)
  return null
}

const getMediaUrl = (value: unknown) => {
  if (!isRecord(value)) return null
  const url = typeof value.url === 'string' && value.url ? value.url : null
  const thumbnailURL = typeof value.thumbnailURL === 'string' && value.thumbnailURL ? value.thumbnailURL : null
  return thumbnailURL || url
}

async function assertMediaOwnership(args: {
  mediaId: null | number
  req: PayloadRequest
}) {
  const { mediaId, req } = args

  if (!mediaId || !req.user) {
    return
  }

  const media = await req.payload.findByID({
    collection: 'media',
    depth: 0,
    id: mediaId,
    req,
    ...accessOptions(req),
  })

  const ownerId = resolveRelationId(media.owner)
  if (ownerId !== Number(req.user.id)) {
    throw new Error('You can only use media that belongs to your account.')
  }
}

export async function getAccountProfile(req: PayloadRequest) {
  if (!req.user) {
    throw new Error('Unauthorized')
  }

  const user = await req.payload.findByID({
    collection: 'users',
    depth: 1,
    id: req.user.id,
    req,
    ...accessOptions(req),
  })

  return {
    avatarFrame: normalizeAvatarFrame(user.avatarFrame),
    avatarUrl: getMediaUrl(user.avatar),
    backgroundUrl: getMediaUrl(user.profileBackground),
    bio: normalizeOptionalText(user.bio),
    creditsBalance: Number(user.creditsBalance || 0),
    displayName: normalizeOptionalText(user.displayName),
    email: typeof user.email === 'string' ? user.email : null,
    followersCount: Number(user.followersCount || 0),
    followingCount: Number(user.followingCount || 0),
    fullName: normalizeOptionalText(user.fullName),
    id: Number(user.id),
    lastActiveAt: typeof user.lastActiveAt === 'string' ? user.lastActiveAt : null,
    phone: normalizeOptionalText(user.phone),
    profileBackground: resolveRelationId(user.profileBackground),
    profileViewCount: Number(user.profileViewCount || 0),
    profileVisibility: normalizeProfileVisibility(user.profileVisibility),
    role: typeof user.role === 'string' ? user.role : 'customer',
    subscriptionStatus: null,
  }
}

export async function updateAccountProfile(args: {
  input: AccountProfileUpdateInput
  req: PayloadRequest
}) {
  const { input, req } = args

  if (!req.user) {
    throw new Error('Unauthorized')
  }

  const avatarId = input.avatar === null ? null : resolveRelationId(input.avatar)
  const backgroundId = input.profileBackground === null ? null : resolveRelationId(input.profileBackground)

  await assertMediaOwnership({ mediaId: avatarId, req })
  await assertMediaOwnership({ mediaId: backgroundId, req })

  const updated = await req.payload.update({
    collection: 'users',
    id: req.user.id,
    data: {
      ...(input.avatar !== undefined ? { avatar: avatarId } : {}),
      ...(input.avatarFrame !== undefined ? { avatarFrame: normalizeAvatarFrame(input.avatarFrame) } : {}),
      ...(input.bio !== undefined ? { bio: normalizeOptionalText(input.bio) } : {}),
      ...(input.displayName !== undefined ? { displayName: normalizeOptionalText(input.displayName) } : {}),
      ...(input.fullName !== undefined ? { fullName: normalizeOptionalText(input.fullName) } : {}),
      ...(input.phone !== undefined ? { phone: normalizeOptionalText(input.phone) } : {}),
      ...(input.profileBackground !== undefined ? { profileBackground: backgroundId } : {}),
      ...(input.profileVisibility !== undefined
        ? { profileVisibility: normalizeProfileVisibility(input.profileVisibility) }
        : {}),
    },
    req,
    ...accessOptions(req),
  })

  return {
    avatarFrame: normalizeAvatarFrame(updated.avatarFrame),
    avatarUrl: getMediaUrl(updated.avatar),
    backgroundUrl: getMediaUrl(updated.profileBackground),
    bio: normalizeOptionalText(updated.bio),
    displayName: normalizeOptionalText(updated.displayName),
    fullName: normalizeOptionalText(updated.fullName),
    phone: normalizeOptionalText(updated.phone),
    profileVisibility: normalizeProfileVisibility(updated.profileVisibility),
    userId: Number(updated.id),
  }
}

export async function changeAccountPassword(args: {
  input: ChangeAccountPasswordInput
  req: PayloadRequest
}) {
  const { input, req } = args

  if (!req.user) {
    throw new Error('Unauthorized')
  }

  const currentPassword = String(input.currentPassword || '')
  const newPassword = String(input.newPassword || '')
  const confirmNewPassword = String(input.confirmNewPassword || '')

  if (!currentPassword || !newPassword || !confirmNewPassword) {
    throw new Error('All password fields are required.')
  }

  if (newPassword.length < 8) {
    throw new Error('New password must be at least 8 characters long.')
  }

  if (newPassword !== confirmNewPassword) {
    throw new Error('New password confirmation does not match.')
  }

  if (currentPassword === newPassword) {
    throw new Error('New password must be different from the current password.')
  }

  const user = await req.payload.findByID({
    collection: 'users',
    depth: 0,
    id: req.user.id,
    req,
    ...accessOptions(req),
  })

  if (!user.email) {
    throw new Error('Current account email is missing.')
  }

  await req.payload.login({
    collection: 'users',
    data: {
      email: user.email,
      password: currentPassword,
    },
    overrideAccess: true,
    req,
  })

  await req.payload.update({
    collection: 'users',
    id: req.user.id,
    data: {
      password: newPassword,
    },
    req,
    ...accessOptions(req),
  })

  return {
    changed: true,
    userId: Number(req.user.id),
  }
}

export async function getAccountDashboard(req: PayloadRequest) {
  if (!req.user) {
    throw new Error('Unauthorized')
  }

  const [profile, credits, transactions, tasks, models, orders, subscriptions] = await Promise.all([
    getAccountProfile(req),
    req.payload.find({
      collection: 'credits',
      depth: 0,
      limit: 1,
      pagination: false,
      req,
      sort: '-updatedAt',
      user: req.user,
      ...accessOptions(req),
    }),
    req.payload.find({
      collection: 'credit-transactions',
      depth: 0,
      limit: 10,
      req,
      sort: '-createdAt',
      user: req.user,
      ...accessOptions(req),
    }),
    req.payload.find({
      collection: 'generation-tasks',
      depth: 1,
      limit: 10,
      req,
      sort: '-updatedAt',
      user: req.user,
      ...accessOptions(req),
    }),
    req.payload.find({
      collection: 'models',
      depth: 1,
      limit: 12,
      req,
      sort: '-updatedAt',
      user: req.user,
      ...accessOptions(req),
    }),
    req.payload.find({
      collection: 'print-orders',
      depth: 1,
      limit: 10,
      req,
      sort: '-updatedAt',
      user: req.user,
      ...accessOptions(req),
    }),
    req.payload.find({
      collection: 'billing-subscriptions',
      depth: 0,
      limit: 5,
      req,
      sort: '-updatedAt',
      user: req.user,
      ...accessOptions(req),
    }),
  ])

  return {
    credits: credits.docs[0] || null,
    metrics: {
      modelCount: models.totalDocs,
      orderCount: orders.totalDocs,
      taskCount: tasks.totalDocs,
      transactionCount: transactions.totalDocs,
    },
    orders,
    profile,
    recentModels: models.docs,
    recentTasks: tasks.docs,
    subscription:
      subscriptions.docs.find((item) => ['active', 'trialing', 'past_due', 'incomplete'].includes(String(item.status))) ||
      subscriptions.docs[0] ||
      null,
    transactions: transactions.docs,
  }
}

export async function getPublicCreatorProfile(args: {
  req: PayloadRequest
  userId: number
}) {
  const isFollowing = await getFollowState({
    req: args.req,
    targetUserId: args.userId,
  })

  const user = await args.req.payload.findByID({
    collection: 'users',
    depth: 1,
    id: args.userId,
    overrideAccess: true,
    req: args.req,
  })

  if (normalizeProfileVisibility(user.profileVisibility) !== 'public') {
    throw new Error('Creator profile is not public.')
  }

  const models = await args.req.payload.find({
    collection: 'models',
    depth: 1,
    limit: 12,
    overrideAccess: false,
    pagination: true,
    req: args.req,
    sort: '-updatedAt',
    where: {
      and: [
        {
          owner: {
            equals: args.userId,
          },
        },
        {
          visibility: {
            equals: 'public',
          },
        },
      ],
    },
  })

  const profile: PublicCreatorProfile = {
    avatarFrame: normalizeAvatarFrame(user.avatarFrame),
    avatarUrl: getMediaUrl(user.avatar),
    backgroundUrl: getMediaUrl(user.profileBackground),
    bio: normalizeOptionalText(user.bio),
    displayName:
      normalizeOptionalText(user.displayName) ||
      normalizeOptionalText(user.fullName) ||
      `Creator ${String(user.id)}`,
    followersCount: Number(user.followersCount || 0),
    followingCount: Number(user.followingCount || 0),
    id: Number(user.id),
    isFollowing,
    modelCount: models.totalDocs,
    profileViewCount: Number(user.profileViewCount || 0),
  }

  return {
    models: models.docs,
    profile,
  }
}
