import type { GlobalConfig } from 'payload'

import { defaultSiteSettings } from '@/app/(frontend)/_lib/marketing-content'
import { isStaff } from '@/access'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: '站点设置',
  admin: {
    group: '平台',
  },
  access: {
    read: () => true,
    update: isStaff,
  },
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
}
