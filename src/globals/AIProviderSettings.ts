import type { GlobalConfig } from 'payload'

import { isAdmin } from '@/access'
import { adminTextKey } from '@/lib/adminText'

export const AIProviderSettings: GlobalConfig = {
  slug: 'ai-provider-settings',
  label: adminTextKey('globals.aiProviderSettings.label'),
  admin: {
    description: adminTextKey('globals.aiProviderSettings.description'),
    group: adminTextKey('groups.aiProduction'),
  },
  access: {
    read: isAdmin,
    update: isAdmin,
  },
  fields: [
    {
      name: 'defaultProvider',
      type: 'select',
      defaultValue: 'custom',
      label: 'Default provider',
      options: [
        { label: 'Custom', value: 'custom' },
        { label: 'Meshy', value: 'meshy' },
        { label: 'Tripo', value: 'tripo' },
      ],
    },
    {
      name: 'mockMode',
      type: 'checkbox',
      defaultValue: true,
      label: 'Mock mode',
    },
    {
      name: 'credentialsNotice',
      type: 'textarea',
      label: 'Secret management notice',
      defaultValue:
        'Meshy API key, AI webhook secret, S3 access key ID, and S3 secret access key are no longer stored in Payload globals. Configure them in your hosting environment or secret manager instead.',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'polling',
      type: 'group',
      label: 'Polling',
      fields: [
        { name: 'enabled', type: 'checkbox', defaultValue: true, label: 'Enabled' },
        { name: 'intervalSeconds', type: 'number', defaultValue: 20, label: 'Interval seconds' },
        { name: 'timeoutMinutes', type: 'number', defaultValue: 8, label: 'Timeout minutes' },
      ],
    },
    {
      name: 'creditRules',
      type: 'group',
      label: 'Credit rules',
      fields: [
        { name: 'reserveOnSubmit', type: 'checkbox', defaultValue: true, label: 'Reserve credits on submit' },
        { name: 'refundOnFailure', type: 'checkbox', defaultValue: true, label: 'Refund on failure' },
      ],
    },
    {
      name: 'meshy',
      type: 'group',
      label: 'Meshy',
      fields: [
        {
          name: 'credentialsSource',
          type: 'text',
          defaultValue: 'environment',
          label: 'Credentials source',
        },
        {
          name: 'baseURL',
          type: 'text',
          defaultValue: 'https://api.meshy.ai',
          label: 'Meshy API base URL',
        },
        {
          name: 'textTo3DAiModel',
          type: 'select',
          defaultValue: 'latest',
          label: 'Text-to-3D model',
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
          label: 'Image-to-3D model',
          options: [
            { label: 'latest', value: 'latest' },
            { label: 'meshy-6', value: 'meshy-6' },
            { label: 'meshy-5', value: 'meshy-5' },
          ],
        },
        { name: 'shouldTexture', type: 'checkbox', defaultValue: true, label: 'Generate textures' },
        { name: 'enablePBR', type: 'checkbox', defaultValue: false, label: 'Enable PBR output' },
        { name: 'moderation', type: 'checkbox', defaultValue: false, label: 'Enable moderation' },
        { name: 'imageEnhancement', type: 'checkbox', defaultValue: true, label: 'Enable image enhancement' },
        { name: 'removeLighting', type: 'checkbox', defaultValue: true, label: 'Remove baked lighting' },
        { name: 'lastValidatedAt', type: 'date', label: 'Last validated at' },
        { name: 'lastRotatedAt', type: 'date', label: 'Last rotated at' },
      ],
    },
    {
      name: 'providers',
      type: 'array',
      label: 'Provider registry',
      fields: [
        {
          name: 'provider',
          type: 'select',
          required: true,
          label: 'Provider',
          options: [
            { label: 'Custom', value: 'custom' },
            { label: 'Meshy', value: 'meshy' },
            { label: 'Tripo', value: 'tripo' },
          ],
        },
        { name: 'baseURL', type: 'text', label: 'Base URL' },
        { name: 'submitPath', type: 'text', label: 'Submit path' },
        { name: 'statusPath', type: 'text', label: 'Status path' },
        { name: 'apiKeyHint', type: 'text', label: 'Environment variable hint' },
        { name: 'enabled', type: 'checkbox', defaultValue: true, label: 'Enabled' },
      ],
    },
    {
      name: 'imageGeneration',
      type: 'group',
      label: 'Image generation',
      fields: [
        {
          name: 'defaultProvider',
          type: 'select',
          defaultValue: 'gemini-official',
          label: 'Default provider',
          options: [
            { label: 'Gemini official', value: 'gemini-official' },
            { label: 'Gemini third-party', value: 'gemini-third-party' },
          ],
        },
        {
          name: 'timeoutSeconds',
          type: 'number',
          defaultValue: 60,
          label: 'Provider timeout seconds',
        },
        {
          name: 'official',
          type: 'group',
          label: 'Gemini official',
          fields: [
            {
              name: 'baseURL',
              type: 'text',
              defaultValue: 'https://generativelanguage.googleapis.com',
              label: 'Base URL',
            },
            {
              name: 'model',
              type: 'text',
              defaultValue: 'gemini-2.5-flash-image-preview',
              label: 'Model',
            },
            {
              name: 'apiKey',
              type: 'text',
              label: 'API key',
              admin: {
                description: 'Optional. If empty, runtime falls back to GEMINI_IMAGE_API_KEY.',
              },
            },
          ],
        },
        {
          name: 'thirdParty',
          type: 'group',
          label: 'Gemini third-party',
          fields: [
            { name: 'baseURL', type: 'text', label: 'Base URL' },
            { name: 'model', type: 'text', label: 'Model' },
            {
              name: 'apiKey',
              type: 'text',
              label: 'API key',
              admin: {
                description: 'Optional. If empty, runtime falls back to GEMINI_IMAGE_THIRD_PARTY_API_KEY.',
              },
            },
          ],
        },
      ],
    },
  ],
}
