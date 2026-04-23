import type { CollectionConfig } from 'payload'

import { isAdmin } from '@/access'

export const EngagementViews: CollectionConfig = {
  slug: 'engagement-views',
  labels: {
    plural: 'Engagement Views',
    singular: 'Engagement View',
  },
  admin: {
    defaultColumns: ['targetType', 'viewerKeyHash', 'lastViewedAt', 'updatedAt'],
    description: 'Deduplicated lightweight view records for public creator and model pages.',
    group: 'Platform',
    useAsTitle: 'viewerKeyHash',
  },
  access: {
    create: isAdmin,
    delete: isAdmin,
    read: isAdmin,
    update: isAdmin,
  },
  defaultSort: '-updatedAt',
  timestamps: true,
  fields: [
    {
      name: 'targetType',
      type: 'select',
      required: true,
      label: 'Target type',
      options: [
        { label: 'Creator profile', value: 'creator-profile' },
        { label: 'Model', value: 'model' },
      ],
    },
    {
      name: 'targetUser',
      type: 'relationship',
      relationTo: 'users',
      label: 'Target user',
    },
    {
      name: 'targetModel',
      type: 'relationship',
      relationTo: 'models',
      label: 'Target model',
    },
    {
      name: 'viewer',
      type: 'relationship',
      relationTo: 'users',
      label: 'Viewer',
    },
    {
      name: 'viewerKeyHash',
      type: 'text',
      required: true,
      index: true,
      label: 'Viewer key hash',
    },
    {
      name: 'lastViewedAt',
      type: 'date',
      required: true,
      label: 'Last viewed at',
    },
  ],
}
