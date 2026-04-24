import type { GlobalConfig } from 'payload'

import { isAdmin } from '@/access'
import { adminTextKey } from '@/lib/adminText'

const text = (en: string, zh: string) => ({ en, zh })

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
          label: text('Database Runtime', '数据库运行时'),
          fields: [
            {
              name: 'databaseConnectionMode',
              type: 'select',
              defaultValue: 'aws-rds-fields',
              label: text('Connection mode', '连接模式'),
              options: [
                {
                  label: text('Compose from AWS RDS variables', '根据 AWS RDS 变量拼接'),
                  value: 'aws-rds-fields',
                },
                {
                  label: text('Use DATABASE_URL directly', '直接使用 DATABASE_URL'),
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
                description: text(
                  'Paste the deployment DATABASE_URL template without the real password if you want.',
                  '如有需要，可填写不含真实密码的部署 DATABASE_URL 模板。',
                ),
              },
              label: text('DATABASE_URL template', 'DATABASE_URL 模板'),
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
                description: text(
                  'Optional operator notes such as current security group, public access status, or the production server IP to allow.',
                  '可选。记录安全组、公网访问状态或需要放行的生产服务器 IP 等运维备注。',
                ),
              },
              label: text('Security checklist', '安全检查清单'),
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
          label: text('App Runtime', '应用运行时'),
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
                description: text(
                  'Optional note for operators about where the current PAYLOAD_SECRET lives and when it was rotated.',
                  '可选。记录当前 PAYLOAD_SECRET 的存放位置和最近轮换时间。',
                ),
              },
              label: text('Secret rotation note', '密钥轮换说明'),
            },
          ],
        },
      ],
    },
  ],
}

export default RuntimeDeploymentSettings
