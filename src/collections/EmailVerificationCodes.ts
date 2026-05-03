import type { CollectionConfig } from 'payload'

import { canAccessAdmin, isAdmin, isStaff } from '@/access'

export const EmailVerificationCodes: CollectionConfig = {
  slug: 'email-verification-codes',
  labels: {
    plural: 'Email Verification Codes',
    singular: 'Email Verification Code',
  },
  admin: {
    group: 'Platform',
    useAsTitle: 'email',
    defaultColumns: ['email', 'purpose', 'expiresAt', 'consumedAt', 'attempts', 'createdAt'],
    description: 'Short-lived hashed verification codes for registration and account security flows.',
  },
  access: {
    admin: canAccessAdmin,
    create: isAdmin,
    delete: isAdmin,
    read: isStaff,
    update: isAdmin,
  },
  timestamps: true,
  fields: [
    {
      name: 'email',
      type: 'email',
      required: true,
      index: true,
    },
    {
      name: 'purpose',
      type: 'select',
      required: true,
      defaultValue: 'register',
      index: true,
      options: [
        {
          label: 'Register',
          value: 'register',
        },
      ],
    },
    {
      name: 'codeHash',
      type: 'text',
      required: true,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'expiresAt',
      type: 'date',
      required: true,
      index: true,
    },
    {
      name: 'consumedAt',
      type: 'date',
      index: true,
    },
    {
      name: 'attempts',
      type: 'number',
      required: true,
      defaultValue: 0,
      min: 0,
      admin: {
        readOnly: true,
      },
    },
  ],
}
