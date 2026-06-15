import type { Access, CollectionBeforeOperationHook, CollectionBeforeValidateHook, CollectionConfig } from 'payload'

import { canAccessAdmin, isAdmin, isSelfOrStaff } from '@/access'
import { createDefaultCreditAccount } from '@/hooks/createDefaultCreditAccount'
import { sendWelcomeEmail } from '@/hooks/sendWelcomeEmail'
import { adminLabelsKey, adminTextKey } from '@/lib/adminText'
import { registrationPrivacyMessage } from '@/lib/registrationPrivacy'
import {
  generateForgotPasswordEmailHTML,
  generateForgotPasswordEmailSubject,
  generateVerifyEmailHTML,
  generateVerifyEmailSubject,
} from '@/lib/emailTemplates'

const staffFieldAccess = ({ req }: { req: { user?: { role?: string | null } | null } }) => {
  return Boolean(req.user?.role === 'admin' || req.user?.role === 'operator')
}

const adminFieldAccess = ({ req }: { req: { user?: { role?: string | null } | null } }) => {
  return Boolean(req.user?.role === 'admin')
}

const isFirstRegisterRequest = (req: { url?: string | null }) => {
  if (!req.url) return false

  try {
    return new URL(req.url).pathname.endsWith('/api/users/first-register')
  } catch {
    return String(req.url).includes('/api/users/first-register')
  }
}

const usersUpdateAccess: Access = ({ data, req }) => {
  if (isFirstRegisterRequest(req) && !req.user && data && Object.keys(data).every((key) => key === '_verified')) {
    return true
  }

  return isSelfOrStaff({ data, req })
}

const assignFirstUserAdminRole: CollectionBeforeValidateHook = async ({ data, operation, req }) => {
  if (operation === 'create' && isFirstRegisterRequest(req)) {
    // Only the genuine bootstrap case (empty users table) may self-assign admin.
    // Because this beforeValidate hook bypasses the role field's access control,
    // without the zero-user guard any create routed through /api/users/first-register
    // could escalate to admin. Subsequent first-register creates are forced to customer.
    const { totalDocs } = await req.payload.count({ collection: 'users', req })

    return {
      ...(data || {}),
      role: totalDocs === 0 ? 'admin' : 'customer',
    }
  }

  return data
}

const skipFirstRegisterVerificationEmail: CollectionBeforeOperationHook<'users'> = ({ args, operation, req }) => {
  if (operation === 'create' && isFirstRegisterRequest(req)) {
    return {
      ...args,
      disableVerificationEmail: true,
    }
  }

  return args
}

const validateDisplayName = (value: null | string | undefined) => {
  if (!value) return true

  const trimmed = value.trim()
  if (trimmed.length < 4 || trimmed.length > 32) {
    return 'Display name must be between 4 and 32 characters.'
  }

  if (!/^[a-zA-Z0-9-]+$/.test(trimmed)) {
    return 'Display name can contain only letters, numbers, and hyphens.'
  }

  return true
}

export const Users: CollectionConfig = {
  slug: 'users',
  labels: adminLabelsKey('collections.users'),
  admin: {
    description: adminTextKey('collections.users.description'),
    group: adminTextKey('groups.platform'),
    useAsTitle: 'email',
    defaultColumns: ['email', 'displayName', 'fullName', 'role', 'creditsBalance', 'createdAt'],
  },
  auth: {
    forgotPassword: {
      generateEmailHTML: generateForgotPasswordEmailHTML,
      generateEmailSubject: generateForgotPasswordEmailSubject,
    },
    lockTime: 15 * 60 * 1000,
    maxLoginAttempts: 5,
    verify: {
      generateEmailHTML: generateVerifyEmailHTML,
      generateEmailSubject: generateVerifyEmailSubject,
    },
  },
  access: {
    admin: canAccessAdmin,
    create: staffFieldAccess,
    delete: isAdmin,
    read: isSelfOrStaff,
    update: usersUpdateAccess,
  },
  hooks: {
    beforeOperation: [skipFirstRegisterVerificationEmail],
    beforeValidate: [assignFirstUserAdminRole],
    afterOperation: [
      ({ operation, result, req }) => {
        if (operation === 'create' && req.method === 'POST' && !req.user) {
          const msg = String(result?.message || result?.errors?.[0]?.message || '')
          const lower = msg.toLowerCase()
          if (lower.includes('exist') || lower.includes('duplicate') || lower.includes('already')) {
            return {
              ...result,
              errors: [{ message: registrationPrivacyMessage }],
              message: registrationPrivacyMessage,
            }
          }
        }
        return result
      },
    ],
    afterChange: [createDefaultCreditAccount, sendWelcomeEmail],
  },
  timestamps: true,
  fields: [
    { name: 'fullName', type: 'text', label: 'Full name', maxLength: 100 },
    {
      name: 'displayName',
      type: 'text',
      label: 'Display name',
      index: true,
      validate: validateDisplayName,
    },
    {
      name: 'bio',
      type: 'textarea',
      label: 'Bio',
      maxLength: 500,
      validate: (value: null | string | undefined) => {
        if (value && value.length > 500) {
          return 'Bio must be 500 characters or fewer.'
        }
        return true
      },
      admin: {
        description: 'Short public profile introduction for creator pages and model detail sidebars.',
      },
    },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'customer',
      label: 'Role',
      // RBAC across Local API, custom endpoints, and Payload access checks all read
      // req.user.role. Persist it in the JWT so the role is always present on the
      // authenticated user payload regardless of how the session is resolved.
      saveToJWT: true,
      access: {
        create: adminFieldAccess,
        update: adminFieldAccess,
      },
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Operator', value: 'operator' },
        { label: 'Customer', value: 'customer' },
      ],
    },
    { name: 'avatar', type: 'upload', relationTo: 'media', label: 'Avatar' },
    {
      name: 'profileBackground',
      type: 'upload',
      relationTo: 'media',
      label: 'Profile banner',
      admin: {
        description: 'Creator profile banner shown on account and model detail surfaces. Field name is kept for compatibility.',
      },
    },
    {
      name: 'profileBannerFocalX',
      type: 'number',
      defaultValue: 50,
      label: 'Profile banner focal X',
      admin: {
        description: 'Horizontal focal point percentage for banner cropping.',
      },
    },
    {
      name: 'profileBannerFocalY',
      type: 'number',
      defaultValue: 50,
      label: 'Profile banner focal Y',
      admin: {
        description: 'Vertical focal point percentage for banner cropping.',
      },
    },
    {
      name: 'avatarFrame',
      type: 'select',
      defaultValue: 'none',
      label: 'Avatar frame',
      admin: {
        description: 'Compatibility frame key. Rich frame metadata is managed in Avatar Frame Styles.',
      },
      options: [
        { label: 'None', value: 'none' },
        { label: 'Ember', value: 'ember' },
        { label: 'Kick', value: 'kick' },
        { label: 'Emerald', value: 'emerald' },
      ],
    },
    {
      name: 'profileVisibility',
      type: 'select',
      defaultValue: 'private',
      label: 'Profile visibility',
      options: [
        { label: 'Private', value: 'private' },
        { label: 'Public', value: 'public' },
      ],
    },
    { name: 'phone', type: 'text', label: 'Phone', maxLength: 32 },
    {
      name: 'shopifyCustomerId',
      type: 'text',
      label: 'Shopify customer ID',
      access: {
        update: staffFieldAccess,
      },
      admin: { position: 'sidebar' },
    },
    {
      name: 'stripeCustomerId',
      type: 'text',
      index: true,
      label: 'Stripe customer ID',
      access: {
        update: staffFieldAccess,
      },
      admin: { position: 'sidebar' },
    },
    {
      name: 'creditsBalance',
      type: 'number',
      defaultValue: 0,
      label: 'Credits balance',
      access: {
        create: adminFieldAccess,
        update: adminFieldAccess,
      },
      admin: { position: 'sidebar', readOnly: true },
    },
    {
      name: 'profileViewCount',
      type: 'number',
      defaultValue: 0,
      label: 'Profile view count',
      access: {
        create: adminFieldAccess,
        update: adminFieldAccess,
      },
      admin: { position: 'sidebar', readOnly: true },
    },
    {
      name: 'followersCount',
      type: 'number',
      defaultValue: 0,
      label: 'Followers count',
      access: {
        create: adminFieldAccess,
        update: adminFieldAccess,
      },
      admin: { position: 'sidebar', readOnly: true },
    },
    {
      name: 'followingCount',
      type: 'number',
      defaultValue: 0,
      label: 'Following count',
      access: {
        create: adminFieldAccess,
        update: adminFieldAccess,
      },
      admin: { position: 'sidebar', readOnly: true },
    },
    {
      name: 'lastActiveAt',
      type: 'date',
      label: 'Last active at',
      access: {
        create: staffFieldAccess,
        update: staffFieldAccess,
      },
      admin: { position: 'sidebar' },
    },
  ],
}
