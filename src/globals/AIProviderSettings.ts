import type { GlobalConfig } from 'payload'

import { isStaff } from '@/access'

export const AIProviderSettings: GlobalConfig = {
  slug: 'ai-provider-settings',
  label: 'AI 供应商设置',
  admin: {
    group: 'AI 生产',
  },
  access: {
    read: isStaff,
    update: isStaff,
  },
  fields: [
    {
      name: 'defaultProvider',
      type: 'select',
      defaultValue: 'custom',
      label: '默认供应商',
      options: [
        { label: '自定义接口', value: 'custom' },
        { label: 'Meshy', value: 'meshy' },
        { label: 'Tripo', value: 'tripo' },
      ],
    },
    { name: 'mockMode', type: 'checkbox', defaultValue: true, label: '模拟模式' },
    { name: 'webhookSecret', type: 'text', label: '回调密钥' },
    {
      name: 'polling',
      type: 'group',
      label: '轮询配置',
      fields: [
        { name: 'enabled', type: 'checkbox', defaultValue: true, label: '启用' },
        { name: 'intervalSeconds', type: 'number', defaultValue: 20, label: '轮询间隔(秒)' },
        { name: 'timeoutMinutes', type: 'number', defaultValue: 8, label: '超时分钟数' },
      ],
    },
    {
      name: 'creditRules',
      type: 'group',
      label: '积分规则',
      fields: [
        { name: 'reserveOnSubmit', type: 'checkbox', defaultValue: true, label: '提交即预扣' },
        { name: 'refundOnFailure', type: 'checkbox', defaultValue: true, label: '失败退款' },
      ],
    },
    {
      name: 'providers',
      type: 'array',
      label: '供应商列表',
      fields: [
        {
          name: 'provider',
          type: 'select',
          required: true,
          label: '供应商',
          options: [
            { label: '自定义接口', value: 'custom' },
            { label: 'Meshy', value: 'meshy' },
            { label: 'Tripo', value: 'tripo' },
          ],
        },
        { name: 'baseURL', type: 'text', label: '地址' },
        { name: 'submitPath', type: 'text', label: '提交路径' },
        { name: 'statusPath', type: 'text', label: '查询路径' },
        { name: 'apiKeyHint', type: 'text', label: '环境变量提示' },
        { name: 'enabled', type: 'checkbox', defaultValue: true, label: '启用' },
      ],
    },
  ],
}
