import type { GlobalConfig } from 'payload'

import { defaultHomepageContent } from '@/app/(frontend)/_lib/marketing-content'
import { isStaff } from '@/access'

export const HomepageContent: GlobalConfig = {
  slug: 'homepage-content',
  label: '首页内容',
  admin: {
    group: '内容',
  },
  access: {
    read: () => true,
    update: isStaff,
  },
  fields: [
    {
      name: 'hero',
      type: 'group',
      label: '首屏',
      fields: [
        { name: 'eyebrow', type: 'text', defaultValue: defaultHomepageContent.hero.eyebrow, label: '角标' },
        { name: 'title', type: 'text', defaultValue: defaultHomepageContent.hero.title, label: '标题' },
        { name: 'subtitle', type: 'textarea', defaultValue: defaultHomepageContent.hero.subtitle, label: '副标题' },
        {
          name: 'primaryCTA',
          type: 'group',
          label: '主按钮',
          fields: [
            { name: 'label', type: 'text', defaultValue: defaultHomepageContent.hero.primaryCTA.label, label: '文案' },
            { name: 'href', type: 'text', defaultValue: defaultHomepageContent.hero.primaryCTA.href, label: '链接' },
          ],
        },
        {
          name: 'secondaryCTA',
          type: 'group',
          label: '次按钮',
          fields: [
            { name: 'label', type: 'text', defaultValue: defaultHomepageContent.hero.secondaryCTA.label, label: '文案' },
            { name: 'href', type: 'text', defaultValue: defaultHomepageContent.hero.secondaryCTA.href, label: '链接' },
          ],
        },
      ],
    },
    {
      name: 'introBand',
      type: 'group',
      label: '定位说明',
      fields: [
        { name: 'eyebrow', type: 'text', defaultValue: defaultHomepageContent.introBand.eyebrow, label: '角标' },
        { name: 'title', type: 'text', defaultValue: defaultHomepageContent.introBand.title, label: '标题' },
        { name: 'text', type: 'textarea', defaultValue: defaultHomepageContent.introBand.text, label: '说明' },
      ],
    },
    {
      name: 'featuredWorks',
      type: 'array',
      label: '精选方向',
      fields: [
        { name: 'category', type: 'text', required: true, label: '分类' },
        { name: 'title', type: 'text', required: true, label: '标题' },
        { name: 'summary', type: 'textarea', label: '说明' },
        { name: 'tone', type: 'select', defaultValue: 'violet', label: '色调', options: ['violet', 'blue', 'pink'] },
      ],
      defaultValue: defaultHomepageContent.featuredWorks,
    },
    {
      name: 'serviceIntro',
      type: 'group',
      label: '服务介绍',
      fields: [
        { name: 'eyebrow', type: 'text', defaultValue: defaultHomepageContent.serviceIntro.eyebrow, label: '角标' },
        { name: 'title', type: 'text', defaultValue: defaultHomepageContent.serviceIntro.title, label: '标题' },
        { name: 'text', type: 'textarea', defaultValue: defaultHomepageContent.serviceIntro.text, label: '说明' },
      ],
    },
    {
      name: 'serviceBlocks',
      type: 'array',
      label: '服务卡片',
      fields: [
        { name: 'title', type: 'text', required: true, label: '标题' },
        { name: 'text', type: 'textarea', required: true, label: '描述' },
      ],
      defaultValue: defaultHomepageContent.serviceBlocks,
    },
    {
      name: 'useCases',
      type: 'array',
      label: '适用场景',
      fields: [{ name: 'label', type: 'text', required: true, label: '场景' }],
      defaultValue: defaultHomepageContent.useCases,
    },
    {
      name: 'processSection',
      type: 'group',
      label: '流程模块',
      fields: [
        { name: 'eyebrow', type: 'text', defaultValue: defaultHomepageContent.processSection.eyebrow, label: '角标' },
        { name: 'title', type: 'text', defaultValue: defaultHomepageContent.processSection.title, label: '标题' },
      ],
    },
    {
      name: 'processSteps',
      type: 'array',
      label: '流程步骤',
      fields: [
        { name: 'step', type: 'text', required: true, label: '编号' },
        { name: 'title', type: 'text', required: true, label: '标题' },
        { name: 'text', type: 'textarea', required: true, label: '描述' },
      ],
      defaultValue: defaultHomepageContent.processSteps,
    },
    {
      name: 'entrySection',
      type: 'group',
      label: '入口模块',
      fields: [
        { name: 'eyebrow', type: 'text', defaultValue: defaultHomepageContent.entrySection.eyebrow, label: '角标' },
        { name: 'title', type: 'text', defaultValue: defaultHomepageContent.entrySection.title, label: '标题' },
        { name: 'text', type: 'textarea', defaultValue: defaultHomepageContent.entrySection.text, label: '说明' },
      ],
    },
    {
      name: 'faqSection',
      type: 'group',
      label: 'FAQ 模块',
      fields: [
        { name: 'eyebrow', type: 'text', defaultValue: defaultHomepageContent.faqSection.eyebrow, label: '角标' },
        { name: 'title', type: 'text', defaultValue: defaultHomepageContent.faqSection.title, label: '标题' },
      ],
    },
    {
      name: 'faq',
      type: 'array',
      label: '常见问题',
      fields: [
        { name: 'question', type: 'text', required: true, label: '问题' },
        { name: 'answer', type: 'textarea', required: true, label: '答案' },
      ],
      defaultValue: defaultHomepageContent.faq,
    },
  ],
}
