import type { Access, CollectionConfig, Where } from 'payload'

import { isStaff } from '@/access'
import { assignCurrentUser } from '@/hooks/assignCurrentUser'
import { fillPublishAtOnPublish } from '@/hooks/fillPublishAtOnPublish'

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

export const Announcements: CollectionConfig = {
  slug: 'announcements',
  labels: {
    plural: '公告',
    singular: '公告',
  },
  admin: {
    defaultColumns: ['title', '_status', 'createdBy', 'publishAt', 'isPinned', 'isVisible', 'updatedAt'],
    description: '管理首页公告、系统通知与短内容提示。',
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
    beforeChange: [assignCurrentUser('createdBy'), fillPublishAtOnPublish('publishAt')],
  },
  defaultSort: ['-isPinned', 'sortOrder', '-publishAt'],
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
    },
    {
      name: 'summary',
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
