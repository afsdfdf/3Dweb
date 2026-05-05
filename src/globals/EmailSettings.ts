import type { GlobalConfig } from 'payload'

import { isAdmin, isStaff } from '@/access'
import { adminTextKey } from '@/lib/adminText'

export const EmailSettings: GlobalConfig = {
  slug: 'email-settings',
  label: adminTextKey('globals.emailSettings.label'),
  admin: {
    description: adminTextKey('globals.emailSettings.description'),
    group: adminTextKey('groups.platform'),
  },
  access: {
    read: isStaff,
    update: isAdmin,
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Sender information',
          fields: [
            {
              name: 'sender',
              type: 'group',
              label: 'Sender information',
              fields: [
                { name: 'fromName', type: 'text', defaultValue: 'Thorns Tavern', label: 'Sender name' },
                { name: 'fromAddress', type: 'email', defaultValue: 'no-reply@thornstavern.com', label: 'Sender email' },
                { name: 'replyTo', type: 'email', label: 'Reply-to address' },
                {
                  name: 'smtpNotice',
                  type: 'ui',
                  admin: {
                    components: {
                      Field: '/components/admin/EmailSettingsNotice',
                    },
                  },
                },
              ],
            },
            {
              name: 'branding',
              type: 'group',
              label: 'Brand display',
              fields: [
                { name: 'productName', type: 'text', defaultValue: 'Thorns Tavern', label: 'Product name' },
                { name: 'footerText', type: 'text', defaultValue: 'Thorns Tavern', label: 'Email footer text' },
              ],
            },
          ],
        },
        {
          label: 'Authentication emails',
          fields: [
            {
              name: 'templates',
              type: 'group',
              label: 'Authentication email copy',
              fields: [
                {
                  name: 'welcome',
                  type: 'group',
                  label: 'Welcome email',
                  fields: [
                    { name: 'subject', type: 'text', defaultValue: 'Welcome to Thorns Tavern', label: 'Subject' },
                    {
                      name: 'intro',
                      type: 'textarea',
                      defaultValue:
                        'Your account is ready. You can now use generation, models, subscriptions, and orders in Thorns Tavern.',
                      label: 'Body copy',
                    },
                    { name: 'ctaLabel', type: 'text', defaultValue: 'Open Studio', label: 'Button label' },
                  ],
                },
                {
                  name: 'verify',
                  type: 'group',
                  label: 'Email verification',
                  fields: [
                    { name: 'subject', type: 'text', defaultValue: 'Verify your Thorns Tavern email', label: 'Subject' },
                    {
                      name: 'intro',
                      type: 'textarea',
                      defaultValue: 'Use the button below to verify your email and continue using Thorns Tavern.',
                      label: 'Body copy',
                    },
                    { name: 'ctaLabel', type: 'text', defaultValue: 'Verify email', label: 'Button label' },
                  ],
                },
                {
                  name: 'forgotPassword',
                  type: 'group',
                  label: 'Password reset',
                  fields: [
                    { name: 'subject', type: 'text', defaultValue: 'Reset your Thorns Tavern password', label: 'Subject' },
                    {
                      name: 'intro',
                      type: 'textarea',
                      defaultValue:
                        'We received a request to reset your password. Use the button below to choose a new password.',
                      label: 'Body copy',
                    },
                    { name: 'ctaLabel', type: 'text', defaultValue: 'Reset password', label: 'Button label' },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: 'Business notifications',
          fields: [
            {
              name: 'businessTemplates',
              type: 'group',
              label: 'Business email copy',
              fields: [
                {
                  name: 'subscriptionSuccess',
                  type: 'group',
                  label: 'Subscription success',
                  fields: [
                    { name: 'subject', type: 'text', defaultValue: 'Thorns Tavern subscription activated', label: 'Subject' },
                    {
                      name: 'intro',
                      type: 'textarea',
                      defaultValue: 'Your subscription is active and credits have been granted for the current billing period.',
                      label: 'Body copy',
                    },
                    { name: 'ctaLabel', type: 'text', defaultValue: 'View credits and subscription', label: 'Button label' },
                  ],
                },
                {
                  name: 'orderPaid',
                  type: 'group',
                  label: 'Order payment success',
                  fields: [
                    { name: 'subject', type: 'text', defaultValue: 'Thorns Tavern order payment received', label: 'Subject' },
                    {
                      name: 'intro',
                      type: 'textarea',
                      defaultValue: 'Your print order has been paid and is now ready for the next handling step.',
                      label: 'Body copy',
                    },
                    { name: 'ctaLabel', type: 'text', defaultValue: 'View order details', label: 'Button label' },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}
