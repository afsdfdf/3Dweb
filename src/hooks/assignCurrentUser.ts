import type { CollectionBeforeChangeHook } from 'payload'

export const assignCurrentUser =
  (fieldName: string): CollectionBeforeChangeHook =>
  async ({ data, operation, req }) => {
    if (operation === 'create' && req.user) {
      return {
        ...data,
        [fieldName]: req.user.id,
      }
    }

    return data
  }
