import type { CollectionConfig } from 'payload'

import { isAdmin, ownerOrStaff } from '@/access'
import { syncCreditBalanceMirror } from '@/hooks/syncCreditBalanceMirror'
import { adminLabelsKey, adminTextKey } from '@/lib/adminText'

export const Credits: CollectionConfig = {
  slug: 'credits',
  labels: adminLabelsKey('collections.credits'),
  admin: {
    description: adminTextKey('collections.credits.description'),
    group: adminTextKey('groups.commerce'),
    useAsTitle: 'accountLabel',
    defaultColumns: ['accountLabel', 'user', 'balance', 'reservedBalance', 'status'],
  },
  access: {
    create: isAdmin,
    delete: isAdmin,
    read: ownerOrStaff('user'),
    update: isAdmin,
  },
  hooks: {
    afterChange: [syncCreditBalanceMirror],
  },
  timestamps: true,
  fields: [
    { name: 'accountLabel', type: 'text', required: true, defaultValue: 'Primary credits account', label: 'Account label' },
    { name: 'user', type: 'relationship', relationTo: 'users', required: true, unique: true, label: 'User' },
    { name: 'balance', type: 'number', required: true, defaultValue: 0, label: 'Balance' },
    { name: 'reservedBalance', type: 'number', required: true, defaultValue: 0, label: 'Reserved balance' },
    { name: 'lifetimePurchased', type: 'number', required: true, defaultValue: 0, label: 'Lifetime purchased' },
    { name: 'lifetimeSpent', type: 'number', required: true, defaultValue: 0, label: 'Lifetime spent' },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'active',
      label: 'Status',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Suspended', value: 'suspended' },
        { label: 'Closed', value: 'closed' },
      ],
    },
    { name: 'billingNotes', type: 'textarea', label: 'Billing notes' },
  ],
}
