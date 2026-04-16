import type { CollectionConfig } from 'payload'

import { isStaff, ownerOrStaff } from '@/access'

export const BillingSubscriptions: CollectionConfig = {
  slug: 'billing-subscriptions',
  labels: {
    plural: '订阅记录',
    singular: '订阅记录',
  },
  admin: {
    defaultColumns: ['planKey', 'user', 'status', 'monthlyCredits', 'currentPeriodEnd'],
    description: '记录 Stripe 订阅、当前周期和积分发放状态。',
    group: '商务',
    useAsTitle: 'stripeSubscriptionId',
  },
  access: {
    create: isStaff,
    delete: isStaff,
    read: ownerOrStaff('user'),
    update: isStaff,
  },
  defaultSort: '-updatedAt',
  timestamps: true,
  fields: [
    { name: 'user', type: 'relationship', relationTo: 'users', required: true, label: '用户' },
    { name: 'planKey', type: 'text', required: true, label: '方案标识' },
    { name: 'stripeCustomerId', type: 'text', required: true, index: true, label: 'Stripe Customer ID' },
    { name: 'stripeSubscriptionId', type: 'text', required: true, unique: true, label: 'Stripe Subscription ID' },
    { name: 'stripePriceId', type: 'text', required: true, label: 'Stripe Price ID' },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'incomplete',
      label: '状态',
      options: [
        { label: '待完成', value: 'incomplete' },
        { label: '已激活', value: 'active' },
        { label: '试用中', value: 'trialing' },
        { label: '逾期', value: 'past_due' },
        { label: '未付款', value: 'unpaid' },
        { label: '已取消', value: 'canceled' },
        { label: '已过期', value: 'incomplete_expired' },
      ],
    },
    { name: 'interval', type: 'text', defaultValue: 'month', label: '周期' },
    { name: 'monthlyCredits', type: 'number', defaultValue: 0, label: '每期积分' },
    { name: 'currentPeriodStart', type: 'date', label: '当前周期开始' },
    { name: 'currentPeriodEnd', type: 'date', label: '当前周期结束' },
    { name: 'cancelAtPeriodEnd', type: 'checkbox', defaultValue: false, label: '周期结束时取消' },
    { name: 'lastGrantedPeriodKey', type: 'text', label: '最近发放周期标识' },
    { name: 'lastCheckoutSessionId', type: 'text', label: '最近结算会话' },
    { name: 'metadata', type: 'json', label: '原始 Stripe 数据' },
  ],
}
