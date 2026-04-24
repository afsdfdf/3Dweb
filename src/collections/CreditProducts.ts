import type { CollectionConfig } from 'payload'

import { isStaff } from '@/access'
import { adminLabelsKey, adminTextKey } from '@/lib/adminText'

export const CreditProducts: CollectionConfig = {
  slug: 'credit-products',
  labels: adminLabelsKey('collections.creditProducts'),
  admin: {
    defaultColumns: ['title', 'productType', 'credits', 'price', 'isActive', 'isFeatured'],
    group: adminTextKey('groups.commerce'),
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
    { name: 'title', type: 'text', required: true, label: 'Title' },
    { name: 'slug', type: 'text', required: true, unique: true, label: 'Slug' },
    {
      name: 'productType',
      type: 'select',
      defaultValue: 'credit-topup',
      label: 'Product type',
      options: [
        { label: 'Credit top-up', value: 'credit-topup' },
        { label: 'Print package', value: 'print-package' },
      ],
    },
    { name: 'description', type: 'textarea', label: 'Description' },
    { name: 'credits', type: 'number', defaultValue: 0, label: 'Credits' },
    { name: 'price', type: 'number', required: true, label: 'Price' },
    { name: 'currency', type: 'text', defaultValue: 'USD', label: 'Currency' },
    { name: 'shopifyProductId', type: 'text', label: 'Shopify product ID' },
    { name: 'shopifyVariantId', type: 'text', label: 'Shopify variant ID' },
    { name: 'isFeatured', type: 'checkbox', defaultValue: false, label: 'Featured' },
    { name: 'isActive', type: 'checkbox', defaultValue: true, label: 'Active' },
    { name: 'sortOrder', type: 'number', defaultValue: 0, label: 'Sort order' },
  ],
}
