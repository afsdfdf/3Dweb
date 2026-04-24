import type { CollectionConfig } from 'payload'

import { ownerOrStaff } from '@/access'
import { syncMediaToS3AfterChange, syncMediaToS3AfterDelete } from '@/hooks/syncMediaToS3'
import { adminLabelsKey, adminTextKey } from '@/lib/adminText'
import { mediaReadAccess } from '@/lib/mediaReadAccess'

function normalizeOptionalMediaURL(value: unknown) {
  if (typeof value !== 'string') {
    return value
  }

  const normalized = value.trim()
  return normalized.length > 0 ? normalized : null
}

export const Media: CollectionConfig = {
  slug: 'media',
  labels: adminLabelsKey('collections.media'),
  admin: {
    description: adminTextKey('collections.media.description'),
    group: adminTextKey('groups.platform'),
    defaultColumns: ['filename', 'mimeType', 'purpose', 'publicAccess', 'owner', 'updatedAt'],
  },
  access: {
    create: ({ req }) => Boolean(req.user),
    delete: ownerOrStaff('owner'),
    read: mediaReadAccess,
    update: ownerOrStaff('owner'),
  },
  hooks: {
    afterRead: [
      ({ doc }) => {
        if (!doc || typeof doc !== 'object') {
          return doc
        }

        return {
          ...doc,
          thumbnailURL: normalizeOptionalMediaURL((doc as { thumbnailURL?: unknown }).thumbnailURL),
          url: normalizeOptionalMediaURL((doc as { url?: unknown }).url),
        }
      },
    ],
    afterChange: [syncMediaToS3AfterChange],
    afterDelete: [syncMediaToS3AfterDelete],
  },
  fields: [
    { name: 'alt', type: 'text', required: true, label: 'Alt text' },
    { name: 'owner', type: 'relationship', relationTo: 'users', label: 'Owner' },
    {
      name: 'purpose',
      type: 'select',
      defaultValue: 'asset',
      label: 'Purpose',
      admin: {
        description: 'Use preview for guest-readable images. Keep model files as model and source assets as input.',
      },
      options: [
        { label: 'Input image', value: 'input' },
        { label: 'Preview image', value: 'preview' },
        { label: '3D file', value: 'model' },
        { label: 'Document', value: 'document' },
        { label: 'General asset', value: 'asset' },
      ],
    },
    {
      name: 'publicAccess',
      type: 'checkbox',
      defaultValue: false,
      label: 'Guest readable',
      admin: {
        description: 'Enable this when administrators want guests to access this exact asset, including example files or public 3D files.',
      },
    },
  ],
  upload: {
    mimeTypes: [
      'application/octet-stream',
      'image/png',
      'image/jpeg',
      'image/webp',
      'image/gif',
      'application/zip',
      'application/vnd.autodesk.fbx',
      'model/gltf-binary',
      'model/gltf+json',
      'model/vnd.usdz+zip',
      'application/sla',
      'application/vnd.ms-pki.stl',
      'text/plain',
    ],
  },
}
