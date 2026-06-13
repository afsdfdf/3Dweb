import type { CollectionConfig } from 'payload'

import { isAdmin, isStaff } from '@/access'
import { adminLabelsKey, adminTextKey } from '@/lib/adminText'

export const BillingCheckouts: CollectionConfig = {
  slug: 'billing-checkouts',
  labels: adminLabelsKey('collections.billingCheckouts'),
  admin: {
    defaultColumns: ['user', 'planKey', 'billingCycle', 'status', 'expiresAt'],
    description: adminTextKey('collections.billingCheckouts.description'),
    group: adminTextKey('groups.commerce'),
    useAsTitle: 'stripeCheckoutSessionId',
  },
  access: {
    create: isAdmin,
    delete: isAdmin,
    read: isStaff,
    update: isAdmin,
  },
  defaultSort: '-updatedAt',
  timestamps: true,
  fields: [
    { name: 'user', type: 'relationship', relationTo: 'users', required: true, index: true, label: 'User' },
    { name: 'planKey', type: 'text', required: true, label: 'Plan key' },
    {
      name: 'billingCycle',
      type: 'select',
      required: true,
      defaultValue: 'monthly',
      label: 'Billing cycle',
      options: [
        { label: 'Monthly', value: 'monthly' },
        { label: 'Yearly', value: 'yearly' },
      ],
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'open',
      index: true,
      label: 'Status',
      options: [
        { label: 'Open', value: 'open' },
        { label: 'Completed', value: 'completed' },
        { label: 'Expired', value: 'expired' },
        { label: 'Failed', value: 'failed' },
      ],
    },
    {
      name: 'openLockKey',
      type: 'text',
      unique: true,
      label: 'Open lock key',
      admin: {
        description: 'Internal uniqueness guard. Open subscription checkouts use one lock per user.',
      },
    },
    { name: 'stripeCheckoutSessionId', type: 'text', unique: true, label: 'Stripe checkout session ID' },
    { name: 'stripeCustomerId', type: 'text', label: 'Stripe customer ID' },
    { name: 'stripePriceId', type: 'text', label: 'Stripe price ID' },
    { name: 'checkoutUrl', type: 'text', label: 'Checkout URL' },
    { name: 'expiresAt', type: 'date', index: true, label: 'Expires at' },
    { name: 'completedAt', type: 'date', label: 'Completed at' },
    { name: 'failedReason', type: 'textarea', label: 'Failure reason' },
    { name: 'metadata', type: 'json', label: 'Checkout payload' },
  ],
}
