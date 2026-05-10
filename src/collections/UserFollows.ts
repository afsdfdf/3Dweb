import type { Access, CollectionConfig, Where } from 'payload'

import { isLoggedIn, isStaff } from '@/access'
import { forceCurrentUserField } from '@/hooks/forceCurrentUserField'

type UserWithRole = {
  id?: number | string | null
  role?: string | null
}

const ownFollowOrStaff: Access = ({ req }) => {
  const user = req.user as UserWithRole | null
  if (!user) return false
  if (isStaff({ req })) return true
  if (user.id === undefined || user.id === null) return false

  const followerWhere: Where = {
    follower: {
      equals: user.id,
    },
  }
  const followeeWhere: Where = {
    followee: {
      equals: user.id,
    },
  }

  return {
    or: [
      followerWhere,
      followeeWhere,
    ],
  } satisfies Where
}

export const UserFollows: CollectionConfig = {
  slug: 'user-follows',
  admin: {
    defaultColumns: ['follower', 'followee', 'createdAt'],
    group: 'Social',
    useAsTitle: 'id',
  },
  access: {
    create: isLoggedIn,
    delete: ownFollowOrStaff,
    read: ownFollowOrStaff,
    update: isStaff,
  },
  hooks: {
    beforeChange: [forceCurrentUserField('follower')],
  },
  defaultSort: '-createdAt',
  timestamps: true,
  fields: [
    { name: 'follower', type: 'relationship', relationTo: 'users', required: true, index: true },
    { name: 'followee', type: 'relationship', relationTo: 'users', required: true, index: true },
  ],
}
