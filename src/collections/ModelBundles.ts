import type { Access, CollectionConfig, Where } from 'payload'

import { isStaff } from '@/access'
import { assignCurrentUser } from '@/hooks/assignCurrentUser'
import { fillPublishAtOnPublish } from '@/hooks/fillPublishAtOnPublish'
import { adminLabelsKey, adminTextKey } from '@/lib/adminText'

const publicBundleReadOrStaff: Access = ({ req }) => {
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

export const ModelBundles: CollectionConfig = {
  slug: 'model-bundles',
  labels: adminLabelsKey('collections.modelBundles'),
  admin: {
    defaultColumns: ['title', '_status', 'createdBy', 'isVisible', 'isFeatured', 'sortOrder', 'updatedAt'],
    description: adminTextKey('collections.modelBundles.description'),
    group: adminTextKey('groups.content'),
    useAsTitle: 'title',
  },
  access: {
    create: isStaff,
    delete: isStaff,
    read: publicBundleReadOrStaff,
    update: isStaff,
  },
  hooks: {
    beforeChange: [assignCurrentUser('createdBy'), fillPublishAtOnPublish('publishAt')],
  },
  defaultSort: ['-isFeatured', 'sortOrder', '-updatedAt'],
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
      name: 'coverImage',
      type: 'upload',
      relationTo: 'media',
      label: '封面图',
    },
    {
      name: 'summary',
      type: 'textarea',
      localized: true,
      label: '简介',
    },
    {
      name: 'tags',
      type: 'array',
      label: '标签',
      fields: [
        {
          name: 'label',
          type: 'text',
          localized: true,
          label: '标签名',
          required: true,
        },
      ],
    },
    {
      name: 'models',
      type: 'relationship',
      relationTo: 'models',
      hasMany: true,
      label: '包含的模型',
      required: true,
      admin: {
        description: '从现有用户生成的模型中选择一个或多个模型组成专题包。',
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
    },
    {
      name: 'isVisible',
      type: 'checkbox',
      defaultValue: true,
      label: '公开显示',
    },
    {
      name: 'isFeatured',
      type: 'checkbox',
      defaultValue: false,
      label: '首页推荐',
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

