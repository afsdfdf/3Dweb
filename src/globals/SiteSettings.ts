import type { GlobalConfig } from 'payload'

import { defaultSiteSettings } from '@/app/(frontend)/_lib/marketing-content'
import { isAdmin, isStaff } from '@/access'
import { adminTextKey } from '@/lib/adminText'
import { buildGuestReadableMediaWhere } from '@/lib/mediaVisibility'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: adminTextKey('globals.siteSettings.label'),
  admin: {
    description: adminTextKey('globals.siteSettings.description'),
    group: adminTextKey('groups.platform'),
  },
  access: {
    read: isStaff,
    update: isAdmin,
  },
  fields: [
    {
      name: 'settingsOverview',
      type: 'ui',
      admin: {
        position: 'sidebar',
        components: {
          Field: '/components/admin/EmailSettingsNotice',
        },
      },
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Site basics',
          fields: [
            { name: 'siteName', type: 'text', required: true, defaultValue: defaultSiteSettings.siteName, label: 'Site name' },
            { name: 'siteDescription', type: 'textarea', defaultValue: defaultSiteSettings.siteDescription, label: 'Site description' },
            { name: 'supportEmail', type: 'email', defaultValue: defaultSiteSettings.supportEmail, label: 'Support email' },
            { name: 'announcement', type: 'textarea', defaultValue: defaultSiteSettings.announcement, label: 'Announcement' },
            {
              name: 'headerNav',
              type: 'array',
              label: 'Header navigation',
              fields: [
                { name: 'label', type: 'text', required: true, label: 'Label' },
                { name: 'href', type: 'text', required: true, label: 'Link' },
              ],
              defaultValue: defaultSiteSettings.headerNav,
            },
            {
              name: 'footer',
              type: 'group',
              label: 'Footer',
              fields: [
                {
                  name: 'brandLogo',
                  type: 'upload',
                  relationTo: 'media',
                  label: 'Footer logo image',
                  filterOptions: buildGuestReadableMediaWhere(),
                  admin: {
                    description: 'Optional replacement for the public footer wordmark. Use guest-readable media so anonymous visitors can see it.',
                  },
                },
                {
                  name: 'brandLogoAlt',
                  type: 'text',
                  defaultValue: defaultSiteSettings.footer.brandLogoAlt || 'Thorns Tavern',
                  label: 'Footer logo alt text',
                },
                {
                  name: 'brandSummary',
                  type: 'textarea',
                  defaultValue:
                    defaultSiteSettings.footer.brandSummary ||
                    'An AI 3D product platform for character creation, asset management, and print fulfillment.',
                  label: 'Footer brand summary',
                },
                { name: 'aboutEyebrow', type: 'text', defaultValue: defaultSiteSettings.footer.aboutEyebrow, label: 'About eyebrow', admin: { condition: () => false } },
                { name: 'aboutTitle', type: 'text', defaultValue: defaultSiteSettings.footer.aboutTitle, label: 'About title', admin: { condition: () => false } },
                { name: 'aboutText', type: 'textarea', defaultValue: defaultSiteSettings.footer.aboutText, label: 'About text', admin: { condition: () => false } },
                { name: 'directionEyebrow', type: 'text', defaultValue: defaultSiteSettings.footer.directionEyebrow, label: 'Direction eyebrow', admin: { condition: () => false } },
                { name: 'directionTitle', type: 'text', defaultValue: defaultSiteSettings.footer.directionTitle, label: 'Direction title', admin: { condition: () => false } },
                { name: 'directionText', type: 'textarea', defaultValue: defaultSiteSettings.footer.directionText, label: 'Direction text', admin: { condition: () => false } },
                {
                  name: 'linkGroups',
                  type: 'array',
                  defaultValue: defaultSiteSettings.footer.linkGroups || [],
                  label: 'Footer link groups',
                  labels: {
                    plural: 'Footer link groups',
                    singular: 'Footer link group',
                  },
                  fields: [
                    { name: 'title', type: 'text', required: true, label: 'Group title' },
                    { name: 'ariaLabel', type: 'text', label: 'Accessibility label' },
                    { name: 'helperText', type: 'textarea', label: 'Helper text' },
                    {
                      name: 'links',
                      type: 'array',
                      label: 'Links',
                      labels: {
                        plural: 'Links',
                        singular: 'Link',
                      },
                      fields: [
                        { name: 'label', type: 'text', required: true, label: 'Label' },
                        { name: 'href', type: 'text', required: true, label: 'Link' },
                      ],
                    },
                  ],
                },
                {
                  name: 'footerPreview',
                  type: 'ui',
                  admin: {
                    components: {
                      Field: '/components/admin/FooterPreview',
                    },
                  },
                },
              ],
            },
          ],
        },
        {
          label: 'Pricing and credits',
          fields: [
            {
              name: 'paymentProviders',
              type: 'group',
              label: 'Payment rails',
              fields: [
                {
                  name: 'subscriptionProvider',
                  type: 'select',
                  defaultValue: 'stripe',
                  label: 'Subscription provider',
                  options: [
                    { label: 'Stripe (active)', value: 'stripe' },
                    { label: 'Shopify (reserved)', value: 'shopify' },
                  ],
                },
                {
                  name: 'orderProvider',
                  type: 'select',
                  defaultValue: 'stripe',
                  label: 'Order provider',
                  options: [
                    { label: 'Stripe (active)', value: 'stripe' },
                    { label: 'Shopify (reserved)', value: 'shopify' },
                  ],
                },
                {
                  name: 'providerNotice',
                  type: 'textarea',
                  defaultValue:
                    'Stripe is the active rail for subscriptions and order payments. Shopify-compatible data structures remain in place for future commerce expansion.',
                  label: 'Provider note',
                },
              ],
            },
            {
              name: 'subscriptionPlans',
              type: 'group',
              label: 'Subscription plans',
              fields: [
                {
                  name: 'starter',
                  type: 'group',
                  label: 'Starter',
                  fields: [
                    { name: 'name', type: 'text', defaultValue: 'Starter', label: 'Plan name' },
                    { name: 'shortLabel', type: 'text', defaultValue: 'Starter plan', label: 'Short label' },
                    { name: 'monthlyPrice', type: 'number', defaultValue: 19, label: 'Monthly price (USD)' },
                    { name: 'creditsPerMonth', type: 'number', defaultValue: 240, label: 'Credits per month' },
                    {
                      name: 'description',
                      type: 'textarea',
                      defaultValue: 'Designed for individual creators who need steady character generation, fast downloads, and lightweight sampling.',
                      label: 'Description',
                    },
                    {
                      name: 'features',
                      type: 'array',
                      label: 'Features',
                      fields: [{ name: 'label', type: 'text', required: true, label: 'Label' }],
                      defaultValue: [
                        { label: '240 credits per month' },
                        { label: 'Supports image, text, and hybrid generation' },
                        { label: 'Standard model downloads and result archiving' },
                      ],
                    },
                  ],
                },
                {
                  name: 'pro',
                  type: 'group',
                  label: 'Pro',
                  fields: [
                    { name: 'name', type: 'text', defaultValue: 'Pro', label: 'Plan name' },
                    { name: 'shortLabel', type: 'text', defaultValue: 'Pro plan', label: 'Short label' },
                    { name: 'monthlyPrice', type: 'number', defaultValue: 49, label: 'Monthly price (USD)' },
                    { name: 'creditsPerMonth', type: 'number', defaultValue: 760, label: 'Credits per month' },
                    {
                      name: 'description',
                      type: 'textarea',
                      defaultValue: 'Designed for high-frequency creation, repeated iteration, and smaller teams that need more stable output capacity.',
                      label: 'Description',
                    },
                    {
                      name: 'features',
                      type: 'array',
                      label: 'Features',
                      fields: [{ name: 'label', type: 'text', required: true, label: 'Label' }],
                      defaultValue: [
                        { label: '760 credits per month' },
                        { label: 'Better suited to frequent character iteration' },
                        { label: 'Supports generation, downloads, and sampling workflows' },
                      ],
                    },
                  ],
                },
                {
                  name: 'studio',
                  type: 'group',
                  label: 'Studio',
                  fields: [
                    { name: 'name', type: 'text', defaultValue: 'Studio', label: 'Plan name' },
                    { name: 'shortLabel', type: 'text', defaultValue: 'Studio plan', label: 'Short label' },
                    { name: 'monthlyPrice', type: 'number', defaultValue: 99, label: 'Monthly price (USD)' },
                    { name: 'creditsPerMonth', type: 'number', defaultValue: 1680, label: 'Credits per month' },
                    {
                      name: 'description',
                      type: 'textarea',
                      defaultValue: 'Designed for teams that need generation, asset retention, and physical sampling in one operating rhythm.',
                      label: 'Description',
                    },
                    {
                      name: 'features',
                      type: 'array',
                      label: 'Features',
                      fields: [{ name: 'label', type: 'text', required: true, label: 'Label' }],
                      defaultValue: [
                        { label: '1680 credits per month' },
                        { label: 'Built for stable commercial throughput' },
                        { label: 'Supports continuous generation, downloads, and print fulfillment' },
                      ],
                    },
                  ],
                },
              ],
            },
            {
              name: 'generationPricing',
              type: 'group',
              label: 'Generation pricing',
              fields: [
                { name: 'imageCredits', type: 'number', defaultValue: defaultSiteSettings.generationPricing.imageCredits, label: 'Image credits' },
                { name: 'textCredits', type: 'number', defaultValue: defaultSiteSettings.generationPricing.textCredits, label: 'Text credits' },
                { name: 'hybridCredits', type: 'number', defaultValue: defaultSiteSettings.generationPricing.hybridCredits, label: 'Hybrid credits' },
                { name: 'downloadCredits', type: 'number', defaultValue: defaultSiteSettings.generationPricing.downloadCredits, label: 'Download credits' },
              ],
            },
            {
              name: 'modelAccessPolicy',
              type: 'group',
              label: 'Model access policy',
              fields: [
                {
                  name: 'chargePreviewCredits',
                  type: 'checkbox',
                  defaultValue: false,
                  label: 'Charge preview credits',
                  admin: {
                    description: 'Default off. Keep imported public model previews free until an operator enables charging.',
                  },
                },
                {
                  name: 'previewCredits',
                  type: 'number',
                  defaultValue: 0,
                  label: 'Preview credits',
                },
                {
                  name: 'chargeDownloadCredits',
                  type: 'checkbox',
                  defaultValue: false,
                  label: 'Charge download credits',
                  admin: {
                    description: 'Default off. Download charging must remain server-side and refundable on delivery failure.',
                  },
                },
                {
                  name: 'downloadCredits',
                  type: 'number',
                  defaultValue: defaultSiteSettings.generationPricing.downloadCredits,
                  label: 'Download credits',
                },
              ],
            },
            {
              name: 'creditPackages',
              type: 'array',
              label: 'Credit packages',
              fields: [
                { name: 'title', type: 'text', required: true, label: 'Title' },
                { name: 'shopifyVariantId', type: 'text', label: 'Shopify variant ID' },
                { name: 'credits', type: 'number', required: true, label: 'Credits' },
                { name: 'price', type: 'number', required: true, label: 'Price' },
                { name: 'currency', type: 'text', defaultValue: 'USD', label: 'Currency' },
              ],
              defaultValue: defaultSiteSettings.creditPackages,
            },
          ],
        },
        {
          label: 'Email settings',
          fields: [
            {
              name: 'emailSettings',
              type: 'group',
              label: 'Email settings',
              fields: [
                {
                  name: 'sender',
                  type: 'group',
                  label: 'Sender',
                  fields: [
                    { name: 'fromName', type: 'text', defaultValue: 'Thorns Tavern', label: 'From name' },
                    { name: 'fromAddress', type: 'email', defaultValue: 'no-reply@thornstavern.com', label: 'From address' },
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
                  label: 'Branding',
                  fields: [
                    { name: 'productName', type: 'text', defaultValue: 'Thorns Tavern', label: 'Product name' },
                    { name: 'footerText', type: 'text', defaultValue: 'Thorns Tavern', label: 'Footer text' },
                  ],
                },
                {
                  name: 'templates',
                  type: 'group',
                  label: 'Authentication emails',
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
                          defaultValue: 'Your account is ready. You can now start using Thorns Tavern for generation, model management, subscriptions, and orders.',
                          label: 'Body copy',
                        },
                        { name: 'ctaLabel', type: 'text', defaultValue: 'Open Studio', label: 'CTA label' },
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
                          defaultValue: 'Use the button below to verify your email address before signing in.',
                          label: 'Body copy',
                        },
                        { name: 'ctaLabel', type: 'text', defaultValue: 'Verify email', label: 'CTA label' },
                      ],
                    },
                    {
                      name: 'forgotPassword',
                      type: 'group',
                      label: 'Password reset',
                      fields: [
                        { name: 'subject', type: 'text', defaultValue: 'Thorns Tavern password reset', label: 'Subject' },
                        {
                          name: 'intro',
                          type: 'textarea',
                          defaultValue: 'We received a request to reset your password. Use the button below to continue.',
                          label: 'Body copy',
                        },
                        { name: 'ctaLabel', type: 'text', defaultValue: 'Reset password', label: 'CTA label' },
                      ],
                    },
                  ],
                },
                {
                  name: 'businessTemplates',
                  type: 'group',
                  label: 'Business notifications',
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
                          defaultValue: 'Your subscription is active and credits for the current period have been applied to your account.',
                          label: 'Body copy',
                        },
                        { name: 'ctaLabel', type: 'text', defaultValue: 'View credits and subscription', label: 'CTA label' },
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
                          defaultValue: 'Your print order has been paid successfully and moved into the next processing stage.',
                          label: 'Body copy',
                        },
                        { name: 'ctaLabel', type: 'text', defaultValue: 'View order details', label: 'CTA label' },
                      ],
                    },
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
