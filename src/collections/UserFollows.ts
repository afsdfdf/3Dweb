import type { CollectionConfig } from 'payload'

import { isAdmin, isLoggedIn, ownerOrStaff } from '@/access'

export const UserFollows: CollectionConfig = {
  slug: 'user-follows',
  labels: {
    plural: 'User Follows',
    singular: 'User Follow',
  },
  admin: {
    defaultColumns: ['follower', 'followee', 'createdAt'],
    description: 'Track creator follow relationships between users.',
    group: 'Platform',
    useAsTitle: 'id',
  },
  access: {
    create: isLoggedIn,
    delete: ownerOrStaff('follower'),
    read: ownerOrStaff('follower'),
    update: isAdmin,
  },
  defaultSort: '-createdAt',
  timestamps: true,
  fields: [
    {
      name: 'follower',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      label: 'Follower',
    },
    {
      name: 'followee',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      label: 'Followee',
    },
  ],
}
