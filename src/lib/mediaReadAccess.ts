import type { Access, Where } from 'payload'

import { buildGuestReadableMediaWhere } from '@/lib/mediaVisibility'

type UserWithRole = {
  id: number | string
  role?: 'admin' | 'customer' | 'operator'
}

export const mediaReadAccess: Access = ({ req }) => {
  const user = (req.user as UserWithRole | null) ?? null

  if (user?.role === 'admin' || user?.role === 'operator') {
    return true
  }

  if (!user) {
    return buildGuestReadableMediaWhere()
  }

  return {
    or: [
      {
        owner: {
          equals: user.id,
        },
      },
      {
        publicAccess: {
          equals: true,
        },
      },
      {
        purpose: {
          equals: 'preview',
        },
      },
    ],
  } as Where
}
