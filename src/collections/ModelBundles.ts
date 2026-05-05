import type { Access, CollectionConfig, Where } from 'payload'

import { isStaff } from '@/access'
import { assignCurrentUser } from '@/hooks/assignCurrentUser'
import { fillPublishAtOnPublish } from '@/hooks/fillPublishAtOnPublish'
import { adminLabelsKey, adminTextKey } from '@/lib/adminText'

const publicBundleReadOrStaff: Access = ({ req }) => {
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

export const ModelBundles: CollectionConfig = {
  slug: 'model-bundles',
  labels: adminLabelsKey('collections.modelBundles'),
  admin: {
    defaultColumns: ['title', '_status', 'createdBy', 'isVisible', 'isFeatured', 'sortOrder', 'updatedAt'],
    description: adminTextKey('collections.modelBundles.description'),
    group: adminTextKey('groups.content'),
    useAsTitle: 'title',
  },
  access: {
    create: isStaff,
    delete: isStaff,
    read: publicBundleReadOrStaff,
    update: isStaff,
  },
  hooks: {
    beforeChange: [assignCurrentUser('createdBy'), fillPublishAtOnPublish('publishAt')],
  },
  defaultSort: ['-isFeatured', 'sortOrder', '-updatedAt'],
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
      name: 'coverImage',
      type: 'upload',
      relationTo: 'media',
      label: 'Cover image',
    },
    {
      name: 'summary',
      type: 'textarea',
      localized: true,
      label: 'Summary',
    },
    {
      name: 'tags',
      type: 'array',
      label: 'Tags',
      fields: [
        {
          name: 'label',
          type: 'text',
          localized: true,
          label: 'Tag label',
          required: true,
        },
      ],
    },
    {
      name: 'models',
      type: 'relationship',
      relationTo: 'models',
      hasMany: true,
      label: 'Included models',
      required: true,
      admin: {
        description: 'Select one or more existing generated models to build a curated bundle.',
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
    },
    {
      name: 'isVisible',
      type: 'checkbox',
      defaultValue: true,
      label: 'Visible publicly',
    },
    {
      name: 'isFeatured',
      type: 'checkbox',
      defaultValue: false,
      label: 'Featured on homepage',
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

