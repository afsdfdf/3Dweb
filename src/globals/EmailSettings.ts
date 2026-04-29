import type { GlobalConfig } from 'payload'

import { isAdmin, isStaff } from '@/access'
import { adminTextKey } from '@/lib/adminText'

export const EmailSettings: GlobalConfig = {
  slug: 'email-settings',
  label: adminTextKey('globals.emailSettings.label'),
  admin: {
    description: adminTextKey('globals.emailSettings.description'),
    group: adminTextKey('groups.platform'),
  },
  access: {
    read: isStaff,
    update: isAdmin,
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: '发件信息',
          fields: [
            {
              name: 'sender',
              type: 'group',
              label: '发件信息',
              fields: [
                { name: 'fromName', type: 'text', defaultValue: 'Thorns Tavern', label: '发件人名称' },
                { name: 'fromAddress', type: 'email', defaultValue: 'no-reply@thornstavern.com', label: '发件邮箱' },
                { name: 'replyTo', type: 'email', label: '回复地址' },
                {
                  name: 'smtpNotice',
                  type: 'ui',
                  admin: {
                    components: {
                      Field: '/components/admin/EmailSettingsNotice',
                    },
                  },
                },
              ],
            },
            {
              name: 'branding',
              type: 'group',
              label: '品牌显示',
              fields: [
                { name: 'productName', type: 'text', defaultValue: 'Thorns Tavern', label: '产品名称' },
                { name: 'footerText', type: 'text', defaultValue: 'Thorns Tavern', label: '邮件页脚文本' },
              ],
            },
          ],
        },
        {
          label: '认证邮件',
          fields: [
            {
              name: 'templates',
              type: 'group',
              label: '认证邮件文案',
              fields: [
                {
                  name: 'welcome',
                  type: 'group',
                  label: '欢迎邮件',
                  fields: [
                    { name: 'subject', type: 'text', defaultValue: '欢迎加入 Thorns Tavern', label: '主题' },
                    {
                      name: 'intro',
                      type: 'textarea',
                      defaultValue: '你的账号已经创建成功，现在可以开始使用 Thorns Tavern 的生成、模型、订阅与订单能力。',
                      label: '正文说明',
                    },
                    { name: 'ctaLabel', type: 'text', defaultValue: '进入 Studio', label: '按钮文案' },
                  ],
                },
                {
                  name: 'verify',
                  type: 'group',
                  label: '邮箱验证',
                  fields: [
                    { name: 'subject', type: 'text', defaultValue: '验证你的 Thorns Tavern 邮箱', label: '主题' },
                    {
                      name: 'intro',
                      type: 'textarea',
                      defaultValue: '请点击下面的按钮完成邮箱验证，验证成功后即可登录并继续使用 Thorns Tavern。',
                      label: '正文说明',
                    },
                    { name: 'ctaLabel', type: 'text', defaultValue: '验证邮箱', label: '按钮文案' },
                  ],
                },
                {
                  name: 'forgotPassword',
                  type: 'group',
                  label: '找回密码',
                  fields: [
                    { name: 'subject', type: 'text', defaultValue: 'Thorns Tavern 密码重置', label: '主题' },
                    {
                      name: 'intro',
                      type: 'textarea',
                      defaultValue: '我们收到了你的密码重置请求。点击下面按钮即可设置新密码。',
                      label: '正文说明',
                    },
                    { name: 'ctaLabel', type: 'text', defaultValue: '重置密码', label: '按钮文案' },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: '业务通知',
          fields: [
            {
              name: 'businessTemplates',
              type: 'group',
              label: '业务邮件文案',
              fields: [
                {
                  name: 'subscriptionSuccess',
                  type: 'group',
                  label: '订阅成功',
                  fields: [
                    { name: 'subject', type: 'text', defaultValue: 'Thorns Tavern 订阅开通成功', label: '主题' },
                    {
                      name: 'intro',
                      type: 'textarea',
                      defaultValue: '你的订阅已经开通成功，积分已按当前账期发放到账户。',
                      label: '正文说明',
                    },
                    { name: 'ctaLabel', type: 'text', defaultValue: '查看积分与订阅', label: '按钮文案' },
                  ],
                },
                {
                  name: 'orderPaid',
                  type: 'group',
                  label: '订单支付成功',
                  fields: [
                    { name: 'subject', type: 'text', defaultValue: 'Thorns Tavern 订单支付成功', label: '主题' },
                    {
                      name: 'intro',
                      type: 'textarea',
                      defaultValue: '你的打印订单已支付成功，订单已经进入后续处理流程。',
                      label: '正文说明',
                    },
                    { name: 'ctaLabel', type: 'text', defaultValue: '查看订单详情', label: '按钮文案' },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}

