import type { CollectionConfig } from 'payload'

import { isAdmin, ownerOrStaff } from '@/access'

export const Credits: CollectionConfig = {
  slug: 'credits',
  labels: {
    plural: '积分账户',
    singular: '积分账户',
  },
  admin: {
    description: '管理用户积分余额、预扣与累计消费。',
    group: '商务',
    useAsTitle: 'accountLabel',
    defaultColumns: ['accountLabel', 'user', 'balance', 'reservedBalance', 'status'],
  },
  access: {
    create: isAdmin,
    delete: isAdmin,
    read: ownerOrStaff('user'),
    update: isAdmin,
  },
  timestamps: true,
  fields: [
    { name: 'accountLabel', type: 'text', required: true, defaultValue: '主积分账户', label: '账户名称' },
    { name: 'user', type: 'relationship', relationTo: 'users', required: true, unique: true, label: '用户' },
    { name: 'balance', type: 'number', required: true, defaultValue: 0, label: '余额' },
    { name: 'reservedBalance', type: 'number', required: true, defaultValue: 0, label: '预扣' },
    { name: 'lifetimePurchased', type: 'number', required: true, defaultValue: 0, label: '累计购入' },
    { name: 'lifetimeSpent', type: 'number', required: true, defaultValue: 0, label: '累计消耗' },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'active',
      label: '状态',
      options: [
        { label: '正常', value: 'active' },
        { label: '暂停', value: 'suspended' },
        { label: '关闭', value: 'closed' },
      ],
    },
    { name: 'billingNotes', type: 'textarea', label: '账务备注' },
  ],
}
