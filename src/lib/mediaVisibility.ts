import type { Where } from 'payload'

type MediaDocLike = {
  publicAccess?: boolean | null
  purpose?: null | string
}

export function isGuestReadableMedia(value: MediaDocLike | null | undefined) {
  if (!value) return false

  // Official public resources opt in via publicAccess.
  if (value.publicAccess === true) {
    return true
  }

  // User public resources are limited to preview media.
  return value.purpose === 'preview'
}

export function buildGuestReadableMediaWhere(): Where {
  return {
    or: [
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
  } satisfies Where
}
