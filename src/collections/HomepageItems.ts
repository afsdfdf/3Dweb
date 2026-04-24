import type { Access, CollectionConfig, Where } from 'payload'

import { isStaff } from '@/access'
import { assignCurrentUser } from '@/hooks/assignCurrentUser'
import { validateHomepageItem } from '@/hooks/validateHomepageItem'
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

export const HomepageItems: CollectionConfig = {
  slug: 'homepage-items',
  labels: adminLabelsKey('collections.homepageItems'),
  admin: {
    defaultColumns: [
      'title',
      'placement',
      'contentType',
      'railVariant',
      'linkedModel',
      'linkedPost',
      'linkedBundle',
      'linkedAnnouncement',
      'createdBy',
      'isVisible',
      'isPinned',
      'sortOrder',
      'updatedAt',
    ],
    description: adminTextKey('collections.homepageItems.description'),
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
    beforeChange: [assignCurrentUser('createdBy'), validateHomepageItem],
  },
  defaultSort: ['placement', '-isPinned', 'sortOrder', '-publishAt'],
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
      admin: {
        description: 'Stable unique key for homepage item lookup and future sync flows.',
      },
    },
    {
      name: 'placement',
      type: 'select',
      required: true,
      defaultValue: 'featured',
      label: 'Placement',
      options: [
        { label: 'Hero secondary', value: 'hero-secondary' },
        { label: 'Featured rail', value: 'featured-rail' },
        { label: 'Featured content', value: 'featured' },
        { label: 'Collection shelf', value: 'collection-shelf' },
        { label: 'Bundles', value: 'bundles' },
        { label: 'Announcements', value: 'announcements' },
        { label: 'Articles', value: 'articles' },
      ],
    },
    {
      name: 'contentType',
      type: 'select',
      required: true,
      defaultValue: 'custom',
      label: 'Content type',
      options: [
        { label: 'Custom card', value: 'custom' },
        { label: 'Model', value: 'model' },
        { label: 'Post / event', value: 'post' },
        { label: 'Announcement', value: 'announcement' },
        { label: 'Bundle', value: 'bundle' },
      ],
    },
    {
      name: 'summary',
      type: 'textarea',
      localized: true,
      label: 'Summary',
    },
    {
      name: 'railVariant',
      type: 'select',
      defaultValue: 'standard',
      label: 'Rail card variant',
      options: [
        { label: 'Standard', value: 'standard' },
        { label: 'Wide', value: 'wide' },
      ],
      admin: {
        condition: (_, siblingData) => siblingData?.placement === 'featured-rail',
      },
    },
    {
      name: 'itemCountLabel',
      type: 'text',
      localized: true,
      label: 'Item count label',
      admin: {
        condition: (_, siblingData) => siblingData?.placement === 'collection-shelf',
        description: 'Example: Products x5. Used for collection shelf cards.',
      },
    },
    {
      name: 'coverImage',
      type: 'upload',
      relationTo: 'media',
      label: 'Cover image',
    },
    {
      name: 'linkedModel',
      type: 'relationship',
      relationTo: 'models',
      label: 'Linked model',
      admin: {
        condition: (_, siblingData) => siblingData?.contentType === 'model',
      },
    },
    {
      name: 'linkedPost',
      type: 'relationship',
      relationTo: 'posts',
      label: 'Linked post',
      admin: {
        condition: (_, siblingData) => siblingData?.contentType === 'post',
      },
    },
    {
      name: 'linkedAnnouncement',
      type: 'relationship',
      relationTo: 'announcements',
      label: 'Linked announcement',
      admin: {
        condition: (_, siblingData) => siblingData?.contentType === 'announcement',
      },
    },
    {
      name: 'linkedBundle',
      type: 'relationship',
      relationTo: 'model-bundles',
      label: 'Linked bundle',
      admin: {
        condition: (_, siblingData) => siblingData?.contentType === 'bundle',
      },
    },
    {
      name: 'customHref',
      type: 'text',
      label: 'Custom link',
      admin: {
        condition: (_, siblingData) => siblingData?.contentType === 'custom',
        description: 'Used when content type is custom. Supports internal or external destinations.',
      },
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
      admin: {
        position: 'sidebar',
      },
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
