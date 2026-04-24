import type { CollectionBeforeChangeHook } from 'payload'

import { isGuestReadableMedia } from '@/lib/mediaVisibility'

type ModelLike = {
  previewImage?: null | number | string | { id?: number | string | null; publicAccess?: boolean | null; purpose?: null | string }
  visibility?: null | string
}

function resolveMediaId(value: ModelLike['previewImage']) {
  if (value && typeof value === 'object' && 'id' in value) {
    return value.id ? Number(value.id) : null
  }

  if (typeof value === 'number' || typeof value === 'string') {
    return Number(value)
  }

  return null
}

export const validatePublicModelPreview: CollectionBeforeChangeHook = async ({ data, originalDoc, req }) => {
  const nextData = (data || {}) as ModelLike
  const currentDoc = (originalDoc || {}) as ModelLike
  const nextVisibility = nextData.visibility ?? currentDoc.visibility ?? 'private'
  const nextPreviewImage = nextData.previewImage ?? currentDoc.previewImage

  if (nextVisibility !== 'public') {
    return data
  }

  const mediaId = resolveMediaId(nextPreviewImage)

  if (!mediaId) {
    throw new Error('Public models must define a preview image.')
  }

  const media = await req.payload.findByID({
    collection: 'media',
    id: mediaId,
    overrideAccess: true,
    req,
  })

  if (!isGuestReadableMedia(media)) {
    throw new Error('Public models must use a preview image that is guest-readable through preview purpose or explicit public access.')
  }

  return data
}
