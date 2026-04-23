import type { CollectionConfig } from 'payload'

import { isAdmin, isLoggedIn, ownerOrStaff } from '@/access'

export const ModelLikes: CollectionConfig = {
  slug: 'model-likes',
  labels: {
    plural: 'Model Likes',
    singular: 'Model Like',
  },
  admin: {
    defaultColumns: ['user', 'model', 'createdAt'],
    description: 'Track per-user likes on public models.',
    group: 'Content',
    useAsTitle: 'id',
  },
  access: {
    create: isLoggedIn,
    delete: ownerOrStaff('user'),
    read: ownerOrStaff('user'),
    update: isAdmin,
  },
  defaultSort: '-createdAt',
  timestamps: true,
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      label: 'User',
    },
    {
      name: 'model',
      type: 'relationship',
      relationTo: 'models',
      required: true,
      label: 'Model',
    },
  ],
}
