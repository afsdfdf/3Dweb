import type { CollectionConfig } from 'payload'

import { ownerOrStaff } from '@/access'

export const TaskEvents: CollectionConfig = {
  slug: 'task-events',
  labels: {
    plural: '任务事件',
    singular: '任务事件',
  },
  admin: {
    defaultColumns: ['eventType', 'task', 'provider', 'createdAt'],
    group: 'AI 生产',
    useAsTitle: 'eventType',
  },
  access: {
    create: ({ req }) => Boolean(req.user),
    delete: ownerOrStaff('user'),
    read: ownerOrStaff('user'),
    update: ownerOrStaff('user'),
  },
  defaultSort: '-createdAt',
  timestamps: true,
  fields: [
    { name: 'task', type: 'relationship', relationTo: 'generation-tasks', required: true, label: '任务' },
    { name: 'user', type: 'relationship', relationTo: 'users', required: true, label: '用户' },
    {
      name: 'eventType',
      type: 'select',
      required: true,
      label: '事件类型',
      options: [
        { label: '已排队', value: 'queued' },
        { label: '已提交', value: 'submitted' },
        { label: '轮询', value: 'polling' },
        { label: '回调', value: 'callback' },
        { label: '完成', value: 'completed' },
        { label: '失败', value: 'failed' },
      ],
    },
    { name: 'provider', type: 'text', label: '供应商' },
    { name: 'message', type: 'textarea', label: '说明' },
    { name: 'payload', type: 'json', label: '原始载荷' },
  ],
}
