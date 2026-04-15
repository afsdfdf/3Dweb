import type { Access, Where } from 'payload'

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
    return {
      purpose: {
        equals: 'preview',
      },
    } as Where
  }

  return {
    or: [
      {
        owner: {
          equals: user.id,
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
