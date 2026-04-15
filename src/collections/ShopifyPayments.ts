import type { CollectionConfig } from 'payload'

import { isStaff, ownerOrStaff } from '@/access'

export const ShopifyPayments: CollectionConfig = {
  slug: 'shopify-payments',
  labels: {
    plural: '支付记录',
    singular: '支付记录',
  },
  admin: {
    description: '统一记录平台支付流水。当前线上支付主通道为 Stripe，保留 Shopify 兼容字段以支持未来迁移。',
    group: '商务',
    useAsTitle: 'checkoutReference',
    defaultColumns: ['checkoutReference', 'user', 'paymentType', 'status', 'amount'],
  },
  access: {
    create: isStaff,
    read: ownerOrStaff('user'),
    update: isStaff,
  },
  defaultSort: '-createdAt',
  timestamps: true,
  fields: [
    { name: 'checkoutReference', type: 'text', required: true, unique: true, label: '支付参考号' },
    { name: 'user', type: 'relationship', relationTo: 'users', required: true, label: '用户' },
    {
      name: 'paymentType',
      type: 'select',
      required: true,
      label: '支付类型',
      options: [
        { label: '积分充值', value: 'credit-topup' },
        { label: '打印订单', value: 'print-order' },
      ],
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'pending',
      label: '状态',
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
      label: '支付订单 ID（兼容旧字段）',
      admin: {
        description: '历史字段名保留为 shopifyOrderId，当前可用于存储 Stripe/Shopify 订单参考号。',
      },
    },
    {
      name: 'shopifyCheckoutId',
      type: 'text',
      label: '支付结算会话 ID（兼容旧字段）',
      admin: {
        description: '历史字段名保留为 shopifyCheckoutId，当前 Stripe Checkout Session ID 也写入此处。',
      },
    },
    { name: 'creditsGranted', type: 'number', defaultValue: 0, label: '发放积分' },
    { name: 'linkedOrder', type: 'relationship', relationTo: 'print-orders', label: '关联订单' },
    { name: 'amount', type: 'number', required: true, defaultValue: 0, label: '金额' },
    { name: 'currency', type: 'text', defaultValue: 'USD', label: '货币' },
    { name: 'rawWebhookPayload', type: 'json', label: '回调原始数据' },
  ],
}
