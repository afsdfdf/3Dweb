import type { CollectionConfig } from 'payload'

import { isStaff } from '@/access'
import { forceCurrentUserField } from '@/hooks/forceCurrentUserField'

export const EngagementViews: CollectionConfig = {
  slug: 'engagement-views',
  admin: {
    defaultColumns: ['targetType', 'targetUser', 'targetModel', 'lastViewedAt'],
    group: 'Social',
    useAsTitle: 'viewerKeyHash',
  },
  access: {
    create: isStaff,
    delete: isStaff,
    read: isStaff,
    update: isStaff,
  },
  hooks: {
    beforeChange: [forceCurrentUserField('viewer', { clearWhenAnonymous: true })],
  },
  defaultSort: '-lastViewedAt',
  timestamps: true,
  fields: [
    {
      name: 'targetType',
      type: 'select',
      required: true,
      options: [
        { label: 'Creator profile', value: 'creator-profile' },
        { label: 'Model', value: 'model' },
      ],
    },
    { name: 'targetUser', type: 'relationship', relationTo: 'users', index: true },
    { name: 'targetModel', type: 'relationship', relationTo: 'models', index: true },
    { name: 'viewer', type: 'relationship', relationTo: 'users', index: true },
    { name: 'viewerKeyHash', type: 'text', required: true, index: true },
    { name: 'lastViewedAt', type: 'date', required: true, index: true },
  ],
}
