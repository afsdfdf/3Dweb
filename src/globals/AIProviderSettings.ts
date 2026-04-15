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
        { name: 'intervalSeconds', type: 'number', defaultValue: 20, label: '轮询间隔（秒）' },
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
      name: 'storage',
      type: 'group',
      label: '对象存储',
      fields: [
        { name: 'enabled', type: 'checkbox', defaultValue: false, label: '启用 S3 存储' },
        { name: 'bucket', type: 'text', label: 'S3 Bucket' },
        { name: 'region', type: 'text', defaultValue: 'us-east-1', label: '区域' },
        { name: 'accessKeyId', type: 'text', label: 'Access Key ID' },
        { name: 'secretAccessKey', type: 'text', label: 'Secret Access Key' },
        { name: 'prefix', type: 'text', defaultValue: 'media', label: '对象前缀' },
        { name: 'baseURL', type: 'text', label: 'CDN / 自定义 Base URL（可选）' },
        { name: 'signedDownloads', type: 'checkbox', defaultValue: true, label: '启用签名下载' },
      ],
    },
    {
      name: 'meshy',
      type: 'group',
      label: 'Meshy 接入',
      fields: [
        {
          name: 'apiKey',
          type: 'text',
          label: 'Meshy API Key',
          admin: {
            description: '填入 Meshy API Key 后，前台生成任务会优先走 Meshy 真正接口。',
          },
        },
        {
          name: 'baseURL',
          type: 'text',
          defaultValue: 'https://api.meshy.ai',
          label: 'Meshy API Base URL',
        },
        {
          name: 'textTo3DAiModel',
          type: 'select',
          defaultValue: 'latest',
          label: '文本生成 3D 模型',
          options: [
            { label: 'latest', value: 'latest' },
            { label: 'meshy-6', value: 'meshy-6' },
            { label: 'meshy-5', value: 'meshy-5' },
          ],
        },
        {
          name: 'imageTo3DAiModel',
          type: 'select',
          defaultValue: 'latest',
          label: '图像生成 3D 模型',
          options: [
            { label: 'latest', value: 'latest' },
            { label: 'meshy-6', value: 'meshy-6' },
            { label: 'meshy-5', value: 'meshy-5' },
          ],
        },
        { name: 'shouldTexture', type: 'checkbox', defaultValue: true, label: '生成纹理' },
        { name: 'enablePBR', type: 'checkbox', defaultValue: false, label: '输出 PBR 贴图' },
        { name: 'moderation', type: 'checkbox', defaultValue: false, label: '开启内容审核' },
        { name: 'imageEnhancement', type: 'checkbox', defaultValue: true, label: '图像增强' },
        { name: 'removeLighting', type: 'checkbox', defaultValue: true, label: '移除贴图高光阴影' },
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
