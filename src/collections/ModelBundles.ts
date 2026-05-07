import type { Access, CollectionConfig, Where } from 'payload'

import { isStaff } from '@/access'
import { assignCurrentUser } from '@/hooks/assignCurrentUser'
import { fillPublishAtOnPublish } from '@/hooks/fillPublishAtOnPublish'
import { validatePublicBundleCoverImage } from '@/hooks/validatePublicBundleCoverImage'
import { adminLabelsKey, adminTextKey } from '@/lib/adminText'

const publicBundleReadOrStaff: Access = ({ req }) => {
  if (req.user?.role === 'admin' || req.user?.role === 'operator') {
    return true
  }

  const publicVisibilityConditions: Where[] = [
    {
      isVisible: {
        equals: true,
      },
    },
    {
      _status: {
        equals: 'published',
      },
    },
  ]

  return {
    and: publicVisibilityConditions,
  } satisfies Where
}

export const ModelBundles: CollectionConfig = {
  slug: 'model-bundles',
  labels: adminLabelsKey('collections.modelBundles'),
  admin: {
    defaultColumns: ['title', 'bundleType', '_status', 'isVisible', 'isFeatured', 'sortOrder', 'updatedAt'],
    description: adminTextKey('collections.modelBundles.description'),
    group: adminTextKey('groups.content'),
    useAsTitle: 'title',
  },
  access: {
    create: isStaff,
    delete: isStaff,
    read: publicBundleReadOrStaff,
    update: isStaff,
  },
  hooks: {
    beforeChange: [assignCurrentUser('createdBy'), fillPublishAtOnPublish('publishAt'), validatePublicBundleCoverImage],
  },
  defaultSort: ['-isFeatured', 'sortOrder', '-updatedAt'],
  fields: [
    {
      name: 'title',
      type: 'text',
      localized: true,
      required: true,
      label: 'Title',
    },
    {
      name: 'slug',
      type: 'text',
      index: true,
      required: true,
      unique: true,
      label: 'Slug',
    },
    {
      name: 'subtitle',
      type: 'text',
      localized: true,
      label: 'Subtitle',
      admin: {
        description: 'Short product-style line shown near the bundle title.',
      },
    },
    {
      name: 'coverImage',
      type: 'upload',
      relationTo: 'media',
      label: 'Cover image',
    },
    {
      name: 'summary',
      type: 'textarea',
      localized: true,
      label: 'Summary',
    },
    {
      name: 'badgeLabel',
      type: 'text',
      localized: true,
      label: 'Badge label',
      admin: {
        description: 'Optional short label such as Featured, Starter, Event, or New.',
      },
    },
    {
      name: 'bundleType',
      type: 'select',
      defaultValue: 'theme-pack',
      label: 'Bundle type',
      options: [
        { label: 'Starter pack', value: 'starter' },
        { label: 'Theme pack', value: 'theme-pack' },
        { label: 'Character pack', value: 'character-pack' },
        { label: 'Terrain pack', value: 'terrain-pack' },
        { label: 'Event pack', value: 'event-pack' },
        { label: 'Monthly release', value: 'monthly-release' },
        { label: 'Showcase set', value: 'showcase' },
      ],
      admin: {
        description: 'Used for bundle listing filters and homepage merchandising.',
      },
    },
    {
      name: 'tags',
      type: 'array',
      label: 'Tags',
      fields: [
        {
          name: 'label',
          type: 'text',
          localized: true,
          label: 'Tag label',
          required: true,
        },
      ],
    },
    {
      name: 'includedSummary',
      type: 'textarea',
      localized: true,
      label: 'What is included',
      admin: {
        description: 'Operator-written contents summary for the bundle detail page.',
      },
    },
    {
      name: 'technicalSpecs',
      type: 'group',
      label: 'Technical specs',
      fields: [
        {
          name: 'modelCountLabel',
          type: 'text',
          localized: true,
          label: 'Model count label',
          admin: {
            description: 'Optional override such as 8 Models or Starter Set.',
          },
        },
        {
          name: 'supportedFormatsLabel',
          type: 'text',
          localized: true,
          label: 'Supported formats label',
          admin: {
            description: 'Example: GLB, STL, OBJ.',
          },
        },
        {
          name: 'scaleLabel',
          type: 'text',
          localized: true,
          label: 'Scale label',
          admin: {
            description: 'Example: 32mm tabletop scale or Game-ready scale.',
          },
        },
        {
          name: 'assetReadinessLabel',
          type: 'text',
          localized: true,
          label: 'Asset readiness label',
          admin: {
            description: 'Example: Preview ready, GLB ready, Print review required.',
          },
        },
        { name: 'printReady', type: 'checkbox', defaultValue: false, label: 'Print ready' },
        { name: 'textured', type: 'checkbox', defaultValue: false, label: 'Textured' },
        {
          name: 'technicalNotes',
          type: 'textarea',
          localized: true,
          label: 'Technical notes',
        },
      ],
    },
    {
      name: 'license',
      type: 'group',
      label: 'License',
      fields: [
        {
          name: 'type',
          type: 'select',
          defaultValue: 'personal',
          label: 'License type',
          options: [
            { label: 'Personal use', value: 'personal' },
            { label: 'Commercial use', value: 'commercial' },
            { label: 'Editorial use', value: 'editorial' },
            { label: 'Custom terms', value: 'custom' },
          ],
        },
        {
          name: 'summary',
          type: 'textarea',
          localized: true,
          label: 'License summary',
        },
      ],
    },
    {
      name: 'cta',
      type: 'group',
      label: 'Call to action',
      fields: [
        {
          name: 'mode',
          type: 'select',
          defaultValue: 'free',
          label: 'CTA mode',
          options: [
            { label: 'Free / browse', value: 'free' },
            { label: 'Login required', value: 'login-required' },
            { label: 'Paid', value: 'paid' },
            { label: 'Coming soon', value: 'coming-soon' },
          ],
        },
        {
          name: 'primaryLabel',
          type: 'text',
          localized: true,
          label: 'Primary CTA label',
        },
        {
          name: 'secondaryLabel',
          type: 'text',
          localized: true,
          label: 'Secondary CTA label',
        },
        {
          name: 'priceCredits',
          type: 'number',
          defaultValue: 0,
          min: 0,
          label: 'Price credits',
          admin: {
            condition: (_, siblingData) => siblingData?.mode === 'paid',
            description: 'Display-only in the first phase. Purchase enforcement is a later billing task.',
          },
        },
      ],
    },
    {
      name: 'releaseNotes',
      type: 'textarea',
      localized: true,
      label: 'Release notes',
    },
    {
      name: 'models',
      type: 'relationship',
      relationTo: 'models',
      hasMany: true,
      label: 'Included models',
      required: true,
      admin: {
        description: 'Select one or more existing generated models to build a curated bundle.',
      },
    },
    {
      name: 'createdBy',
      type: 'relationship',
      relationTo: 'users',
      label: 'Created by',
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
    },
    {
      name: 'publishAt',
      type: 'date',
      label: 'Publish at',
    },
    {
      name: 'isVisible',
      type: 'checkbox',
      defaultValue: true,
      label: 'Visible publicly',
    },
    {
      name: 'isFeatured',
      type: 'checkbox',
      defaultValue: false,
      label: 'Featured on homepage',
    },
    {
      name: 'sortOrder',
      type: 'number',
      defaultValue: 0,
      label: 'Sort order',
    },
  ],
  timestamps: true,
  versions: {
    drafts: true,
  },
}

