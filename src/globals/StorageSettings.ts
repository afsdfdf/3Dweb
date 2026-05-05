import type { GlobalConfig } from 'payload'

import { isAdmin } from '@/access'
import { adminTextKey } from '@/lib/adminText'

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
      label: adminTextKey('globals.storageSettings.fields.enabled.label'),
      admin: {
        description: adminTextKey('globals.storageSettings.fields.enabled.description'),
      },
    },
    {
      name: 'bucket',
      type: 'text',
      defaultValue: '',
      label: adminTextKey('globals.storageSettings.fields.bucket.label'),
      admin: {
        description: adminTextKey('globals.storageSettings.fields.bucket.description'),
      },
    },
    {
      name: 'prefix',
      type: 'text',
      defaultValue: 'media',
      label: adminTextKey('globals.storageSettings.fields.prefix.label'),
      admin: {
        description: adminTextKey('globals.storageSettings.fields.prefix.description'),
      },
    },
    {
      name: 'baseURL',
      type: 'text',
      defaultValue: '',
      label: adminTextKey('globals.storageSettings.fields.baseURL.label'),
      admin: {
        description: adminTextKey('globals.storageSettings.fields.baseURL.description'),
      },
    },
    {
      name: 'signedDownloads',
      type: 'checkbox',
      defaultValue: true,
      label: adminTextKey('globals.storageSettings.fields.signedDownloads.label'),
      admin: {
        description: adminTextKey('globals.storageSettings.fields.signedDownloads.description'),
      },
    },
    {
      name: 'credentialsSource',
      type: 'text',
      defaultValue: 'environment',
      label: adminTextKey('globals.storageSettings.fields.credentialsSource.label'),
      admin: {
        description: adminTextKey('globals.storageSettings.fields.credentialsSource.description'),
      },
    },
    {
      name: 'lastValidatedAt',
      type: 'date',
      label: adminTextKey('globals.storageSettings.fields.lastValidatedAt.label'),
      admin: {
        description: adminTextKey('globals.storageSettings.fields.lastValidatedAt.description'),
      },
    },
    {
      name: 'lastRotatedAt',
      type: 'date',
      label: adminTextKey('globals.storageSettings.fields.lastRotatedAt.label'),
      admin: {
        description: adminTextKey('globals.storageSettings.fields.lastRotatedAt.description'),
      },
    },
  ],
}

export default StorageSettings
