import type { CollectionConfig } from 'payload'

import { isStaff, ownerOrStaff } from '@/access'
import { adminLabelsKey, adminTextKey } from '@/lib/adminText'

export const GenerationTasks: CollectionConfig = {
  slug: 'generation-tasks',
  labels: adminLabelsKey('collections.generationTasks'),
  admin: {
    description: adminTextKey('collections.generationTasks.description'),
    group: adminTextKey('groups.aiProduction'),
    useAsTitle: 'taskCode',
    defaultColumns: ['taskCode', 'user', 'taskType', 'inputMode', 'status', 'progress', 'updatedAt'],
  },
  access: {
    create: isStaff,
    read: ownerOrStaff('user'),
    update: isStaff,
  },
  defaultSort: '-createdAt',
  timestamps: true,
  fields: [
    { name: 'taskCode', type: 'text', required: true, unique: true, label: 'Task code' },
    { name: 'user', type: 'relationship', relationTo: 'users', required: true, label: 'User' },
    {
      name: 'taskType',
      type: 'select',
      required: true,
      defaultValue: 'model-generation',
      label: 'Task type',
      options: [
        { label: 'Model generation', value: 'model-generation' },
        { label: 'Image generation', value: 'image-generation' },
      ],
    },
    {
      name: 'inputMode',
      type: 'select',
      required: true,
      label: 'Input mode',
      options: [
        { label: 'Image input', value: 'image' },
        { label: 'Text prompt', value: 'text' },
        { label: 'Hybrid input', value: 'hybrid' },
      ],
    },
    { name: 'prompt', type: 'textarea', label: 'Prompt' },
    { name: 'sourceImage', type: 'upload', relationTo: 'media', label: 'Source image' },
    {
      name: 'provider',
      type: 'select',
      defaultValue: 'custom',
      label: 'Provider',
      options: [
        { label: 'Meshy', value: 'meshy' },
        { label: 'Tripo', value: 'tripo' },
        { label: 'Gemini official', value: 'gemini-official' },
        { label: 'Gemini third-party', value: 'gemini-third-party' },
        { label: 'OpenAI compatible', value: 'openai-compatible' },
        { label: 'Custom', value: 'custom' },
      ],
    },
    { name: 'providerTaskId', type: 'text', index: true, label: 'Provider task ID' },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'queued',
      label: 'Status',
      options: [
        { label: 'Queued', value: 'queued' },
        { label: 'Processing', value: 'processing' },
        { label: 'Succeeded', value: 'succeeded' },
        { label: 'Failed', value: 'failed' },
        { label: 'Timed out', value: 'timeout' },
      ],
    },
    { name: 'progress', type: 'number', defaultValue: 0, min: 0, max: 100, label: 'Progress' },
    { name: 'parameterSnapshot', type: 'json', label: 'Parameter snapshot' },
    { name: 'creditsReserved', type: 'number', defaultValue: 0, label: 'Reserved credits' },
    { name: 'creditsSpent', type: 'number', defaultValue: 0, label: 'Spent credits' },
    { name: 'resultModel', type: 'relationship', relationTo: 'models', label: 'Result model' },
    { name: 'printRequested', type: 'checkbox', defaultValue: false, label: 'Print requested' },
    { name: 'startedAt', type: 'date', label: 'Started at' },
    { name: 'completedAt', type: 'date', label: 'Completed at' },
    { name: 'failureReason', type: 'textarea', label: 'Failure reason' },
    { name: 'callbackPayload', type: 'json', label: 'Callback payload' },
  ],
}
