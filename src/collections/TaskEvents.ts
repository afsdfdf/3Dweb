import type { CollectionConfig } from 'payload'

import { isStaff, ownerOrStaff } from '@/access'
import { adminLabelsKey, adminTextKey } from '@/lib/adminText'

export const TaskEvents: CollectionConfig = {
  slug: 'task-events',
  labels: adminLabelsKey('collections.taskEvents'),
  admin: {
    defaultColumns: ['eventType', 'task', 'provider', 'createdAt'],
    group: adminTextKey('groups.aiProduction'),
    useAsTitle: 'eventType',
  },
  access: {
    create: isStaff,
    delete: isStaff,
    read: ownerOrStaff('user'),
    update: isStaff,
  },
  defaultSort: '-createdAt',
  timestamps: true,
  fields: [
    { name: 'task', type: 'relationship', relationTo: 'generation-tasks', required: true, label: 'Task' },
    { name: 'user', type: 'relationship', relationTo: 'users', required: true, label: 'User' },
    {
      name: 'eventType',
      type: 'select',
      required: true,
      label: 'Event type',
      options: [
        { label: 'Queued', value: 'queued' },
        { label: 'Submitted', value: 'submitted' },
        { label: 'Polling', value: 'polling' },
        { label: 'Callback', value: 'callback' },
        { label: 'Completed', value: 'completed' },
        { label: 'Failed', value: 'failed' },
      ],
    },
    { name: 'provider', type: 'text', label: 'Provider' },
    { name: 'message', type: 'textarea', label: 'Message' },
    { name: 'payload', type: 'json', label: 'Raw payload' },
  ],
}
