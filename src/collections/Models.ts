import type { CollectionConfig } from 'payload'

import { ownerOrStaff } from '@/access'

export const Models: CollectionConfig = {
  slug: 'models',
  labels: {
    plural: '模型库',
    singular: '模型',
  },
  admin: {
    description: '管理生成后的模型资产、文件格式和打印属性。',
    group: 'AI 生产',
    useAsTitle: 'title',
    defaultColumns: ['title', 'owner', 'status', 'visibility', 'updatedAt'],
  },
  access: {
    create: ownerOrStaff('owner'),
    read: ownerOrStaff('owner'),
    update: ownerOrStaff('owner'),
  },
  defaultSort: '-updatedAt',
  timestamps: true,
  fields: [
    { name: 'title', type: 'text', required: true, label: '名称' },
    { name: 'owner', type: 'relationship', relationTo: 'users', required: true, label: '所有者' },
    { name: 'sourceTask', type: 'relationship', relationTo: 'generation-tasks', label: '来源任务' },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'ready',
      label: '状态',
      options: [
        { label: '草稿', value: 'draft' },
        { label: '可用', value: 'ready' },
        { label: '已归档', value: 'archived' },
      ],
    },
    {
      name: 'visibility',
      type: 'select',
      defaultValue: 'private',
      label: '可见性',
      options: [
        { label: '私有', value: 'private' },
        { label: '团队', value: 'team' },
        { label: '公开展示', value: 'public' },
      ],
    },
    { name: 'previewImage', type: 'upload', relationTo: 'media', label: '预览图' },
    {
      name: 'formats',
      type: 'array',
      label: '文件格式',
      fields: [
        { name: 'format', type: 'select', label: '格式', options: ['glb', 'fbx', 'obj', 'stl', 'usdz'], required: true },
        { name: 'file', type: 'upload', relationTo: 'media', label: '文件' },
        { name: 'downloadCredits', type: 'number', defaultValue: 0, label: '下载积分' },
        { name: 'fileSizeMb', type: 'number', label: '文件大小(MB)' },
      ],
    },
    { name: 'viewerUrl', type: 'text', label: '预览地址' },
    { name: 'printReady', type: 'checkbox', defaultValue: false, label: '可打印' },
    {
      name: 'dimensions',
      type: 'group',
      label: '尺寸',
      fields: [
        { name: 'widthMm', type: 'number', label: '宽(mm)' },
        { name: 'heightMm', type: 'number', label: '高(mm)' },
        { name: 'depthMm', type: 'number', label: '深(mm)' },
      ],
    },
    {
      name: 'tags',
      type: 'array',
      label: '标签',
      fields: [{ name: 'label', type: 'text', label: '标签' }],
    },
    { name: 'description', type: 'textarea', label: '描述' },
  ],
}
