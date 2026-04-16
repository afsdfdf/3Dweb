import type { CollectionConfig } from 'payload'

import { canAccessAdmin, isAdmin, isSelfOrStaff } from '@/access'
import { createDefaultCreditAccount } from '@/hooks/createDefaultCreditAccount'
import { sendWelcomeEmail } from '@/hooks/sendWelcomeEmail'
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

export const Users: CollectionConfig = {
  slug: 'users',
  labels: {
    plural: '用户',
    singular: '用户',
  },
  admin: {
    description: '平台用户、角色、资料与账户总览。',
    group: '平台',
    useAsTitle: 'email',
    defaultColumns: ['email', 'fullName', 'role', 'creditsBalance', 'createdAt'],
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
    // Public signup remains intentionally open because the product supports self-service registration.
    // Abuse protection is enforced by middleware (origin checks + rate limiting), so do not tighten
    // this access rule unless the public registration flow is replaced at the route layer.
    create: () => true,
    delete: isAdmin,
    read: isSelfOrStaff,
    update: isSelfOrStaff,
  },
  hooks: {
    afterOperation: [
      ({ operation, result, req }) => {
        // M-01: 注册反枚举 — 对 create(user) 失败统一返回模糊消息
        if (operation === 'create' && req.method === 'POST' && !req.user) {
          const msg = String(result?.message || result?.errors?.[0]?.message || '')
          const lower = msg.toLowerCase()
          if (
            lower.includes('exist') ||
            lower.includes('duplicate') ||
            lower.includes('已存在') ||
            lower.includes('already')
          ) {
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
    { name: 'fullName', type: 'text', label: '姓名' },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'customer',
      label: '角色',
      access: {
        create: adminFieldAccess,
        update: adminFieldAccess,
      },
      options: [
        { label: '管理员', value: 'admin' },
        { label: '运营', value: 'operator' },
        { label: '用户', value: 'customer' },
      ],
    },
    { name: 'avatar', type: 'upload', relationTo: 'media', label: '头像' },
    { name: 'phone', type: 'text', label: '电话' },
    {
      name: 'shopifyCustomerId',
      type: 'text',
      label: 'Shopify 客户 ID',
      access: {
        update: staffFieldAccess,
      },
      admin: { position: 'sidebar' },
    },
    {
      name: 'stripeCustomerId',
      type: 'text',
      index: true,
      label: 'Stripe Customer ID',
      access: {
        update: staffFieldAccess,
      },
      admin: { position: 'sidebar' },
    },
    {
      name: 'creditsBalance',
      type: 'number',
      defaultValue: 0,
      label: '积分余额',
      access: {
        create: staffFieldAccess,
        update: staffFieldAccess,
      },
      admin: { position: 'sidebar', readOnly: true },
    },
    {
      name: 'lastActiveAt',
      type: 'date',
      label: '最后活跃时间',
      access: {
        create: staffFieldAccess,
        update: staffFieldAccess,
      },
      admin: { position: 'sidebar' },
    },
  ],
}
