import type { CollectionBeforeChangeHook, CollectionConfig } from 'payload'

import { isAdmin, isStaff, ownerOrStaff } from '@/access'
import { adminLabelsKey, adminTextKey } from '@/lib/adminText'

// Financial / identity fields must not change once an order has left the
// pending-payment state. Staff can still progress status, tracking, and notes,
// but the billed amount, model, owner, and credits used are frozen so a paid
// order's terms cannot be rewritten after the fact.
const FROZEN_FIELDS_AFTER_PAYMENT = ['amount', 'currency', 'creditsUsed', 'model', 'user'] as const

const freezeFinancialFieldsAfterPayment: CollectionBeforeChangeHook = ({ data, operation, originalDoc }) => {
  if (operation !== 'update' || !originalDoc) {
    return data
  }

  if (String(originalDoc.status) === 'pending-payment') {
    return data
  }

  const next = { ...data }
  for (const field of FROZEN_FIELDS_AFTER_PAYMENT) {
    if (field in next && String(next[field]) !== String(originalDoc[field])) {
      next[field] = originalDoc[field]
    }
  }

  return next
}

export const PrintOrders: CollectionConfig = {
  slug: 'print-orders',
  labels: adminLabelsKey('collections.printOrders'),
  admin: {
    description: adminTextKey('collections.printOrders.description'),
    group: adminTextKey('groups.commerce'),
    useAsTitle: 'orderNumber',
    defaultColumns: ['orderNumber', 'user', 'status', 'paymentStatus', 'amount', 'updatedAt'],
  },
  access: {
    create: isStaff,
    delete: isAdmin,
    read: ownerOrStaff('user'),
    update: isStaff,
  },
  hooks: {
    beforeChange: [freezeFinancialFieldsAfterPayment],
  },
  defaultSort: '-createdAt',
  timestamps: true,
  fields: [
    { name: 'orderNumber', type: 'text', required: true, unique: true, label: 'Order number' },
    { name: 'user', type: 'relationship', relationTo: 'users', required: true, label: 'User' },
    { name: 'model', type: 'relationship', relationTo: 'models', required: true, label: 'Model' },
    { name: 'sourceTask', type: 'relationship', relationTo: 'generation-tasks', label: 'Source task' },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending-payment',
      label: 'Status',
      options: [
        { label: 'Pending payment', value: 'pending-payment' },
        { label: 'Paid', value: 'paid' },
        { label: 'In production', value: 'in-production' },
        { label: 'Shipped', value: 'shipped' },
        { label: 'Completed', value: 'completed' },
        { label: 'Cancelled', value: 'cancelled' },
      ],
    },
    {
      name: 'paymentStatus',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      label: 'Payment status',
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
      label: 'Payment order reference (legacy field)',
      admin: {
        description: 'The legacy shopifyOrderId field stores the active payment rail order or session reference.',
      },
    },
    { name: 'amount', type: 'number', required: true, defaultValue: 0, label: 'Amount' },
    { name: 'currency', type: 'text', defaultValue: 'USD', label: 'Currency' },
    { name: 'creditsUsed', type: 'number', defaultValue: 0, label: 'Credits used' },
    { name: 'sizeOption', type: 'text', label: 'Size option' },
    { name: 'materialOption', type: 'text', label: 'Material option' },
    { name: 'shippingName', type: 'text', label: 'Shipping name' },
    { name: 'shippingPhone', type: 'text', label: 'Shipping phone' },
    { name: 'shippingAddress', type: 'textarea', label: 'Shipping address' },
    { name: 'trackingNumber', type: 'text', label: 'Tracking number' },
    {
      name: 'shopifyCheckoutUrl',
      type: 'text',
      label: 'Checkout URL (legacy field)',
      admin: {
        description: 'The legacy shopifyCheckoutUrl field also stores the current Stripe Checkout URL.',
      },
    },
    { name: 'internalNotes', type: 'textarea', label: 'Internal notes' },
  ],
}
