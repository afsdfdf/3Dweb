import type { CollectionConfig } from 'payload'

import { isStaff, ownerOrStaff } from '@/access'

export const PrintOrders: CollectionConfig = {
  slug: 'print-orders',
  labels: {
    plural: '打印订单',
    singular: '打印订单',
  },
  admin: {
    description: '管理模型打印订单、收货信息和生产状态。',
    group: '商务',
    useAsTitle: 'orderNumber',
    defaultColumns: ['orderNumber', 'user', 'status', 'paymentStatus', 'amount', 'updatedAt'],
  },
  access: {
    create: ownerOrStaff('user'),
    read: ownerOrStaff('user'),
    update: isStaff,
  },
  defaultSort: '-createdAt',
  timestamps: true,
  fields: [
    { name: 'orderNumber', type: 'text', required: true, unique: true, label: '订单号' },
    { name: 'user', type: 'relationship', relationTo: 'users', required: true, label: '用户' },
    { name: 'model', type: 'relationship', relationTo: 'models', required: true, label: '模型' },
    { name: 'sourceTask', type: 'relationship', relationTo: 'generation-tasks', label: '来源任务' },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending-payment',
      label: '状态',
      options: [
        { label: '待支付', value: 'pending-payment' },
        { label: '已支付', value: 'paid' },
        { label: '生产中', value: 'in-production' },
        { label: '已发货', value: 'shipped' },
        { label: '已完成', value: 'completed' },
        { label: '已取消', value: 'cancelled' },
      ],
    },
    {
      name: 'paymentStatus',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      label: '支付状态',
      options: [
        { label: '待支付', value: 'pending' },
        { label: '已支付', value: 'paid' },
        { label: '失败', value: 'failed' },
        { label: '已退款', value: 'refunded' },
      ],
    },
    {
      name: 'shopifyOrderId',
      type: 'text',
      label: '支付订单参考号（兼容旧字段）',
      admin: {
        description: '历史字段名保留为 shopifyOrderId，当前用于存放实际支付通道返回的订单/会话参考号。',
      },
    },
    { name: 'amount', type: 'number', required: true, defaultValue: 0, label: '金额' },
    { name: 'currency', type: 'text', defaultValue: 'USD', label: '货币' },
    { name: 'creditsUsed', type: 'number', defaultValue: 0, label: '使用积分' },
    { name: 'sizeOption', type: 'text', label: '尺寸方案' },
    { name: 'materialOption', type: 'text', label: '材质方案' },
    { name: 'shippingName', type: 'text', label: '收件人' },
    { name: 'shippingPhone', type: 'text', label: '联系电话' },
    { name: 'shippingAddress', type: 'textarea', label: '收货地址' },
    { name: 'trackingNumber', type: 'text', label: '物流单号' },
    {
      name: 'shopifyCheckoutUrl',
      type: 'text',
      label: '支付结算链接（兼容旧字段）',
      admin: {
        description: '历史字段名保留为 shopifyCheckoutUrl，当前 Stripe Checkout URL 也写入此处。',
      },
    },
    { name: 'internalNotes', type: 'textarea', label: '内部备注' },
  ],
}
