import type { CollectionConfig } from 'payload'

import { ownerOrStaff } from '@/access'
import { syncMediaToS3AfterChange, syncMediaToS3AfterDelete } from '@/hooks/syncMediaToS3'

export const Media: CollectionConfig = {
  slug: 'media',
  labels: {
    plural: '媒体资源',
    singular: '媒体资源',
  },
  admin: {
    description: '图片、预览图和 3D 文件统一存放处。',
    group: '平台',
    defaultColumns: ['filename', 'mimeType', 'purpose', 'owner', 'updatedAt'],
  },
  access: {
    create: ({ req }) => Boolean(req.user),
    delete: ownerOrStaff('owner'),
    read: () => true,
    update: ownerOrStaff('owner'),
  },
  hooks: {
    afterChange: [syncMediaToS3AfterChange],
    afterDelete: [syncMediaToS3AfterDelete],
  },
  fields: [
    { name: 'alt', type: 'text', required: true, label: '替代文本' },
    { name: 'owner', type: 'relationship', relationTo: 'users', label: '所有者' },
    {
      name: 'purpose',
      type: 'select',
      defaultValue: 'asset',
      label: '用途',
      options: [
        { label: '输入图', value: 'input' },
        { label: '预览图', value: 'preview' },
        { label: '3D 文件', value: 'model' },
        { label: '文档', value: 'document' },
        { label: '通用资源', value: 'asset' },
      ],
    },
  ],
  upload: {
    mimeTypes: [
      'image/png',
      'image/jpeg',
      'image/webp',
      'image/gif',
      'application/octet-stream',
      'application/zip',
      'model/gltf-binary',
      'model/gltf+json',
      'application/sla',
      'application/vnd.ms-pki.stl',
      'text/plain',
    ],
  },
}
