import type { CollectionConfig } from 'payload'

import { ownerOrStaff } from '@/access'

export const CreditTransactions: CollectionConfig = {
  slug: 'credit-transactions',
  labels: {
    plural: '积分流水',
    singular: '积分流水',
  },
  admin: {
    description: '记录每一笔积分变动。',
    group: '商务',
    useAsTitle: 'referenceCode',
    defaultColumns: ['referenceCode', 'user', 'type', 'amount', 'createdAt'],
  },
  access: {
    create: ownerOrStaff('user'),
    read: ownerOrStaff('user'),
    update: ownerOrStaff('user'),
  },
  defaultSort: '-createdAt',
  timestamps: true,
  fields: [
    { name: 'referenceCode', type: 'text', required: true, unique: true, label: '流水号' },
    { name: 'user', type: 'relationship', relationTo: 'users', required: true, label: '用户' },
    { name: 'creditAccount', type: 'relationship', relationTo: 'credits', required: true, label: '积分账户' },
    {
      name: 'type',
      type: 'select',
      required: true,
      label: '类型',
      options: [
        { label: '购买', value: 'purchase' },
        { label: '任务预扣', value: 'task_hold' },
        { label: '任务扣费', value: 'task_spend' },
        { label: '退款', value: 'refund' },
        { label: '手工调整', value: 'manual_adjustment' },
      ],
    },
    { name: 'amount', type: 'number', required: true, label: '数量' },
    { name: 'currency', type: 'text', defaultValue: 'credits', label: '单位' },
    { name: 'balanceAfter', type: 'number', label: '变动后余额' },
    { name: 'sourceTask', type: 'relationship', relationTo: 'generation-tasks', label: '来源任务' },
    { name: 'sourceOrder', type: 'relationship', relationTo: 'print-orders', label: '来源订单' },
    { name: 'notes', type: 'textarea', label: '备注' },
    { name: 'metadata', type: 'json', label: '扩展信息' },
  ],
}
