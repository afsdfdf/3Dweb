import type { CollectionConfig } from 'payload'

import { isAdmin, isLoggedIn, ownerOrStaff } from '@/access'

export const ModelFavorites: CollectionConfig = {
  slug: 'model-favorites',
  labels: {
    plural: 'Model Favorites',
    singular: 'Model Favorite',
  },
  admin: {
    defaultColumns: ['user', 'model', 'createdAt'],
    description: 'Track per-user saved models for later access.',
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
