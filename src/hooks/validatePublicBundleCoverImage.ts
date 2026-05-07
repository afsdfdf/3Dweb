import type { CollectionBeforeChangeHook } from 'payload'

import { isGuestReadableMedia } from '@/lib/mediaVisibility'

type BundleCoverData = {
  _status?: null | string
  coverImage?: null | number | string | { id?: null | number | string; publicAccess?: boolean | null; purpose?: null | string }
  isVisible?: boolean | null
}

function getRelationId(value: BundleCoverData['coverImage']) {
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

export const validatePublicBundleCoverImage: CollectionBeforeChangeHook = async ({ data, originalDoc, req }) => {
  const nextData = (data || {}) as BundleCoverData
  const currentDoc = (originalDoc || {}) as BundleCoverData
  const nextStatus = nextData._status ?? currentDoc._status
  const nextIsVisible = nextData.isVisible ?? currentDoc.isVisible ?? true
  const nextCoverImage = nextData.coverImage ?? currentDoc.coverImage

  if (nextStatus !== 'published' || nextIsVisible === false || !nextCoverImage) {
    return data
  }

  if (typeof nextCoverImage === 'object' && isGuestReadableMedia(nextCoverImage)) {
    return data
  }

  const coverImageId = getRelationId(nextCoverImage)
  if (!coverImageId) {
    return data
  }

  const media = await req.payload.findByID({
    collection: 'media',
    id: coverImageId,
    overrideAccess: true,
    req,
  })

  if (!isGuestReadableMedia(media)) {
    throw new Error('Published visible bundles must use a cover image that is guest-readable through preview purpose or explicit public access.')
  }

  return data
}
