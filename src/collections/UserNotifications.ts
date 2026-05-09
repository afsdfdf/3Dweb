import type { CollectionConfig } from 'payload'

import { isStaff, ownerOrStaff } from '@/access'

export const UserNotifications: CollectionConfig = {
  slug: 'user-notifications',
  admin: {
    defaultColumns: ['title', 'type', 'user', 'severity', 'readAt', 'createdAt'],
    group: 'Account',
    useAsTitle: 'title',
  },
  access: {
    create: isStaff,
    delete: isStaff,
    read: ownerOrStaff('user'),
    update: isStaff,
  },
  defaultSort: '-createdAt',
  timestamps: true,
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
      label: 'User',
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      label: 'Type',
      options: [
        { label: 'Generation completed', value: 'generation_completed' },
        { label: 'Generation failed', value: 'generation_failed' },
        { label: 'Order paid', value: 'order_paid' },
        { label: 'Order status', value: 'order_status' },
        { label: 'Credits purchased', value: 'credits_purchased' },
        { label: 'Credits adjusted', value: 'credits_adjusted' },
        { label: 'Subscription credits', value: 'subscription_credits' },
        { label: 'System notice', value: 'system_notice' },
      ],
    },
    {
      name: 'title',
      type: 'text',
      required: true,
      label: 'Title',
    },
    {
      name: 'body',
      type: 'textarea',
      required: true,
      label: 'Body',
    },
    {
      name: 'href',
      type: 'text',
      label: 'Link href',
    },
    {
      name: 'severity',
      type: 'select',
      defaultValue: 'info',
      required: true,
      label: 'Severity',
      options: [
        { label: 'Info', value: 'info' },
        { label: 'Success', value: 'success' },
        { label: 'Warning', value: 'warning' },
        { label: 'Critical', value: 'critical' },
      ],
    },
    {
      name: 'readAt',
      type: 'date',
      index: true,
      label: 'Read at',
    },
    {
      name: 'sourceKey',
      type: 'text',
      index: true,
      unique: true,
      label: 'Source key',
    },
    {
      name: 'sourceTask',
      type: 'relationship',
      relationTo: 'generation-tasks',
      label: 'Source task',
    },
    {
      name: 'sourceOrder',
      type: 'relationship',
      relationTo: 'print-orders',
      label: 'Source order',
    },
    {
      name: 'metadata',
      type: 'json',
      label: 'Metadata',
    },
  ],
}
