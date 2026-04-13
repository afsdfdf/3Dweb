import type { CollectionConfig } from 'payload'

import { isStaff } from '@/access'

export const CreditProducts: CollectionConfig = {
  slug: 'credit-products',
  labels: {
    plural: '积分商品',
    singular: '积分商品',
  },
  admin: {
    defaultColumns: ['title', 'productType', 'credits', 'price', 'isActive', 'isFeatured'],
    group: '商务',
    useAsTitle: 'title',
  },
  access: {
    create: isStaff,
    delete: isStaff,
    read: () => true,
    update: isStaff,
  },
  timestamps: true,
  fields: [
    { name: 'title', type: 'text', required: true, label: '标题' },
    { name: 'slug', type: 'text', required: true, unique: true, label: '标识' },
    {
      name: 'productType',
      type: 'select',
      defaultValue: 'credit-topup',
      label: '商品类型',
      options: [
        { label: '积分充值', value: 'credit-topup' },
        { label: '打印套餐', value: 'print-package' },
      ],
    },
    { name: 'description', type: 'textarea', label: '描述' },
    { name: 'credits', type: 'number', defaultValue: 0, label: '积分数' },
    { name: 'price', type: 'number', required: true, label: '价格' },
    { name: 'currency', type: 'text', defaultValue: 'USD', label: '货币' },
    { name: 'shopifyProductId', type: 'text', label: 'Shopify 商品 ID' },
    { name: 'shopifyVariantId', type: 'text', label: 'Shopify 变体 ID' },
    { name: 'isFeatured', type: 'checkbox', defaultValue: false, label: '推荐' },
    { name: 'isActive', type: 'checkbox', defaultValue: true, label: '启用' },
    { name: 'sortOrder', type: 'number', defaultValue: 0, label: '排序' },
  ],
}
