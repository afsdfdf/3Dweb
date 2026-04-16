export const localeCookieName = 'miniforge-locale'

export const locales = ['en', 'zh'] as const

export type Locale = (typeof locales)[number]

export function isLocale(value: string | null | undefined): value is Locale {
  return value === 'en' || value === 'zh'
}

export function normalizeLocale(value: string | null | undefined): Locale {
  return isLocale(value) ? value : 'en'
}

export const localeLabels: Record<Locale, string> = {
  en: 'English',
  zh: '中文',
}
