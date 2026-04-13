import type { CollectionConfig } from 'payload'

import { canAccessAdmin, isAdmin, isSelfOrStaff } from '@/access'
import { createDefaultCreditAccount } from '@/hooks/createDefaultCreditAccount'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: {
    plural: '用户',
    singular: '用户',
  },
  admin: {
    description: '平台用户、角色、资料与账户总览。',
    group: '平台',
    useAsTitle: 'email',
    defaultColumns: ['email', 'fullName', 'role', 'creditsBalance', 'createdAt'],
  },
  auth: true,
  access: {
    admin: canAccessAdmin,
    create: () => true,
    delete: isAdmin,
    read: isSelfOrStaff,
    update: isSelfOrStaff,
  },
  hooks: {
    afterChange: [createDefaultCreditAccount],
  },
  timestamps: true,
  fields: [
    { name: 'fullName', type: 'text', label: '姓名' },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'customer',
      label: '角色',
      options: [
        { label: '管理员', value: 'admin' },
        { label: '运营', value: 'operator' },
        { label: '用户', value: 'customer' },
      ],
    },
    { name: 'avatar', type: 'upload', relationTo: 'media', label: '头像' },
    { name: 'phone', type: 'text', label: '电话' },
    {
      name: 'shopifyCustomerId',
      type: 'text',
      label: 'Shopify 客户 ID',
      admin: { position: 'sidebar' },
    },
    {
      name: 'creditsBalance',
      type: 'number',
      defaultValue: 0,
      label: '积分余额',
      admin: { position: 'sidebar', readOnly: true },
    },
    {
      name: 'lastActiveAt',
      type: 'date',
      label: '最后活跃时间',
      admin: { position: 'sidebar' },
    },
  ],
}
