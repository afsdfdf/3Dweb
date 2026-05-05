import type { GlobalConfig } from 'payload'

import { isAdmin } from '@/access'
import { adminTextKey } from '@/lib/adminText'

export const SecuritySettings: GlobalConfig = {
  slug: 'security-settings',
  label: adminTextKey('globals.securitySettings.label'),
  admin: {
    description: adminTextKey('globals.securitySettings.description'),
    group: adminTextKey('groups.platform'),
  },
  access: {
    read: isAdmin,
    update: isAdmin,
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: adminTextKey('globals.securitySettings.tabs.mutationOrigins.label'),
          fields: [
            {
              name: 'allowedMutationOrigins',
              type: 'array',
              label: adminTextKey('globals.securitySettings.tabs.mutationOrigins.fields.allowedMutationOrigins.label'),
              admin: {
                description: adminTextKey(
                  'globals.securitySettings.tabs.mutationOrigins.fields.allowedMutationOrigins.description',
                ),
              },
              fields: [
                {
                  name: 'origin',
                  type: 'text',
                  required: true,
                  label: adminTextKey('globals.securitySettings.tabs.mutationOrigins.fields.allowedMutationOrigins.fields.origin'),
                },
              ],
              defaultValue: [],
            },
          ],
        },
        {
          label: adminTextKey('globals.securitySettings.tabs.remoteAssets.label'),
          fields: [
            {
              name: 'allowedRemoteAssetHosts',
              type: 'array',
              label: adminTextKey('globals.securitySettings.tabs.remoteAssets.fields.allowedRemoteAssetHosts.label'),
              admin: {
                description: adminTextKey(
                  'globals.securitySettings.tabs.remoteAssets.fields.allowedRemoteAssetHosts.description',
                ),
              },
              fields: [
                {
                  name: 'host',
                  type: 'text',
                  required: true,
                  label: adminTextKey('globals.securitySettings.tabs.remoteAssets.fields.allowedRemoteAssetHosts.fields.host'),
                },
              ],
              defaultValue: [],
            },
          ],
        },
        {
          label: adminTextKey('globals.securitySettings.tabs.authentication.label'),
          fields: [
            {
              name: 'registrationVerificationMode',
              type: 'select',
              defaultValue: 'email-code',
              label: adminTextKey('globals.securitySettings.tabs.authentication.fields.registrationVerificationMode.label'),
              admin: {
                description: adminTextKey(
                  'globals.securitySettings.tabs.authentication.fields.registrationVerificationMode.description',
                ),
              },
              options: [
                {
                  label: adminTextKey(
                    'globals.securitySettings.tabs.authentication.fields.registrationVerificationMode.options.emailCode',
                  ),
                  value: 'email-code',
                },
                {
                  label: adminTextKey(
                    'globals.securitySettings.tabs.authentication.fields.registrationVerificationMode.options.emailLink',
                  ),
                  value: 'email-link',
                },
              ],
            },
            {
              name: 'registrationCodeExpiresMinutes',
              type: 'number',
              defaultValue: 10,
              min: 3,
              max: 60,
              label: adminTextKey('globals.securitySettings.tabs.authentication.fields.registrationCodeExpiresMinutes.label'),
              admin: {
                description: adminTextKey(
                  'globals.securitySettings.tabs.authentication.fields.registrationCodeExpiresMinutes.description',
                ),
              },
            },
          ],
        },
      ],
    },
  ],
}

export default SecuritySettings
