import type { CollectionConfig } from 'payload'

import { isAdmin, ownerOrStaff } from '@/access'
import { adminLabelsKey, adminTextKey } from '@/lib/adminText'

export const BillingSubscriptions: CollectionConfig = {
  slug: 'billing-subscriptions',
  labels: adminLabelsKey('collections.billingSubscriptions'),
  admin: {
    defaultColumns: ['planKey', 'user', 'status', 'monthlyCredits', 'currentPeriodEnd'],
    description: adminTextKey('collections.billingSubscriptions.description'),
    group: adminTextKey('groups.commerce'),
    useAsTitle: 'stripeSubscriptionId',
  },
  access: {
    create: isAdmin,
    delete: isAdmin,
    read: ownerOrStaff('user'),
    update: isAdmin,
  },
  defaultSort: '-updatedAt',
  timestamps: true,
  fields: [
    { name: 'user', type: 'relationship', relationTo: 'users', required: true, label: 'User' },
    { name: 'planKey', type: 'text', required: true, label: 'Plan key' },
    { name: 'stripeCustomerId', type: 'text', required: true, index: true, label: 'Stripe customer ID' },
    { name: 'stripeSubscriptionId', type: 'text', required: true, unique: true, label: 'Stripe subscription ID' },
    { name: 'stripePriceId', type: 'text', required: true, label: 'Stripe price ID' },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'incomplete',
      label: 'Status',
      options: [
        { label: 'Incomplete', value: 'incomplete' },
        { label: 'Active', value: 'active' },
        { label: 'Trialing', value: 'trialing' },
        { label: 'Past due', value: 'past_due' },
        { label: 'Unpaid', value: 'unpaid' },
        { label: 'Canceled', value: 'canceled' },
        { label: 'Incomplete expired', value: 'incomplete_expired' },
      ],
    },
    { name: 'interval', type: 'text', defaultValue: 'month', label: 'Interval' },
    { name: 'monthlyCredits', type: 'number', defaultValue: 0, label: 'Credits per period' },
    { name: 'currentPeriodStart', type: 'date', label: 'Current period start' },
    { name: 'currentPeriodEnd', type: 'date', label: 'Current period end' },
    { name: 'cancelAtPeriodEnd', type: 'checkbox', defaultValue: false, label: 'Cancel at period end' },
    { name: 'lastGrantedPeriodKey', type: 'text', label: 'Last granted period key' },
    { name: 'lastCheckoutSessionId', type: 'text', label: 'Last checkout session ID' },
    { name: 'metadata', type: 'json', label: 'Stripe payload' },
  ],
}
