import type { GlobalConfig } from 'payload'

import { isAdmin } from '@/access'
import { adminTextKey } from '@/lib/adminText'

const text = (en: string, zh: string) => ({ en, zh })

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
          label: text('Mutation Origins', '变更来源'),
          fields: [
            {
              name: 'allowedMutationOrigins',
              type: 'array',
              label: text('Allowed origins', '允许的来源'),
              admin: {
                description: text(
                  'Default: empty. Add one absolute origin per row, for example https://app.example.com. Local development still allows requests without Origin outside production.',
                  '默认留空。每行填写一个完整来源，例如 https://app.example.com。非生产环境下，本地开发仍允许没有 Origin 的请求。',
                ),
              },
              fields: [
                {
                  name: 'origin',
                  type: 'text',
                  required: true,
                  label: text('Origin', '来源'),
                },
              ],
              defaultValue: [],
            },
          ],
        },
        {
          label: text('Remote Assets', '远程资源'),
          fields: [
            {
              name: 'allowedRemoteAssetHosts',
              type: 'array',
              label: text('Allowed host patterns', '允许的主机模式'),
              admin: {
                description: text(
                  'Default: empty. Add hostnames such as cdn.example.com or example.com. Subdomains are matched automatically.',
                  '默认留空。填写 cdn.example.com 或 example.com 这样的主机名，子域名会自动匹配。',
                ),
              },
              fields: [
                {
                  name: 'host',
                  type: 'text',
                  required: true,
                  label: text('Host pattern', '主机模式'),
                },
              ],
              defaultValue: [],
            },
          ],
        },
        {
          label: text('Authentication', '认证'),
          fields: [
            {
              name: 'registrationVerificationMode',
              type: 'select',
              defaultValue: 'email-code',
              label: text('Registration verification mode', '注册验证方式'),
              admin: {
                description: text(
                  'Email code is the default signup flow. Email link keeps the legacy Payload verification link flow available.',
                  '邮箱验证码是默认注册流程。邮箱链接保留旧版 Payload 验证链接流程。',
                ),
              },
              options: [
                {
                  label: text('Email code', '邮箱验证码'),
                  value: 'email-code',
                },
                {
                  label: text('Email link', '邮箱链接'),
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
              label: text('Registration code expiry minutes', '注册验证码有效分钟数'),
              admin: {
                description: text(
                  'Used only when registration verification mode is Email code.',
                  '仅在注册验证方式为邮箱验证码时使用。',
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
