import type { CollectionBeforeChangeHook } from 'payload'

type PublishableData = {
  _status?: string
  [key: string]: unknown
}

const hasValue = (value: unknown) => {
  if (value === null || value === undefined) return false
  if (typeof value === 'string') return value.trim().length > 0
  return true
}

export const fillPublishAtOnPublish =
  (fieldName: string): CollectionBeforeChangeHook =>
  async ({ data, originalDoc }) => {
    const nextData = ((data || {}) as PublishableData)
    const currentDoc = ((originalDoc || {}) as PublishableData)
    const nextStatus = nextData._status || currentDoc._status
    const nextPublishAt = nextData[fieldName] ?? currentDoc[fieldName]

    if (nextStatus === 'published' && !hasValue(nextPublishAt)) {
      return {
        ...nextData,
        [fieldName]: new Date().toISOString(),
      }
    }

    return data
  }
