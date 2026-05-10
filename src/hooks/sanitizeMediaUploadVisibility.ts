import type { CollectionBeforeChangeHook } from 'payload'

const customerCreatablePurposes = new Set(['asset', 'avatar', 'input', 'profile-banner'])

const isStaffRole = (role: unknown) => role === 'admin' || role === 'operator'

const canManageMediaVisibility = (args: {
  context?: Record<string, unknown>
  user?: { role?: string | null } | null
}) => {
  return isStaffRole(args.user?.role) || args.context?.allowManagedMediaVisibility === true
}

const normalizeCustomerPurpose = (value: unknown) => {
  const purpose = typeof value === 'string' ? value.trim() : ''
  return customerCreatablePurposes.has(purpose) ? purpose : 'asset'
}

export const sanitizeMediaUploadVisibility: CollectionBeforeChangeHook = ({
  context,
  data,
  operation,
  originalDoc,
  req,
}) => {
  if (!data || canManageMediaVisibility({ context, user: req.user })) {
    return data
  }

  const nextData = { ...data }

  if (operation === 'create') {
    nextData.purpose = normalizeCustomerPurpose(nextData.purpose)
    nextData.publicAccess = false
    return nextData
  }

  if (operation === 'update') {
    if ('purpose' in nextData) {
      nextData.purpose = originalDoc?.purpose ?? 'asset'
    }

    if ('publicAccess' in nextData) {
      nextData.publicAccess = originalDoc?.publicAccess ?? false
    }
  }

  return nextData
}
