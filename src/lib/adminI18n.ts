import { adminEn } from '@/i18n/admin/en'
import { adminZh } from '@/i18n/admin/zh'

export type AdminLocale = 'en' | 'zh'
type AdminPath = readonly string[] | string
type AdminLocaleSource =
  | {
      code?: unknown
      i18n?: { language?: unknown } | null
      language?: unknown
      locale?: unknown
      req?: { i18n?: { language?: unknown } | null } | null
    }
  | null
  | string
  | undefined

export const adminI18n = {
  en: adminEn,
  zh: adminZh,
} as const

const normalizeAdminPath = (path: AdminPath): string[] =>
  Array.isArray(path) ? [...path] : typeof path === 'string' ? path.split('.').filter(Boolean) : []

const readAdminValue = (source: unknown, path: readonly string[]): unknown =>
  path.reduce<unknown>((value, segment) => {
    if (!value || typeof value !== 'object') {
      return undefined
    }

    return (value as Record<string, unknown>)[segment]
  }, source)

const firstLocaleString = (...values: unknown[]): null | string => {
  for (const value of values) {
    if (typeof value === 'string' && value.trim().length > 0) {
      return value
    }
  }

  return null
}

const resolveLocaleCandidate = (source?: AdminLocaleSource): null | string => {
  if (!source) {
    return null
  }

  if (typeof source === 'string') {
    return source
  }

  return firstLocaleString(
    source.locale,
    source.code,
    source.i18n?.language,
    source.language,
    source.req?.i18n?.language,
  )
}

export const getAdminLocale = (source?: AdminLocaleSource): AdminLocale => {
  const locale = resolveLocaleCandidate(source)

  if (!locale) {
    return 'en'
  }

  return locale.toLowerCase().startsWith('zh') ? 'zh' : 'en'
}

export const getAdminValue = (path: AdminPath, locale?: AdminLocaleSource): unknown => {
  const adminLocale = getAdminLocale(locale)
  const normalizedPath = normalizeAdminPath(path)

  return (
    readAdminValue(adminI18n[adminLocale], normalizedPath) ??
    readAdminValue(adminI18n.en, normalizedPath)
  )
}

export const getAdminText = (path: AdminPath, locale?: AdminLocaleSource): string => {
  const value = getAdminValue(path, locale)

  if (typeof value === 'string') {
    return value
  }

  const normalizedPath = normalizeAdminPath(path)

  return normalizedPath[normalizedPath.length - 1] ?? ''
}

export const adminTextKey = (path: AdminPath): Record<AdminLocale, string> => ({
  en: getAdminText(path, 'en'),
  zh: getAdminText(path, 'zh'),
})

export const adminLabelsKey = (path: AdminPath) => ({
  plural: adminTextKey(Array.isArray(path) ? [...path, 'plural'] : `${path}.plural`),
  singular: adminTextKey(Array.isArray(path) ? [...path, 'singular'] : `${path}.singular`),
})
