import type { CollectionConfig } from 'payload'

import { ownerOrStaff, publicOwnerOrStaff } from '@/access'
import { validatePublicModelPreview } from '@/hooks/validatePublicModelPreview'
import { adminLabelsKey, adminTextKey } from '@/lib/adminText'

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
    create: ownerOrStaff('owner'),
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
            read: ownerOrStaffFieldAccess,
          },
        },
        { name: 'downloadCredits', type: 'number', defaultValue: 0, label: 'Download credits' },
        { name: 'fileSizeMb', type: 'number', label: 'File size (MB)' },
      ],
    },
    {
      name: 'viewerUrl',
      type: 'text',
      label: 'Viewer URL',
      access: {
        read: ownerOrStaffFieldAccess,
      },
    },
    { name: 'printReady', type: 'checkbox', defaultValue: false, label: 'Print ready' },
    {
      name: 'viewCount',
      type: 'number',
      defaultValue: 0,
      label: 'View count',
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
