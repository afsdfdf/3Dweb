import type { CollectionBeforeChangeHook } from 'payload'

type HomepageItemData = {
  _status?: string
  contentType?: 'announcement' | 'bundle' | 'custom' | 'model' | 'post'
  coverImage?: null | number | string
  customHref?: string | null
  linkedAnnouncement?: null | number | string
  linkedBundle?: null | number | string
  linkedModel?: null | number | string
  linkedPost?: null | number | string
  placement?: string
  publishAt?: null | string
}

const hasValue = (value: unknown) => {
  if (value === null || value === undefined) return false
  if (typeof value === 'string') return value.trim().length > 0
  return true
}

export const validateHomepageItem: CollectionBeforeChangeHook = async ({ data, originalDoc }) => {
  const nextData = (data || {}) as HomepageItemData
  const currentDoc = (originalDoc || {}) as HomepageItemData
  const contentType = nextData.contentType || currentDoc.contentType || 'custom'
  const linkedPost = nextData.linkedPost ?? currentDoc.linkedPost
  const linkedAnnouncement = nextData.linkedAnnouncement ?? currentDoc.linkedAnnouncement
  const linkedBundle = nextData.linkedBundle ?? currentDoc.linkedBundle
  const linkedModel = nextData.linkedModel ?? currentDoc.linkedModel
  const customHref = nextData.customHref ?? currentDoc.customHref
  const coverImage = nextData.coverImage ?? currentDoc.coverImage
  const placement = nextData.placement ?? currentDoc.placement ?? 'featured'

  const hasLinkedPost = hasValue(linkedPost)
  const hasLinkedAnnouncement = hasValue(linkedAnnouncement)
  const hasLinkedBundle = hasValue(linkedBundle)
  const hasLinkedModel = hasValue(linkedModel)
  const hasCustomHref = hasValue(customHref)
  const hasCoverImage = hasValue(coverImage)

  if (contentType === 'model' && !hasLinkedModel) {
    throw new Error('Homepage item with contentType "model" must link to a model.')
  }

  if (contentType === 'post' && !hasLinkedPost) {
    throw new Error('Homepage item with contentType "post" must link to a post.')
  }

  if (contentType === 'announcement' && !hasLinkedAnnouncement) {
    throw new Error('Homepage item with contentType "announcement" must link to an announcement.')
  }

  if (contentType === 'bundle' && !hasLinkedBundle) {
    throw new Error('Homepage item with contentType "bundle" must link to a model bundle.')
  }

  if (contentType === 'custom' && !hasCustomHref && !hasCoverImage) {
    throw new Error('Custom homepage items must provide either a customHref or a cover image.')
  }

  if (contentType !== 'post' && hasLinkedPost) {
    throw new Error('linkedPost can only be used when contentType is "post".')
  }

  if (contentType !== 'announcement' && hasLinkedAnnouncement) {
    throw new Error('linkedAnnouncement can only be used when contentType is "announcement".')
  }

  if (contentType !== 'bundle' && hasLinkedBundle) {
    throw new Error('linkedBundle can only be used when contentType is "bundle".')
  }

  if (contentType !== 'model' && hasLinkedModel) {
    throw new Error('linkedModel can only be used when contentType is "model".')
  }

  if (contentType !== 'custom' && hasCustomHref) {
    throw new Error('customHref can only be used when contentType is "custom".')
  }

  if ((placement === 'featured-rail' || placement === 'collection-shelf') && contentType === 'custom' && !hasCoverImage) {
    throw new Error('Custom homepage rail items must provide a cover image.')
  }

  if (nextData._status === 'published' && !hasValue(nextData.publishAt ?? currentDoc.publishAt)) {
    return {
      ...nextData,
      publishAt: new Date().toISOString(),
    }
  }

  return data
}
