import type { CollectionBeforeChangeHook } from 'payload'

import { isGuestReadableMedia } from '@/lib/mediaVisibility'

type BundleCoverData = {
  _status?: null | string
  coverImage?: null | number | string | { id?: null | number | string; publicAccess?: boolean | null; purpose?: null | string }
  heroImage?: null | number | string | { id?: null | number | string; publicAccess?: boolean | null; purpose?: null | string }
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

  if (nextStatus !== 'published' || nextIsVisible === false) {
    return data
  }

  const publicImages = [
    { label: 'Cover image', value: nextData.coverImage ?? currentDoc.coverImage },
    { label: 'Hero image', value: nextData.heroImage ?? currentDoc.heroImage },
  ]

  for (const image of publicImages) {
    if (!image.value) continue

    if (typeof image.value === 'object' && isGuestReadableMedia(image.value)) {
      continue
    }

    const imageId = getRelationId(image.value)
    if (!imageId) continue

    const media = await req.payload.findByID({
      collection: 'media',
      id: imageId,
      overrideAccess: true,
      req,
    })

    if (!isGuestReadableMedia(media)) {
      throw new Error(`${image.label} for published visible bundles must be guest-readable through preview purpose or explicit public access.`)
    }
  }

  return data
}
