import type { Access, CollectionConfig, Where } from 'payload'

import { isStaff } from '@/access'
import { adminLabelsKey, adminTextKey } from '@/lib/adminText'

const activeReadOrStaff: Access = ({ req }) => {
  if (req.user?.role === 'admin' || req.user?.role === 'operator') {
    return true
  }

  const conditions: Where[] = [
    {
      isActive: {
        equals: true,
      },
    },
    {
      isUserSelectable: {
        equals: true,
      },
    },
  ]

  return {
    and: conditions,
  } satisfies Where
}

export const AvatarFrameStyles: CollectionConfig = {
  slug: 'avatar-frame-styles',
  labels: adminLabelsKey('collections.avatarFrameStyles'),
  admin: {
    defaultColumns: ['key', 'title', 'unlockRule', 'isActive', 'isUserSelectable', 'sortOrder', 'updatedAt'],
    description: adminTextKey('collections.avatarFrameStyles.description'),
    group: adminTextKey('groups.platform'),
    useAsTitle: 'title',
  },
  access: {
    create: isStaff,
    delete: isStaff,
    read: activeReadOrStaff,
    update: isStaff,
  },
  defaultSort: ['sortOrder', 'key'],
  fields: [
    {
      name: 'key',
      type: 'text',
      admin: {
        description: 'Stable frontend key. Keep it lowercase and do not reuse retired keys.',
      },
      index: true,
      label: 'Key',
      required: true,
      unique: true,
    },
    {
      name: 'title',
      type: 'text',
      label: 'Title',
      localized: true,
      required: true,
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Description',
      localized: true,
    },
    {
      name: 'thumbnail',
      type: 'upload',
      label: 'Thumbnail',
      relationTo: 'media',
    },
    {
      name: 'frameImage',
      type: 'upload',
      label: 'Frame image',
      relationTo: 'media',
    },
    {
      name: 'unlockRule',
      type: 'select',
      defaultValue: 'free',
      label: 'Unlock rule',
      options: [
        { label: 'Free', value: 'free' },
        { label: 'Subscription', value: 'subscription' },
        { label: 'Event', value: 'event' },
        { label: 'Achievement', value: 'achievement' },
      ],
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      label: 'Active',
    },
    {
      name: 'isUserSelectable',
      type: 'checkbox',
      defaultValue: true,
      label: 'User selectable',
    },
    {
      name: 'sortOrder',
      type: 'number',
      defaultValue: 0,
      label: 'Sort order',
    },
  ],
  timestamps: true,
}
