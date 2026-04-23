import type { CollectionConfig } from 'payload'

import { isAdmin, isLoggedIn, ownerOrStaff } from '@/access'

export const ModelComments: CollectionConfig = {
  slug: 'model-comments',
  labels: {
    plural: 'Model Comments',
    singular: 'Model Comment',
  },
  admin: {
    defaultColumns: ['model', 'author', 'status', 'createdAt'],
    description: 'Store lightweight public comments for public model detail pages.',
    group: 'Content',
    useAsTitle: 'id',
  },
  access: {
    create: isLoggedIn,
    delete: ownerOrStaff('author'),
    read: ownerOrStaff('author'),
    update: isAdmin,
  },
  defaultSort: '-createdAt',
  timestamps: true,
  fields: [
    {
      name: 'model',
      type: 'relationship',
      relationTo: 'models',
      required: true,
      label: 'Model',
    },
    {
      name: 'author',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      label: 'Author',
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'visible',
      required: true,
      label: 'Status',
      options: [
        { label: 'Visible', value: 'visible' },
        { label: 'Hidden', value: 'hidden' },
      ],
    },
    {
      name: 'content',
      type: 'textarea',
      required: true,
      label: 'Content',
    },
  ],
}
