import type { GlobalConfig } from 'payload'

import { isAdmin } from '@/access'
import { adminTextKey } from '@/lib/adminText'

const text = (en: string) => ({ en, zh: en })

export const StorageSettings: GlobalConfig = {
  slug: 'storage-settings',
  label: adminTextKey('globals.storageSettings.label'),
  admin: {
    description: adminTextKey('globals.storageSettings.description'),
    group: adminTextKey('groups.platform'),
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
      label: text('Enable storage integration'),
      admin: {
        description: text('Default: disabled. Turn this on only after Supabase bucket and environment secrets are configured.'),
      },
    },
    {
      name: 'bucket',
      type: 'text',
      defaultValue: '',
      label: text('Bucket name'),
      admin: {
        description: text('Default: empty. Example: media-assets-prod.'),
      },
    },
    {
      name: 'prefix',
      type: 'text',
      defaultValue: 'media',
      label: text('Object prefix'),
      admin: {
        description: text('Default: media. Files are stored under this logical folder prefix.'),
      },
    },
    {
      name: 'baseURL',
      type: 'text',
      defaultValue: '',
      label: text('Supabase public base URL'),
      admin: {
        description: text('Default: empty. Optional Supabase Storage public object base URL used for media access URLs.'),
      },
    },
    {
      name: 'signedDownloads',
      type: 'checkbox',
      defaultValue: true,
      label: text('Use signed downloads'),
      admin: {
        description: text('Default: enabled. When disabled, absolute media URLs are returned without signing.'),
      },
    },
    {
      name: 'credentialsSource',
      type: 'text',
      defaultValue: 'environment',
      label: text('Credentials source'),
      admin: {
        description: text('Default: environment. This is an operator note only. Real secrets still live in environment variables.'),
      },
    },
    {
      name: 'lastValidatedAt',
      type: 'date',
      label: text('Last validated at'),
      admin: {
        description: text('Optional operator timestamp for the last successful storage validation.'),
      },
    },
    {
      name: 'lastRotatedAt',
      type: 'date',
      label: text('Last rotated at'),
      admin: {
        description: text('Optional operator timestamp for the last key rotation event recorded outside Payload.'),
      },
    },
  ],
}

export default StorageSettings
