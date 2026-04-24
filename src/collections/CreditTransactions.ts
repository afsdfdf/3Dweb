import type { CollectionConfig } from 'payload'

import { isAdmin, ownerOrStaff } from '@/access'
import { adminLabelsKey, adminTextKey } from '@/lib/adminText'

export const CreditTransactions: CollectionConfig = {
  slug: 'credit-transactions',
  labels: adminLabelsKey('collections.creditTransactions'),
  admin: {
    description: adminTextKey('collections.creditTransactions.description'),
    group: adminTextKey('groups.commerce'),
    useAsTitle: 'referenceCode',
    defaultColumns: ['referenceCode', 'type', 'amount', 'user', 'createdAt'],
  },
  access: {
    create: isAdmin,
    read: ownerOrStaff('user'),
    update: isAdmin,
  },
  defaultSort: '-createdAt',
  timestamps: true,
  fields: [
    { name: 'referenceCode', type: 'text', required: true, unique: true, label: 'Reference code' },
    { name: 'idempotencyKey', type: 'text', unique: true, label: 'Idempotency key' },
    { name: 'user', type: 'relationship', relationTo: 'users', required: true, label: 'User' },
    { name: 'creditAccount', type: 'relationship', relationTo: 'credits', required: true, label: 'Credit account' },
    {
      name: 'type',
      type: 'select',
      required: true,
      label: 'Type',
      options: [
        { label: 'Purchase', value: 'purchase' },
        { label: 'Task hold', value: 'task_hold' },
        { label: 'Task charge', value: 'task_spend' },
        { label: 'Download charge', value: 'download_spend' },
        { label: 'Refund', value: 'refund' },
        { label: 'Manual adjustment', value: 'manual_adjustment' },
        { label: 'Subscription grant', value: 'subscription_grant' },
      ],
    },
    { name: 'amount', type: 'number', required: true, label: 'Amount' },
    { name: 'currency', type: 'text', defaultValue: 'credits', label: 'Currency' },
    { name: 'balanceAfter', type: 'number', label: 'Balance after' },
    { name: 'sourceTask', type: 'relationship', relationTo: 'generation-tasks', label: 'Source task' },
    { name: 'sourceOrder', type: 'relationship', relationTo: 'print-orders', label: 'Source order' },
    { name: 'notes', type: 'textarea', label: 'Notes' },
    { name: 'metadata', type: 'json', label: 'Metadata' },
  ],
}
