import type { Access, CollectionConfig, Where } from 'payload'

import { isStaff } from '@/access'
import { assignCurrentUser } from '@/hooks/assignCurrentUser'
import { validateHomepageItem } from '@/hooks/validateHomepageItem'

const visibleReadOrStaff: Access = ({ req }) => {
  if (req.user?.role === 'admin' || req.user?.role === 'operator') {
    return true
  }

  const publicVisibilityConditions: Where[] = [
    {
      isVisible: {
        equals: true,
      },
    },
    {
      _status: {
        equals: 'published',
      },
    },
  ]

  return {
    and: publicVisibilityConditions,
  } satisfies Where
}

export const HomepageItems: CollectionConfig = {
  slug: 'homepage-items',
  labels: {
    plural: '首页内容项',
    singular: '首页内容项',
  },
  admin: {
    defaultColumns: [
      'title',
      'placement',
      'contentType',
      'linkedModel',
      'linkedPost',
      'linkedBundle',
      'linkedAnnouncement',
      'createdBy',
      'isVisible',
      'isPinned',
      'sortOrder',
      'updatedAt',
    ],
    description: '管理首页展示卡片、板块内容、排序、显示隐藏和发布时间。',
    group: '内容',
    useAsTitle: 'title',
  },
  access: {
    create: isStaff,
    delete: isStaff,
    read: visibleReadOrStaff,
    update: isStaff,
  },
  hooks: {
    beforeChange: [assignCurrentUser('createdBy'), validateHomepageItem],
  },
  defaultSort: ['placement', '-isPinned', 'sortOrder', '-publishAt'],
  fields: [
    {
      name: 'title',
      type: 'text',
      localized: true,
      required: true,
      label: '标题',
    },
    {
      name: 'slug',
      type: 'text',
      index: true,
      required: true,
      unique: true,
      label: 'Slug',
      admin: {
        description: '首页内容项的唯一标识，便于后续内容查询或外部同步。',
      },
    },
    {
      name: 'placement',
      type: 'select',
      required: true,
      defaultValue: 'featured',
      label: '首页板块',
      options: [
        { label: '主视觉下方', value: 'hero-secondary' },
        { label: '精选内容', value: 'featured' },
        { label: '专题推荐', value: 'bundles' },
        { label: '公告位', value: 'announcements' },
        { label: '文章流', value: 'articles' },
      ],
    },
    {
      name: 'contentType',
      type: 'select',
      required: true,
      defaultValue: 'custom',
      label: '内容来源类型',
      options: [
        { label: '自定义卡片', value: 'custom' },
        { label: '单个模型', value: 'model' },
        { label: '文章/活动', value: 'post' },
        { label: '公告', value: 'announcement' },
        { label: '专题包', value: 'bundle' },
      ],
    },
    {
      name: 'summary',
      type: 'textarea',
      localized: true,
      label: '摘要',
    },
    {
      name: 'coverImage',
      type: 'upload',
      relationTo: 'media',
      label: '封面图',
    },
    {
      name: 'linkedModel',
      type: 'relationship',
      relationTo: 'models',
      label: '关联模型',
      admin: {
        condition: (_, siblingData) => siblingData?.contentType === 'model',
      },
    },
    {
      name: 'linkedPost',
      type: 'relationship',
      relationTo: 'posts',
      label: '关联文章/活动',
      admin: {
        condition: (_, siblingData) => siblingData?.contentType === 'post',
      },
    },
    {
      name: 'linkedAnnouncement',
      type: 'relationship',
      relationTo: 'announcements',
      label: '关联公告',
      admin: {
        condition: (_, siblingData) => siblingData?.contentType === 'announcement',
      },
    },
    {
      name: 'linkedBundle',
      type: 'relationship',
      relationTo: 'model-bundles',
      label: '关联专题包',
      admin: {
        condition: (_, siblingData) => siblingData?.contentType === 'bundle',
      },
    },
    {
      name: 'customHref',
      type: 'text',
      label: '自定义链接',
      admin: {
        condition: (_, siblingData) => siblingData?.contentType === 'custom',
        description: '当内容类型为自定义卡片时使用，用于跳转到任意站内或站外链接。',
      },
    },
    {
      name: 'createdBy',
      type: 'relationship',
      relationTo: 'users',
      label: '创建人',
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
    },
    {
      name: 'publishAt',
      type: 'date',
      label: '发布时间',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'isPinned',
      type: 'checkbox',
      defaultValue: false,
      label: '置顶',
    },
    {
      name: 'isVisible',
      type: 'checkbox',
      defaultValue: true,
      label: '显示在前台',
    },
    {
      name: 'sortOrder',
      type: 'number',
      defaultValue: 0,
      label: '排序',
    },
  ],
  timestamps: true,
  versions: {
    drafts: true,
  },
}
