import type { CollectionConfig } from 'payload'

import { ownerOrStaff } from '@/access'

export const GenerationTasks: CollectionConfig = {
  slug: 'generation-tasks',
  labels: {
    plural: '生成任务',
    singular: '生成任务',
  },
  admin: {
    description: '跟踪 AI 生成任务的排队、状态、回调和结果。',
    group: 'AI 生产',
    useAsTitle: 'taskCode',
    defaultColumns: ['taskCode', 'user', 'inputMode', 'status', 'progress', 'updatedAt'],
  },
  access: {
    create: ownerOrStaff('user'),
    read: ownerOrStaff('user'),
    update: ownerOrStaff('user'),
  },
  defaultSort: '-createdAt',
  timestamps: true,
  fields: [
    { name: 'taskCode', type: 'text', required: true, unique: true, label: '任务编号' },
    { name: 'user', type: 'relationship', relationTo: 'users', required: true, label: '用户' },
    {
      name: 'inputMode',
      type: 'select',
      required: true,
      label: '输入模式',
      options: [
        { label: '图生 3D', value: 'image' },
        { label: '文生 3D', value: 'text' },
        { label: '图文混合', value: 'hybrid' },
      ],
    },
    { name: 'prompt', type: 'textarea', label: '提示词' },
    { name: 'sourceImage', type: 'upload', relationTo: 'media', label: '参考图' },
    {
      name: 'provider',
      type: 'select',
      defaultValue: 'custom',
      label: '供应商',
      options: [
        { label: 'Meshy', value: 'meshy' },
        { label: 'Tripo', value: 'tripo' },
        { label: '自定义接口', value: 'custom' },
      ],
    },
    { name: 'providerTaskId', type: 'text', index: true, label: '供应商任务 ID' },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'queued',
      label: '状态',
      options: [
        { label: '已排队', value: 'queued' },
        { label: '处理中', value: 'processing' },
        { label: '成功', value: 'succeeded' },
        { label: '失败', value: 'failed' },
        { label: '超时', value: 'timeout' },
      ],
    },
    { name: 'progress', type: 'number', defaultValue: 0, min: 0, max: 100, label: '进度' },
    { name: 'parameterSnapshot', type: 'json', label: '参数快照' },
    { name: 'creditsReserved', type: 'number', defaultValue: 0, label: '预扣积分' },
    { name: 'creditsSpent', type: 'number', defaultValue: 0, label: '实扣积分' },
    { name: 'resultModel', type: 'relationship', relationTo: 'models', label: '结果模型' },
    { name: 'printRequested', type: 'checkbox', defaultValue: false, label: '已申请打印' },
    { name: 'startedAt', type: 'date', label: '开始时间' },
    { name: 'completedAt', type: 'date', label: '完成时间' },
    { name: 'failureReason', type: 'textarea', label: '失败原因' },
    { name: 'callbackPayload', type: 'json', label: '回调载荷' },
  ],
}
