import type { CollectionConfig } from 'payload'

import { ownerOrStaff } from '@/access'
import { assignCurrentUser } from '@/hooks/assignCurrentUser'
import { adminLabelsKey, adminTextKey } from '@/lib/adminText'

export const Addresses: CollectionConfig = {
  slug: 'addresses',
  labels: adminLabelsKey('collections.addresses'),
  admin: {
    defaultColumns: ['recipientName', 'user', 'city', 'country', 'isDefault'],
    group: adminTextKey('groups.commerce'),
    useAsTitle: 'recipientName',
  },
  access: {
    create: ({ req }) => Boolean(req.user),
    delete: ownerOrStaff('user'),
    read: ownerOrStaff('user'),
    update: ownerOrStaff('user'),
  },
  defaultSort: '-updatedAt',
  hooks: {
    beforeChange: [assignCurrentUser('user')],
  },
  timestamps: true,
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      label: 'User',
    },
    {
      name: 'label',
      type: 'text',
      label: 'Address label',
    },
    {
      name: 'recipientName',
      type: 'text',
      required: true,
      label: 'Recipient name',
    },
    {
      name: 'phone',
      type: 'text',
      label: 'Phone',
    },
    {
      name: 'country',
      type: 'text',
      required: true,
      defaultValue: 'China',
      label: 'Country',
    },
    {
      name: 'province',
      type: 'text',
      label: 'Province / state',
    },
    {
      name: 'city',
      type: 'text',
      required: true,
      label: 'City',
    },
    {
      name: 'district',
      type: 'text',
      label: 'District',
    },
    {
      name: 'postalCode',
      type: 'text',
      label: 'Postal code',
    },
    {
      name: 'addressLine1',
      type: 'text',
      required: true,
      label: 'Address line 1',
    },
    {
      name: 'addressLine2',
      type: 'text',
      label: 'Address line 2',
    },
    {
      name: 'isDefault',
      type: 'checkbox',
      defaultValue: false,
      label: 'Default address',
    },
  ],
}
