import type { CollectionBeforeChangeHook } from 'payload'

type HomepageItemData = {
  _status?: string
  contentType?: 'announcement' | 'bundle' | 'custom' | 'model' | 'post'
  customHref?: string | null
  linkedAnnouncement?: null | number | string
  linkedBundle?: null | number | string
  linkedModel?: null | number | string
  linkedPost?: null | number | string
  publishAt?: null | string
}

const hasValue = (value: unknown) => {
  if (value === null || value === undefined) return false
  if (typeof value === 'string') return value.trim().length > 0
  return true
}

export const validateHomepageItem: CollectionBeforeChangeHook = async ({ data, originalDoc }) => {
  const nextData = ((data || {}) as HomepageItemData)
  const currentDoc = (originalDoc || {}) as HomepageItemData
  const contentType = nextData.contentType || currentDoc.contentType || 'custom'
  const linkedPost = nextData.linkedPost ?? currentDoc.linkedPost
  const linkedAnnouncement = nextData.linkedAnnouncement ?? currentDoc.linkedAnnouncement
  const linkedBundle = nextData.linkedBundle ?? currentDoc.linkedBundle
  const linkedModel = nextData.linkedModel ?? currentDoc.linkedModel
  const customHref = nextData.customHref ?? currentDoc.customHref

  const hasLinkedPost = hasValue(linkedPost)
  const hasLinkedAnnouncement = hasValue(linkedAnnouncement)
  const hasLinkedBundle = hasValue(linkedBundle)
  const hasLinkedModel = hasValue(linkedModel)
  const hasCustomHref = hasValue(customHref)

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

  if (contentType === 'custom' && !hasCustomHref) {
    throw new Error('Homepage item with contentType "custom" must provide customHref.')
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

  if (nextData._status === 'published' && !hasValue(nextData.publishAt ?? currentDoc.publishAt)) {
    return {
      ...nextData,
      publishAt: new Date().toISOString(),
    }
  }

  return data
}
