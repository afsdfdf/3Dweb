import type { Access, CollectionConfig } from 'payload'

import { isStaff } from '@/access'
import { assignCurrentUser } from '@/hooks/assignCurrentUser'
import { fillPublishAtOnPublish } from '@/hooks/fillPublishAtOnPublish'
import { normalizePostSlugBeforeValidate, validatePostSlug } from '@/hooks/normalizePostSlug'
import { revalidateBlogPostCacheAfterChange, revalidateBlogPostCacheAfterDelete } from '@/hooks/revalidateBlogPostCache'
import { validatePostCoverImage } from '@/hooks/validatePostCoverImage'
import { adminLabelsKey, adminTextKey } from '@/lib/adminText'

const publicReadOrStaff: Access = ({ req }) => {
  if (req.user?.role === 'admin' || req.user?.role === 'operator') {
    return true
  }

  return {
    and: [
      {
        _status: {
          equals: 'published',
        },
      },
      {
        isVisible: {
          equals: true,
        },
      },
      {
        or: [
          {
            publishedAt: {
              exists: false,
            },
          },
          {
            publishedAt: {
              less_than_equal: new Date().toISOString(),
            },
          },
        ],
      },
    ] as import('payload').Where[],
  }
}

export const Posts: CollectionConfig = {
  slug: 'posts',
  labels: adminLabelsKey('collections.posts'),
  admin: {
    defaultColumns: ['title', 'slug', 'category', '_status', 'isVisible', 'publishedAt', 'isPinned', 'sortOrder', 'updatedAt'],
    description: adminTextKey('collections.posts.description'),
    group: adminTextKey('groups.content'),
    useAsTitle: 'title',
  },
  access: {
    create: isStaff,
    delete: isStaff,
    read: publicReadOrStaff,
    update: isStaff,
  },
  hooks: {
    afterChange: [revalidateBlogPostCacheAfterChange],
    afterDelete: [revalidateBlogPostCacheAfterDelete],
    beforeChange: [assignCurrentUser('createdBy'), fillPublishAtOnPublish('publishedAt'), validatePostCoverImage],
    beforeValidate: [normalizePostSlugBeforeValidate],
  },
  defaultSort: ['-isPinned', 'sortOrder', '-publishedAt'],
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
      validate: validatePostSlug,
      admin: {
        description: 'Stable URL-friendly identifier used by content detail pages. Spaces and punctuation are normalized on save.',
      },
    },
    {
      name: 'category',
      type: 'select',
      defaultValue: 'article',
      label: 'Content type',
      options: [
        { label: 'Article', value: 'article' },
        { label: 'Event post', value: 'event' },
        { label: 'Announcement article', value: 'announcement' },
      ],
      required: true,
    },
    {
      name: 'coverImage',
      type: 'upload',
      relationTo: 'media',
      label: 'Cover image',
    },
    {
      name: 'excerpt',
      type: 'textarea',
      localized: true,
      label: 'Excerpt',
    },
    {
      name: 'content',
      type: 'richText',
      localized: true,
      label: 'Content',
      required: true,
    },
    {
      name: 'videoUrl',
      type: 'text',
      label: 'Third-party video URL',
      admin: {
        description: 'Supports YouTube and other third-party video links for content detail embeds.',
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
      name: 'publishedAt',
      type: 'date',
      admin: {
        position: 'sidebar',
      },
      label: 'Published at',
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
      admin: {
        description: 'Turn this off to immediately remove the post from public blog list and detail pages without deleting the record.',
      },
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

