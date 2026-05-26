import type { CollectionConfig } from 'payload'

import { isStaff } from '@/access'

export const ModelOptimizationJobs: CollectionConfig = {
  slug: 'model-optimization-jobs',
  admin: {
    defaultColumns: ['jobKey', 'model', 'status', 'mode', 'attempts', 'updatedAt'],
    group: 'AI Production',
    useAsTitle: 'jobKey',
  },
  access: {
    create: isStaff,
    delete: isStaff,
    read: isStaff,
    update: isStaff,
  },
  defaultSort: '-updatedAt',
  timestamps: true,
  fields: [
    { name: 'jobKey', type: 'text', required: true, unique: true, index: true, label: 'Job key' },
    { name: 'model', type: 'relationship', relationTo: 'models', required: true, index: true, label: 'Model' },
    { name: 'sourceFile', type: 'relationship', relationTo: 'media', required: true, label: 'Source file' },
    { name: 'outputFile', type: 'relationship', relationTo: 'media', label: 'Output file' },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      index: true,
      label: 'Status',
      options: ['pending', 'running', 'succeeded', 'failed', 'skipped'],
    },
    {
      name: 'mode',
      type: 'select',
      required: true,
      defaultValue: 'conservative',
      label: 'Mode',
      options: ['conservative', 'small'],
    },
    { name: 'attempts', type: 'number', defaultValue: 0, min: 0, label: 'Attempts' },
    { name: 'sourceUrl', type: 'text', label: 'Source URL' },
    { name: 'outputPath', type: 'text', label: 'Output path' },
    { name: 'outputUrl', type: 'text', label: 'Output URL' },
    { name: 'sourceSizeMb', type: 'number', label: 'Source size (MB)' },
    { name: 'outputSizeMb', type: 'number', label: 'Output size (MB)' },
    { name: 'reductionPercent', type: 'number', label: 'Reduction percent' },
    { name: 'workerRunId', type: 'text', index: true, label: 'Worker run ID' },
    { name: 'leaseOwner', type: 'text', label: 'Lease owner' },
    { name: 'leaseExpiresAt', type: 'date', index: true, label: 'Lease expires at' },
    { name: 'startedAt', type: 'date', label: 'Started at' },
    { name: 'completedAt', type: 'date', label: 'Completed at' },
    { name: 'lastError', type: 'textarea', label: 'Last error' },
    { name: 'metrics', type: 'json', label: 'Metrics' },
  ],
}
