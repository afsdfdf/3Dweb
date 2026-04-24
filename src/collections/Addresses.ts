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
      label: '用户',
    },
    {
      name: 'label',
      type: 'text',
      label: '地址标签',
    },
    {
      name: 'recipientName',
      type: 'text',
      required: true,
      label: '收件人',
    },
    {
      name: 'phone',
      type: 'text',
      label: '电话',
    },
    {
      name: 'country',
      type: 'text',
      required: true,
      defaultValue: 'China',
      label: '国家',
    },
    {
      name: 'province',
      type: 'text',
      label: '省州',
    },
    {
      name: 'city',
      type: 'text',
      required: true,
      label: '城市',
    },
    {
      name: 'district',
      type: 'text',
      label: '区县',
    },
    {
      name: 'postalCode',
      type: 'text',
      label: '邮编',
    },
    {
      name: 'addressLine1',
      type: 'text',
      required: true,
      label: '地址 1',
    },
    {
      name: 'addressLine2',
      type: 'text',
      label: '地址 2',
    },
    {
      name: 'isDefault',
      type: 'checkbox',
      defaultValue: false,
      label: '默认地址',
    },
  ],
}
