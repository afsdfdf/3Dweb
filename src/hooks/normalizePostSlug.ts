import type { CollectionBeforeValidateHook } from 'payload'

type PostSlugData = {
  slug?: unknown
  title?: unknown
}

function getTextCandidate(value: unknown) {
  if (typeof value === 'string') return value

  if (value && typeof value === 'object' && !Array.isArray(value)) {
    for (const item of Object.values(value)) {
      if (typeof item === 'string' && item.trim()) {
        return item
      }
    }
  }

  return ''
}

export function normalizePostSlugValue(value: unknown) {
  const source = getTextCandidate(value)
  if (!source.trim()) return ''

  return source
    .normalize('NFKC')
    .trim()
    .toLowerCase()
    .replace(/['\u2018\u2019]/g, '')
    .replace(/[^\p{Letter}\p{Number}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
}

export const validatePostSlug = (value: unknown) => {
  return normalizePostSlugValue(value) ? true : 'Use a URL slug with at least one letter or number.'
}

export const normalizePostSlugBeforeValidate: CollectionBeforeValidateHook = async ({ data, operation }) => {
  const nextData = (data || {}) as PostSlugData
  const normalizedInputSlug = normalizePostSlugValue(nextData.slug)

  if (normalizedInputSlug) {
    return {
      ...nextData,
      slug: normalizedInputSlug,
    }
  }

  const hasSlugInput = Object.prototype.hasOwnProperty.call(nextData, 'slug')
  if (operation === 'create' || hasSlugInput) {
    const generatedSlug = normalizePostSlugValue(nextData.title)

    if (generatedSlug) {
      return {
        ...nextData,
        slug: generatedSlug,
      }
    }
  }

  return data
}
