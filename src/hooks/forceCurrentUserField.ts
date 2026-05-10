import type { CollectionBeforeChangeHook } from 'payload'

type ForceCurrentUserFieldOptions = {
  clearWhenAnonymous?: boolean
}

const isStaffRole = (role: unknown) => role === 'admin' || role === 'operator'

export const forceCurrentUserField =
  (fieldName: string, options: ForceCurrentUserFieldOptions = {}): CollectionBeforeChangeHook =>
  ({ data, operation, req }) => {
    if (!data || isStaffRole(req.user?.role)) {
      return data
    }

    if (operation === 'create') {
      return {
        ...data,
        [fieldName]: req.user?.id ?? (options.clearWhenAnonymous ? null : data[fieldName]),
      }
    }

    if (operation === 'update' && fieldName in data) {
      return {
        ...data,
        [fieldName]: req.user?.id ?? (options.clearWhenAnonymous ? null : data[fieldName]),
      }
    }

    return data
  }
