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
        'Provider API keys should prefer environment variables or a secret manager. Meshy and image-generation keys may be stored here only when operators need backend-admin override; keys are never sent to the frontend.',
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
        {
          name: 'reserveOnSubmit',
          type: 'checkbox',
          defaultValue: true,
          label: 'Reserve credits on submit',
          admin: {
            description: 'Generation submissions always reserve credits before dispatch. This field is retained for legacy task snapshots.',
            readOnly: true,
          },
        },
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
          name: 'apiKeyMode',
          type: 'select',
          defaultValue: 'environment',
          label: 'API key mode',
          options: [
            { label: 'Environment variable', value: 'environment' },
            { label: 'Payload admin override', value: 'payload' },
          ],
          admin: {
            description:
              'Environment variables are safer. Use Payload admin override only when operators need to switch Meshy keys from the backend UI.',
          },
        },
        {
          name: 'apiKey',
          type: 'text',
          label: 'Meshy API key override',
          admin: {
            condition: (_, siblingData) => siblingData?.apiKeyMode === 'payload',
            description:
              'Stored in the Payload database and never sent to the frontend. Prefer MESHY_API_KEY in production when possible.',
          },
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
        { name: 'hdTexture', type: 'checkbox', defaultValue: false, label: 'Generate 4K base color texture' },
        { name: 'multiImageEnabled', type: 'checkbox', defaultValue: true, label: 'Enable Multi Image to 3D' },
        {
          name: 'pricing',
          type: 'group',
          label: 'Meshy credit pricing',
          fields: [
            { name: 'textTo3DCredits', type: 'number', defaultValue: 20, label: 'Text to 3D credits' },
            { name: 'imageTo3DCredits', type: 'number', defaultValue: 20, label: 'Image to 3D credits' },
            { name: 'multiImageTo3DCredits', type: 'number', defaultValue: 20, label: 'Multi Image to 3D credits' },
          ],
        },
        {
          name: 'modelType',
          type: 'select',
          defaultValue: 'standard',
          label: 'Model type',
          options: [
            { label: 'Standard', value: 'standard' },
            { label: 'Low poly', value: 'lowpoly' },
          ],
        },
        {
          name: 'topology',
          type: 'select',
          defaultValue: 'triangle',
          label: 'Topology',
          options: [
            { label: 'Triangle', value: 'triangle' },
            { label: 'Quad', value: 'quad' },
          ],
        },
        { name: 'targetPolycount', type: 'number', defaultValue: 30000, label: 'Target polycount' },
        {
          name: 'targetFormats',
          type: 'select',
          defaultValue: ['glb'],
          hasMany: true,
          label: 'Default target formats',
          options: [
            { label: 'GLB', value: 'glb' },
            { label: 'OBJ', value: 'obj' },
            { label: 'FBX', value: 'fbx' },
            { label: 'STL', value: 'stl' },
            { label: 'USDZ', value: 'usdz' },
            { label: '3MF', value: '3mf' },
          ],
        },
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
            { label: 'OpenAI compatible', value: 'openai-compatible' },
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
        {
          name: 'openAICompatible',
          type: 'group',
          label: 'OpenAI compatible',
          fields: [
            {
              name: 'baseURL',
              type: 'text',
              defaultValue: 'https://api.openai.com/v1',
              label: 'Base URL',
              admin: {
                description: 'Use the root OpenAI-compatible API URL, for example https://api.example.com/v1.',
              },
            },
            {
              name: 'model',
              type: 'text',
              defaultValue: 'gpt-image-1',
              label: 'Model',
            },
            {
              name: 'apiKey',
              type: 'text',
              label: 'API key',
              admin: {
                description: 'Optional. If empty, runtime falls back to OPENAI_IMAGE_COMPATIBLE_API_KEY, then OPENAI_API_KEY.',
              },
            },
            {
              name: 'size',
              type: 'text',
              defaultValue: '1024x1024',
              label: 'Image size',
              admin: {
                description: 'OpenAI-compatible image size, for example 1024x1024.',
              },
            },
          ],
        },
      ],
    },
  ],
}
