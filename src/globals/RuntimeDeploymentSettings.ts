import type { GlobalConfig } from 'payload'

import { isAdmin } from '@/access'

export const RuntimeDeploymentSettings: GlobalConfig = {
  slug: 'runtime-deployment-settings',
  label: 'Runtime Deployment',
  admin: {
    description:
      'Manage deployment-time database and app runtime variables. Secrets must still be stored in your hosting platform environment.',
    group: 'Platform',
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
          label: 'Database Runtime',
          fields: [
            {
              name: 'databaseConnectionMode',
              type: 'select',
              defaultValue: 'aws-rds-fields',
              label: 'Connection mode',
              options: [
                {
                  label: 'Compose from AWS RDS variables',
                  value: 'aws-rds-fields',
                },
                {
                  label: 'Use DATABASE_URL directly',
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
                description: 'Paste the deployment DATABASE_URL template without the real password if you want.',
              },
              label: 'DATABASE_URL template',
            },
            {
              name: 'awsRdsHost',
              type: 'text',
              admin: {
                condition: (_, siblingData) => siblingData?.databaseConnectionMode === 'aws-rds-fields',
              },
              label: 'AWS_RDS_HOST',
            },
            {
              name: 'awsRdsPort',
              type: 'number',
              admin: {
                condition: (_, siblingData) => siblingData?.databaseConnectionMode === 'aws-rds-fields',
              },
              defaultValue: 5432,
              label: 'AWS_RDS_PORT',
            },
            {
              name: 'awsRdsDbName',
              type: 'text',
              admin: {
                condition: (_, siblingData) => siblingData?.databaseConnectionMode === 'aws-rds-fields',
              },
              defaultValue: 'payload_local_demo',
              label: 'AWS_RDS_DB_NAME',
            },
            {
              name: 'awsRdsUsername',
              type: 'text',
              admin: {
                condition: (_, siblingData) => siblingData?.databaseConnectionMode === 'aws-rds-fields',
              },
              defaultValue: 'payload_admin',
              label: 'AWS_RDS_USERNAME',
            },
            {
              name: 'awsRdsSslMode',
              type: 'select',
              defaultValue: 'require',
              label: 'AWS_RDS_SSL_MODE',
              options: [
                { label: 'require', value: 'require' },
                { label: 'verify-full', value: 'verify-full' },
                { label: 'disable', value: 'disable' },
              ],
            },
            {
              name: 'awsRdsSslRejectUnauthorized',
              type: 'checkbox',
              defaultValue: false,
              label: 'AWS_RDS_SSL_REJECT_UNAUTHORIZED',
            },
            {
              name: 'databaseSecurityChecklist',
              type: 'textarea',
              admin: {
                description:
                  'Optional operator notes such as current security group, public access status, or the production server IP to allow.',
              },
              label: 'Security checklist',
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
          label: 'App Runtime',
          fields: [
            {
              name: 'nextPublicAppUrl',
              type: 'text',
              defaultValue: 'http://127.0.0.1:3000',
              label: 'NEXT_PUBLIC_APP_URL',
            },
            {
              name: 'payloadSecretRotationNote',
              type: 'textarea',
              admin: {
                description:
                  'Optional note for operators about where the current PAYLOAD_SECRET lives and when it was rotated.',
              },
              label: 'Secret rotation note',
            },
          ],
        },
      ],
    },
  ],
}

export default RuntimeDeploymentSettings
