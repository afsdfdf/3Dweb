import type { GlobalConfig } from 'payload'

import { isAdmin } from '@/access'

export const StorageSettings: GlobalConfig = {
  slug: 'storage-settings',
  label: 'Storage Settings',
  admin: {
    description:
      'Manage non-sensitive object storage settings here. Keep AWS access key ID and secret access key in environment variables only. Migration note: copy the previous AI Provider storage values here before removing them from old operational docs.',
    group: 'Platform',
  },
  access: {
    read: isAdmin,
    update: isAdmin,
  },
  fields: [
    {
      name: 'enabled',
      type: 'checkbox',
      defaultValue: false,
      label: 'Enable storage integration',
      admin: {
        description: 'Default: disabled. Turn this on only after bucket, region, and environment secrets are configured.',
      },
    },
    {
      name: 'bucket',
      type: 'text',
      defaultValue: '',
      label: 'Bucket name',
      admin: {
        description: 'Default: empty. Example: media-assets-prod.',
      },
    },
    {
      name: 'region',
      type: 'text',
      defaultValue: 'us-east-1',
      label: 'Region',
      admin: {
        description: 'Default: us-east-1.',
      },
    },
    {
      name: 'prefix',
      type: 'text',
      defaultValue: 'media',
      label: 'Object prefix',
      admin: {
        description: 'Default: media. Files are stored under this logical folder prefix.',
      },
    },
    {
      name: 'baseURL',
      type: 'text',
      defaultValue: '',
      label: 'CDN / base URL',
      admin: {
        description: 'Default: empty. Optional public CDN domain used for media access URLs.',
      },
    },
    {
      name: 'signedDownloads',
      type: 'checkbox',
      defaultValue: true,
      label: 'Use signed downloads',
      admin: {
        description: 'Default: enabled. When disabled, absolute media URLs are returned without signing.',
      },
    },
    {
      name: 'credentialsSource',
      type: 'text',
      defaultValue: 'environment',
      label: 'Credentials source',
      admin: {
        description: 'Default: environment. This is a note for operators; real secrets still live in environment variables.',
      },
    },
    {
      name: 'lastValidatedAt',
      type: 'date',
      label: 'Last validated at',
      admin: {
        description: 'Optional operator timestamp for the last successful storage validation.',
      },
    },
    {
      name: 'lastRotatedAt',
      type: 'date',
      label: 'Last rotated at',
      admin: {
        description: 'Optional operator timestamp for the last key rotation event recorded outside Payload.',
      },
    },
  ],
}

export default StorageSettings
