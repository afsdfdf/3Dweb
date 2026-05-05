import type { Access, CollectionConfig, Where } from 'payload'

import { isStaff } from '@/access'
import { assignCurrentUser } from '@/hooks/assignCurrentUser'
import { fillPublishAtOnPublish } from '@/hooks/fillPublishAtOnPublish'
import { adminLabelsKey, adminTextKey } from '@/lib/adminText'

const visibleReadOrStaff: Access = ({ req }) => {
  if (req.user?.role === 'admin' || req.user?.role === 'operator') {
    return true
  }

  const publicVisibilityConditions: Where[] = [
    {
      isVisible: {
        equals: true,
      },
    },
    {
      _status: {
        equals: 'published',
      },
    },
  ]

  return {
    and: publicVisibilityConditions,
  } satisfies Where
}

export const Announcements: CollectionConfig = {
  slug: 'announcements',
  labels: adminLabelsKey('collections.announcements'),
  admin: {
    defaultColumns: ['title', '_status', 'createdBy', 'publishAt', 'isPinned', 'isVisible', 'updatedAt'],
    description: adminTextKey('collections.announcements.description'),
    group: adminTextKey('groups.content'),
    useAsTitle: 'title',
  },
  access: {
    create: isStaff,
    delete: isStaff,
    read: visibleReadOrStaff,
    update: isStaff,
  },
  hooks: {
    beforeChange: [assignCurrentUser('createdBy'), fillPublishAtOnPublish('publishAt')],
  },
  defaultSort: ['-isPinned', 'sortOrder', '-publishAt'],
  fields: [
    {
      name: 'title',
      type: 'text',
      localized: true,
      required: true,
      label: 'Title',
    },
    {
      name: 'slug',
      type: 'text',
      index: true,
      required: true,
      unique: true,
      label: 'Slug',
    },
    {
      name: 'summary',
      type: 'textarea',
      localized: true,
      label: 'Summary',
    },
    {
      name: 'content',
      type: 'richText',
      localized: true,
      label: 'Content',
      required: true,
    },
    {
      name: 'createdBy',
      type: 'relationship',
      relationTo: 'users',
      label: 'Created by',
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
    },
    {
      name: 'publishAt',
      type: 'date',
      label: 'Publish at',
    },
    {
      name: 'isPinned',
      type: 'checkbox',
      defaultValue: false,
      label: 'Pinned',
    },
    {
      name: 'isVisible',
      type: 'checkbox',
      defaultValue: true,
      label: 'Visible on frontend',
    },
    {
      name: 'sortOrder',
      type: 'number',
      defaultValue: 0,
      label: 'Sort order',
    },
  ],
  timestamps: true,
  versions: {
    drafts: true,
  },
}

