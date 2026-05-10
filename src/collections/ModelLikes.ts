import type { Access, CollectionConfig, Where } from 'payload'

import { isStaff } from '@/access'
import { forceCurrentUserField } from '@/hooks/forceCurrentUserField'

type UserWithRole = {
  id?: number | string | null
}

const ownerOrStaff: Access = ({ req }) => {
  const user = req.user as UserWithRole | null
  if (!user) return false
  if (isStaff({ req })) return true

  return {
    user: {
      equals: user.id,
    },
  } satisfies Where
}

export const ModelLikes: CollectionConfig = {
  slug: 'model-likes',
  admin: {
    defaultColumns: ['user', 'model', 'createdAt'],
    group: 'Social',
    useAsTitle: 'id',
  },
  access: {
    create: isStaff,
    delete: isStaff,
    read: ownerOrStaff,
    update: isStaff,
  },
  hooks: {
    beforeChange: [forceCurrentUserField('user')],
  },
  defaultSort: '-createdAt',
  timestamps: true,
  fields: [
    { name: 'user', type: 'relationship', relationTo: 'users', required: true, index: true },
    { name: 'model', type: 'relationship', relationTo: 'models', required: true, index: true },
  ],
}
