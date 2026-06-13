import type { Access, CollectionConfig, FieldAccess, Where } from 'payload'

import { isStaff } from '@/access'
import { adminLabelsKey, adminTextKey } from '@/lib/adminText'

const hasStaffRole = (role?: null | string) => role === 'admin' || role === 'operator'

// Guests and customers may only see active credit top-up packages through the
// public storefront. Staff retain full visibility (inactive products, print
// packages, etc.). This keeps unlisted/inactive products and the commerce
// catalog from leaking through the public REST endpoint.
const readCreditProducts: Access = (args) => {
  if (isStaff(args)) {
    return true
  }

  const where: Where = {
    and: [{ productType: { equals: 'credit-topup' } }, { isActive: { equals: true } }],
  }

  return where
}

// Commerce identifiers are operator-only and should never reach the public REST response.
const staffOnlyField: FieldAccess = ({ req }) => hasStaffRole(req.user?.role)

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
    read: readCreditProducts,
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
    {
      name: 'shopifyProductId',
      type: 'text',
      label: 'Shopify product ID',
      access: { read: staffOnlyField },
    },
    {
      name: 'shopifyVariantId',
      type: 'text',
      label: 'Shopify variant ID',
      access: { read: staffOnlyField },
    },
    { name: 'isFeatured', type: 'checkbox', defaultValue: false, label: 'Featured' },
    { name: 'isActive', type: 'checkbox', defaultValue: true, label: 'Active' },
    { name: 'sortOrder', type: 'number', defaultValue: 0, label: 'Sort order' },
  ],
}
