import type { CollectionConfig } from 'payload'

import { isStaff, ownerOrStaff, publicOwnerOrStaff } from '@/access'
import { validatePublicModelPreview } from '@/hooks/validatePublicModelPreview'
import { adminLabelsKey, adminTextKey } from '@/lib/adminText'

const staffFieldAccess = ({ req }: { req: { user?: { role?: string | null } | null } }) => {
  return req.user?.role === 'admin' || req.user?.role === 'operator'
}

const ownerOrStaffFieldAccess = ({ doc, req }: { doc?: Record<string, unknown> | null; req: { user?: { id?: number | string | null; role?: string | null } | null } }) => {
  if (req.user?.role === 'admin' || req.user?.role === 'operator') {
    return true
  }

  const owner = doc?.owner
  const ownerId =
    owner && typeof owner === 'object' && 'id' in owner
      ? (owner as { id?: number | string | null }).id
      : owner

  return ownerId !== undefined && ownerId !== null && String(ownerId) === String(req.user?.id || '')
}

export const Models: CollectionConfig = {
  slug: 'models',
  labels: adminLabelsKey('collections.models'),
  admin: {
    description: adminTextKey('collections.models.description'),
    group: adminTextKey('groups.aiProduction'),
    useAsTitle: 'title',
    defaultColumns: ['title', 'owner', 'status', 'visibility', 'updatedAt'],
  },
  access: {
    create: isStaff,
    read: publicOwnerOrStaff('owner'),
    update: ownerOrStaff('owner'),
  },
  hooks: {
    beforeChange: [validatePublicModelPreview],
  },
  defaultSort: '-updatedAt',
  timestamps: true,
  fields: [
    { name: 'title', type: 'text', required: true, label: 'Title' },
    { name: 'owner', type: 'relationship', relationTo: 'users', required: true, label: 'Owner' },
    { name: 'sourceTask', type: 'relationship', relationTo: 'generation-tasks', label: 'Source task' },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'ready',
      label: 'Status',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Ready', value: 'ready' },
        { label: 'Archived', value: 'archived' },
      ],
    },
    {
      name: 'visibility',
      type: 'select',
      defaultValue: 'private',
      label: 'Visibility',
      options: [
        { label: 'Private', value: 'private' },
        { label: 'Team', value: 'team' },
        { label: 'Public', value: 'public' },
      ],
    },
    {
      name: 'previewImage',
      type: 'upload',
      relationTo: 'media',
      label: 'Preview image',
      admin: {
        description: 'Required for public models. The linked media should use purpose = preview.',
      },
    },
    {
      name: 'formats',
      type: 'array',
      label: 'Formats',
      fields: [
        { name: 'format', type: 'select', label: 'Format', options: ['glb', 'fbx', 'obj', 'stl', 'usdz', '3mf'], required: true },
        {
          name: 'file',
          type: 'upload',
          relationTo: 'media',
          label: 'File',
          access: {
            create: staffFieldAccess,
            read: ownerOrStaffFieldAccess,
            update: staffFieldAccess,
          },
        },
        {
          name: 'downloadCredits',
          type: 'number',
          defaultValue: 0,
          label: 'Download credits',
          access: {
            create: staffFieldAccess,
            update: staffFieldAccess,
          },
        },
        { name: 'fileSizeMb', type: 'number', label: 'File size (MB)' },
      ],
    },
    {
      name: 'viewerUrl',
      type: 'text',
      label: 'Viewer URL',
      access: {
        create: staffFieldAccess,
        read: ownerOrStaffFieldAccess,
        update: staffFieldAccess,
      },
    },
    {
      name: 'viewerOptimization',
      type: 'group',
      label: 'Viewer optimization',
      access: {
        create: staffFieldAccess,
        read: ownerOrStaffFieldAccess,
        update: staffFieldAccess,
      },
      fields: [
        {
          name: 'status',
          type: 'select',
          defaultValue: 'none',
          label: 'Status',
          options: ['none', 'pending', 'running', 'succeeded', 'failed', 'skipped'],
        },
        {
          name: 'mode',
          type: 'select',
          label: 'Mode',
          options: ['conservative', 'small'],
        },
        { name: 'sourceFile', type: 'upload', relationTo: 'media', label: 'Source file' },
        { name: 'previewFile', type: 'upload', relationTo: 'media', label: 'Preview file' },
        { name: 'sourceSizeMb', type: 'number', label: 'Source size (MB)' },
        { name: 'outputSizeMb', type: 'number', label: 'Output size (MB)' },
        { name: 'reductionPercent', type: 'number', label: 'Reduction percent' },
        { name: 'attempts', type: 'number', defaultValue: 0, label: 'Attempts' },
        { name: 'lastError', type: 'textarea', label: 'Last error' },
        { name: 'startedAt', type: 'date', label: 'Started at' },
        { name: 'completedAt', type: 'date', label: 'Completed at' },
      ],
    },
    { name: 'printReady', type: 'checkbox', defaultValue: false, label: 'Print ready' },
    {
      name: 'viewCount',
      type: 'number',
      defaultValue: 0,
      label: 'View count',
      access: {
        create: staffFieldAccess,
        update: staffFieldAccess,
      },
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
    },
    {
      name: 'commentsCount',
      type: 'number',
      defaultValue: 0,
      label: 'Comments count',
      access: {
        create: staffFieldAccess,
        update: staffFieldAccess,
      },
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
    },
    {
      name: 'likesCount',
      type: 'number',
      defaultValue: 0,
      label: 'Likes count',
      access: {
        create: staffFieldAccess,
        update: staffFieldAccess,
      },
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
    },
    {
      name: 'favoritesCount',
      type: 'number',
      defaultValue: 0,
      label: 'Favorites count',
      access: {
        create: staffFieldAccess,
        update: staffFieldAccess,
      },
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
    },
    {
      name: 'dimensions',
      type: 'group',
      label: 'Dimensions',
      fields: [
        { name: 'widthMm', type: 'number', label: 'Width (mm)' },
        { name: 'heightMm', type: 'number', label: 'Height (mm)' },
        { name: 'depthMm', type: 'number', label: 'Depth (mm)' },
      ],
    },
    {
      name: 'tags',
      type: 'array',
      label: 'Tags',
      fields: [{ name: 'label', type: 'text', label: 'Tag' }],
    },
    { name: 'description', type: 'textarea', label: 'Description' },
  ],
}
