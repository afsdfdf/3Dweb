import type { GlobalConfig } from 'payload'

import { isAdmin } from '@/access'

export const SecuritySettings: GlobalConfig = {
  slug: 'security-settings',
  label: 'Security Settings',
  admin: {
    description:
      'Manage non-sensitive request origin and remote asset allowlists here. Migration note: copy any existing ALLOWED_REQUEST_ORIGINS or AI_REMOTE_ASSET_ALLOWLIST values into this screen so future maintenance can happen in the admin panel.',
    group: 'Platform',
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
          label: 'Mutation Origins',
          fields: [
            {
              name: 'allowedMutationOrigins',
              type: 'array',
              label: 'Allowed origins',
              admin: {
                description:
                  'Default: empty. Add one absolute origin per row, for example https://app.example.com. Local development still allows requests without Origin outside production.',
              },
              fields: [
                {
                  name: 'origin',
                  type: 'text',
                  required: true,
                  label: 'Origin',
                },
              ],
              defaultValue: [],
            },
          ],
        },
        {
          label: 'Remote Assets',
          fields: [
            {
              name: 'allowedRemoteAssetHosts',
              type: 'array',
              label: 'Allowed host patterns',
              admin: {
                description:
                  'Default: empty. Add hostnames such as cdn.example.com or example.com. Subdomains are matched automatically.',
              },
              fields: [
                {
                  name: 'host',
                  type: 'text',
                  required: true,
                  label: 'Host pattern',
                },
              ],
              defaultValue: [],
            },
          ],
        },
      ],
    },
  ],
}

export default SecuritySettings
