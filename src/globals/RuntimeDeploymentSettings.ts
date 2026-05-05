import type { GlobalConfig } from 'payload'

import { isAdmin } from '@/access'
import { adminTextKey } from '@/lib/adminText'

export const RuntimeDeploymentSettings: GlobalConfig = {
  slug: 'runtime-deployment-settings',
  label: adminTextKey('globals.runtimeDeployment.label'),
  admin: {
    description: adminTextKey('globals.runtimeDeployment.description'),
    group: adminTextKey('groups.platform'),
  },
  access: {
    read: isAdmin,
    update: isAdmin,
  },
  fields: [
    {
      name: 'runtimeConfigNotice',
      type: 'ui',
      admin: {
        components: {
          Field: '/components/admin/RuntimeConfigNotice',
        },
      },
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: adminTextKey('globals.runtimeDeployment.tabs.databaseRuntime.label'),
          fields: [
            {
              name: 'databaseConnectionMode',
              type: 'select',
              defaultValue: 'database-url',
              label: adminTextKey('globals.runtimeDeployment.tabs.databaseRuntime.fields.databaseConnectionMode.label'),
              options: [
                {
                  label: adminTextKey(
                    'globals.runtimeDeployment.tabs.databaseRuntime.fields.databaseConnectionMode.options.awsRdsFields',
                  ),
                  value: 'aws-rds-fields',
                },
                {
                  label: adminTextKey(
                    'globals.runtimeDeployment.tabs.databaseRuntime.fields.databaseConnectionMode.options.databaseUrl',
                  ),
                  value: 'database-url',
                },
              ],
              required: true,
            },
            {
              name: 'databaseUrlTemplate',
              type: 'text',
              admin: {
                condition: (_, siblingData) => siblingData?.databaseConnectionMode === 'database-url',
                description: adminTextKey(
                  'globals.runtimeDeployment.tabs.databaseRuntime.fields.databaseUrlTemplate.description',
                ),
              },
              label: adminTextKey('globals.runtimeDeployment.tabs.databaseRuntime.fields.databaseUrlTemplate.label'),
            },
            {
              name: 'awsRdsHost',
              type: 'text',
              admin: {
                condition: () => false,
              },
              label: 'Legacy composed Postgres host',
            },
            {
              name: 'awsRdsPort',
              type: 'number',
              admin: {
                condition: () => false,
              },
              defaultValue: 5432,
              label: 'Legacy composed Postgres port',
            },
            {
              name: 'awsRdsDbName',
              type: 'text',
              admin: {
                condition: () => false,
              },
              defaultValue: 'payload_local_demo',
              label: 'Legacy composed Postgres database',
            },
            {
              name: 'awsRdsUsername',
              type: 'text',
              admin: {
                condition: () => false,
              },
              defaultValue: 'payload_admin',
              label: 'Legacy composed Postgres username',
            },
            {
              name: 'awsRdsSslMode',
              type: 'select',
              defaultValue: 'require',
              label: 'Legacy composed Postgres SSL mode',
              options: [
                { label: 'require', value: 'require' },
                { label: 'verify-full', value: 'verify-full' },
                { label: 'disable', value: 'disable' },
              ],
              admin: {
                condition: () => false,
              },
            },
            {
              name: 'awsRdsSslRejectUnauthorized',
              type: 'checkbox',
              defaultValue: false,
              label: 'Legacy composed Postgres SSL reject unauthorized',
              admin: {
                condition: () => false,
              },
            },
            {
              name: 'databaseSecurityChecklist',
              type: 'textarea',
              admin: {
                description: adminTextKey(
                  'globals.runtimeDeployment.tabs.databaseRuntime.fields.databaseSecurityChecklist.description',
                ),
              },
              label: adminTextKey('globals.runtimeDeployment.tabs.databaseRuntime.fields.databaseSecurityChecklist.label'),
            },
            {
              name: 'databaseRuntimeEnvPreview',
              type: 'ui',
              admin: {
                components: {
                  Field: '/components/admin/RuntimeEnvPreview',
                },
              },
            },
          ],
        },
        {
          label: adminTextKey('globals.runtimeDeployment.tabs.appRuntime.label'),
          fields: [
            {
              name: 'nextPublicAppUrl',
              type: 'text',
              defaultValue: 'http://localhost:3000',
              label: 'NEXT_PUBLIC_APP_URL',
            },
            {
              name: 'payloadSecretRotationNote',
              type: 'textarea',
              admin: {
                description: adminTextKey(
                  'globals.runtimeDeployment.tabs.appRuntime.fields.payloadSecretRotationNote.description',
                ),
              },
              label: adminTextKey('globals.runtimeDeployment.tabs.appRuntime.fields.payloadSecretRotationNote.label'),
            },
          ],
        },
      ],
    },
  ],
}

export default RuntimeDeploymentSettings
