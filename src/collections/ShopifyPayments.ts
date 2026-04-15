import type { CollectionConfig } from 'payload'

import { isStaff, ownerOrStaff } from '@/access'

export const ShopifyPayments: CollectionConfig = {
  slug: 'shopify-payments',
  labels: {
    plural: 'Shopify 支付',
    singular: 'Shopify 支付',
  },
  admin: {
    description: '记录从 Shopify 同步或模拟生成的支付记录。',
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
    { name: 'shopifyOrderId', type: 'text', label: 'Shopify 订单 ID' },
    { name: 'shopifyCheckoutId', type: 'text', label: 'Shopify 结算 ID' },
    { name: 'creditsGranted', type: 'number', defaultValue: 0, label: '发放积分' },
    { name: 'linkedOrder', type: 'relationship', relationTo: 'print-orders', label: '关联订单' },
    { name: 'amount', type: 'number', required: true, defaultValue: 0, label: '金额' },
    { name: 'currency', type: 'text', defaultValue: 'USD', label: '货币' },
    { name: 'rawWebhookPayload', type: 'json', label: '回调原始数据' },
  ],
}
