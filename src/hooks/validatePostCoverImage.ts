import type { CollectionBeforeChangeHook } from 'payload'

import { isGuestReadableMedia } from '@/lib/mediaVisibility'

type PostCoverData = {
  _status?: null | string
  coverImage?: null | number | string | { id?: null | number | string; publicAccess?: boolean | null; purpose?: null | string }
  isVisible?: boolean | null
}

function getRelationId(value: PostCoverData['coverImage']) {
  if (typeof value === 'number' && Number.isFinite(value)) return value

  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }

  if (value && typeof value === 'object') {
    const id = value.id
    if (typeof id === 'number' && Number.isFinite(id)) return id
    if (typeof id === 'string' && id.trim()) {
      const parsed = Number(id)
      return Number.isFinite(parsed) ? parsed : null
    }
  }

  return null
}

export const validatePostCoverImage: CollectionBeforeChangeHook = async ({ data, originalDoc, req }) => {
  const nextData = (data || {}) as PostCoverData
  const currentDoc = (originalDoc || {}) as PostCoverData
  const nextStatus = nextData._status ?? currentDoc._status
  const nextIsVisible = nextData.isVisible ?? currentDoc.isVisible ?? true
  const coverImage = nextData.coverImage ?? currentDoc.coverImage

  if (nextStatus !== 'published' || nextIsVisible === false || !coverImage) {
    return data
  }

  if (typeof coverImage === 'object' && isGuestReadableMedia(coverImage)) {
    return data
  }

  const coverImageId = getRelationId(coverImage)
  if (!coverImageId) {
    return data
  }

  const media = await req.payload.findByID({
    collection: 'media',
    id: coverImageId,
    overrideAccess: false,
    req,
  })

  if (!isGuestReadableMedia(media)) {
    throw new Error('Cover image for published visible posts must be guest-readable through preview purpose or explicit public access.')
  }

  return data
}
