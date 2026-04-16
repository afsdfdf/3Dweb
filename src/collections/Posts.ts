import type { Access, CollectionConfig } from 'payload'

import { isStaff } from '@/access'
import { assignCurrentUser } from '@/hooks/assignCurrentUser'
import { fillPublishAtOnPublish } from '@/hooks/fillPublishAtOnPublish'

const publicReadOrStaff: Access = ({ req }) => {
  if (req.user?.role === 'admin' || req.user?.role === 'operator') {
    return true
  }

  return {
    _status: {
      equals: 'published',
    },
  }
}

export const Posts: CollectionConfig = {
  slug: 'posts',
  labels: {
    plural: '文章与活动',
    singular: '文章',
  },
  admin: {
    defaultColumns: ['title', 'category', '_status', 'createdBy', 'publishedAt', 'isPinned', 'sortOrder', 'updatedAt'],
    description: '管理首页活动帖、博客文章与公告型长内容。',
    group: '内容',
    useAsTitle: 'title',
  },
  access: {
    create: isStaff,
    delete: isStaff,
    read: publicReadOrStaff,
    update: isStaff,
  },
  hooks: {
    beforeChange: [assignCurrentUser('createdBy'), fillPublishAtOnPublish('publishedAt')],
  },
  defaultSort: ['-isPinned', 'sortOrder', '-publishedAt'],
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
        description: '用于内容详情页的唯一标识，建议保持稳定且仅使用 URL 友好字符。',
      },
    },
    {
      name: 'category',
      type: 'select',
      defaultValue: 'article',
      label: '内容类型',
      options: [
        { label: '文章', value: 'article' },
        { label: '活动帖', value: 'event' },
        { label: '公告长文', value: 'announcement' },
      ],
      required: true,
    },
    {
      name: 'coverImage',
      type: 'upload',
      relationTo: 'media',
      label: '封面图',
    },
    {
      name: 'excerpt',
      type: 'textarea',
      localized: true,
      label: '摘要',
    },
    {
      name: 'content',
      type: 'richText',
      localized: true,
      label: '正文',
      required: true,
    },
    {
      name: 'videoUrl',
      type: 'text',
      label: '第三方视频链接',
      admin: {
        description: '支持 YouTube 等第三方视频链接，用于内容详情页嵌入。',
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
      name: 'publishedAt',
      type: 'date',
      admin: {
        position: 'sidebar',
      },
      label: '发布时间',
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
