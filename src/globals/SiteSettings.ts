import type { GlobalConfig } from 'payload'

import { defaultSiteSettings } from '@/app/(frontend)/_lib/marketing-content'
import { isStaff } from '@/access'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: '站点设置',
  admin: {
    description: '统一管理站点品牌、导航、定价、积分套餐与邮件通知文案。',
    group: '平台',
  },
  access: {
    read: () => true,
    update: isStaff,
  },
  fields: [
    {
      name: 'settingsOverview',
      type: 'ui',
      admin: {
        position: 'sidebar',
        components: {
          Field: '/components/admin/EmailSettingsNotice',
        },
      },
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: '站点基础',
          fields: [
            { name: 'siteName', type: 'text', required: true, defaultValue: defaultSiteSettings.siteName, label: '站点名称' },
            { name: 'siteDescription', type: 'textarea', defaultValue: defaultSiteSettings.siteDescription, label: '站点描述' },
            { name: 'supportEmail', type: 'email', defaultValue: defaultSiteSettings.supportEmail, label: '支持邮箱' },
            { name: 'announcement', type: 'textarea', defaultValue: defaultSiteSettings.announcement, label: '公告' },
            {
              name: 'headerNav',
              type: 'array',
              label: '头部导航',
              fields: [
                { name: 'label', type: 'text', required: true, label: '文案' },
                { name: 'href', type: 'text', required: true, label: '链接' },
              ],
              defaultValue: defaultSiteSettings.headerNav,
            },
            {
              name: 'footer',
              type: 'group',
              label: '页脚',
              fields: [
                { name: 'aboutEyebrow', type: 'text', defaultValue: defaultSiteSettings.footer.aboutEyebrow, label: '左栏角标' },
                { name: 'aboutTitle', type: 'text', defaultValue: defaultSiteSettings.footer.aboutTitle, label: '左栏标题' },
                { name: 'aboutText', type: 'textarea', defaultValue: defaultSiteSettings.footer.aboutText, label: '左栏说明' },
                { name: 'directionEyebrow', type: 'text', defaultValue: defaultSiteSettings.footer.directionEyebrow, label: '右栏角标' },
                { name: 'directionTitle', type: 'text', defaultValue: defaultSiteSettings.footer.directionTitle, label: '右栏标题' },
                { name: 'directionText', type: 'textarea', defaultValue: defaultSiteSettings.footer.directionText, label: '右栏说明' },
              ],
            },
          ],
        },
        {
          label: '定价与积分',
          fields: [
            {
              name: 'generationPricing',
              type: 'group',
              label: '生成定价',
              fields: [
                { name: 'imageCredits', type: 'number', defaultValue: defaultSiteSettings.generationPricing.imageCredits, label: '图生积分' },
                { name: 'textCredits', type: 'number', defaultValue: defaultSiteSettings.generationPricing.textCredits, label: '文生积分' },
                { name: 'hybridCredits', type: 'number', defaultValue: defaultSiteSettings.generationPricing.hybridCredits, label: '图文积分' },
                { name: 'downloadCredits', type: 'number', defaultValue: defaultSiteSettings.generationPricing.downloadCredits, label: '下载积分' },
              ],
            },
            {
              name: 'creditPackages',
              type: 'array',
              label: '积分套餐',
              fields: [
                { name: 'title', type: 'text', required: true, label: '标题' },
                { name: 'shopifyVariantId', type: 'text', label: 'Shopify 变体 ID' },
                { name: 'credits', type: 'number', required: true, label: '积分' },
                { name: 'price', type: 'number', required: true, label: '价格' },
                { name: 'currency', type: 'text', defaultValue: 'USD', label: '货币' },
              ],
              defaultValue: defaultSiteSettings.creditPackages,
            },
          ],
        },
        {
          label: '邮件设置',
          fields: [
            {
              name: 'emailSettings',
              type: 'group',
              label: '邮箱设置',
              fields: [
                {
                  name: 'sender',
                  type: 'group',
                  label: '发件信息',
                  fields: [
                    { name: 'fromName', type: 'text', defaultValue: 'MiniForge AI 3D', label: '发件人名称' },
                    { name: 'fromAddress', type: 'email', defaultValue: 'no-reply@miniforge.local', label: '发件邮箱' },
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
                    { name: 'productName', type: 'text', defaultValue: 'MiniForge AI 3D', label: '产品名称' },
                    { name: 'footerText', type: 'text', defaultValue: 'MiniForge AI 3D', label: '邮件页脚文本' },
                  ],
                },
                {
                  name: 'templates',
                  type: 'group',
                  label: '认证邮件',
                  fields: [
                    {
                      name: 'welcome',
                      type: 'group',
                      label: '欢迎邮件',
                      fields: [
                        { name: 'subject', type: 'text', defaultValue: '欢迎加入 MiniForge', label: '主题' },
                        {
                          name: 'intro',
                          type: 'textarea',
                          defaultValue: '你的账号已经创建成功，现在可以开始使用 MiniForge 的生成、模型、订阅与订单能力。',
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
                        { name: 'subject', type: 'text', defaultValue: '验证你的 MiniForge 邮箱', label: '主题' },
                        {
                          name: 'intro',
                          type: 'textarea',
                          defaultValue: '请点击下面的按钮完成邮箱验证，验证成功后即可登录并继续使用 MiniForge。',
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
                        { name: 'subject', type: 'text', defaultValue: 'MiniForge 密码重置', label: '主题' },
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
                {
                  name: 'businessTemplates',
                  type: 'group',
                  label: '业务通知',
                  fields: [
                    {
                      name: 'subscriptionSuccess',
                      type: 'group',
                      label: '订阅成功',
                      fields: [
                        { name: 'subject', type: 'text', defaultValue: 'MiniForge 订阅开通成功', label: '主题' },
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
                        { name: 'subject', type: 'text', defaultValue: 'MiniForge 订单支付成功', label: '主题' },
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
    },
  ],
}
