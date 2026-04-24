import type { Access, Where } from 'payload'

type UserWithRole = {
  id: number | string
  role?: 'admin' | 'operator' | 'customer'
}

const getUser = (args: Parameters<Access>[0]): UserWithRole | null => {
  return (args.req.user as UserWithRole | null) ?? null
}

export const isLoggedIn: Access = (args) => {
  return Boolean(getUser(args))
}

export const isStaff: Access = (args) => {
  const user = getUser(args)

  return Boolean(user && ['admin', 'operator'].includes(user.role ?? 'customer'))
}

export const isAdmin: Access = (args) => {
  const user = getUser(args)

  return Boolean(user?.role === 'admin')
}

export const canAccessAdmin = ({ req }: { req: { user?: UserWithRole | null } }) => {
  return Boolean(req.user && ['admin', 'operator'].includes(req.user.role ?? 'customer'))
}

export const isSelfOrStaff: Access = (args) => {
  const user = getUser(args)

  if (!user) {
    return false
  }

  if (['admin', 'operator'].includes(user.role ?? 'customer')) {
    return true
  }

  return {
    id: {
      equals: user.id,
    },
  } satisfies Where
}

export const ownerOrStaff =
  (ownerField: string): Access =>
  (args) => {
    const user = getUser(args)

    if (!user) {
      return false
    }

    if (['admin', 'operator'].includes(user.role ?? 'customer')) {
      return true
    }

    return {
      [ownerField]: {
        equals: user.id,
      },
    } satisfies Where
  }

export const publicOwnerOrStaff =
  (ownerField: string): Access =>
  (args) => {
    const user = getUser(args)

    if (!user) {
      return {
        visibility: {
          equals: 'public',
        },
      } satisfies Where
    }

    if (['admin', 'operator'].includes(user.role ?? 'customer')) {
      return true
    }

    const ownershipOrPublic = {
      or: [
        {
          visibility: {
            equals: 'public',
          },
        },
        {
          [ownerField]: {
            equals: user.id,
          },
        },
      ],
    } satisfies Where

    return ownershipOrPublic
  }
