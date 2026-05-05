import type { CollectionConfig } from 'payload'

import { isAdmin, ownerOrStaff } from '@/access'
import { adminLabelsKey, adminTextKey } from '@/lib/adminText'

export const ShopifyPayments: CollectionConfig = {
  slug: 'shopify-payments',
  labels: adminLabelsKey('collections.payments'),
  admin: {
    description: adminTextKey('collections.payments.description'),
    group: adminTextKey('groups.commerce'),
    useAsTitle: 'checkoutReference',
    defaultColumns: ['checkoutReference', 'user', 'paymentType', 'status', 'amount'],
  },
  access: {
    create: isAdmin,
    read: ownerOrStaff('user'),
    update: isAdmin,
  },
  defaultSort: '-createdAt',
  timestamps: true,
  fields: [
    { name: 'checkoutReference', type: 'text', required: true, unique: true, label: 'Payment reference' },
    { name: 'user', type: 'relationship', relationTo: 'users', required: true, label: 'User' },
    {
      name: 'paymentType',
      type: 'select',
      required: true,
      label: 'Payment type',
      options: [
        { label: 'Credit top-up', value: 'credit-topup' },
        { label: 'Print order', value: 'print-order' },
      ],
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'pending',
      label: 'Status',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Paid', value: 'paid' },
        { label: 'Failed', value: 'failed' },
        { label: 'Refunded', value: 'refunded' },
      ],
    },
    {
      name: 'shopifyOrderId',
      type: 'text',
      label: 'Payment order ID (legacy field)',
      admin: {
        description: 'The legacy shopifyOrderId field can store the Stripe or Shopify order reference.',
      },
    },
    {
      name: 'shopifyCheckoutId',
      type: 'text',
      index: true,
      label: 'Checkout session ID (legacy field)',
      admin: {
        description: 'The legacy shopifyCheckoutId field also stores the current Stripe Checkout Session ID.',
      },
    },
    { name: 'creditsGranted', type: 'number', defaultValue: 0, label: 'Credits granted' },
    { name: 'linkedOrder', type: 'relationship', relationTo: 'print-orders', label: 'Linked order' },
    { name: 'amount', type: 'number', required: true, defaultValue: 0, label: 'Amount' },
    { name: 'currency', type: 'text', defaultValue: 'USD', label: 'Currency' },
    { name: 'rawWebhookPayload', type: 'json', label: 'Raw webhook payload' },
  ],
}
