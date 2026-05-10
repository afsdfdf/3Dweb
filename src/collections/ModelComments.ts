import type { Access, CollectionConfig, Where } from 'payload'

import { isLoggedIn, isStaff } from '@/access'
import { forceCurrentUserField } from '@/hooks/forceCurrentUserField'

type UserWithRole = {
  id?: number | string | null
}

const visibleOrOwnerOrStaff: Access = ({ req }) => {
  const user = req.user as UserWithRole | null
  if (isStaff({ req })) return true

  const visible: Where = {
    status: {
      equals: 'visible',
    },
  }

  if (!user) return visible

  return {
    or: [
      visible,
      {
        author: {
          equals: user.id,
        },
      },
    ],
  } satisfies Where
}

const authorOrStaff: Access = ({ req }) => {
  const user = req.user as UserWithRole | null
  if (!user) return false
  if (isStaff({ req })) return true

  return {
    author: {
      equals: user.id,
    },
  } satisfies Where
}

export const ModelComments: CollectionConfig = {
  slug: 'model-comments',
  admin: {
    defaultColumns: ['model', 'author', 'status', 'createdAt'],
    group: 'Social',
    useAsTitle: 'content',
  },
  access: {
    create: isLoggedIn,
    delete: authorOrStaff,
    read: visibleOrOwnerOrStaff,
    update: isStaff,
  },
  hooks: {
    beforeChange: [forceCurrentUserField('author')],
  },
  defaultSort: '-createdAt',
  timestamps: true,
  fields: [
    { name: 'model', type: 'relationship', relationTo: 'models', required: true, index: true },
    { name: 'author', type: 'relationship', relationTo: 'users', required: true, index: true },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'visible',
      required: true,
      options: [
        { label: 'Visible', value: 'visible' },
        { label: 'Hidden', value: 'hidden' },
      ],
    },
    { name: 'content', type: 'text', required: true },
  ],
}
