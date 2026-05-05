import { adminPhraseTranslations } from '@/i18n/admin/phrases'

export type AdminPhraseLocale = 'en' | 'zh'
export type LocalizedAdminPhrase = Record<AdminPhraseLocale, string>

export const getAdminPhraseLocale = (language?: null | string): AdminPhraseLocale =>
  language?.toLowerCase().startsWith('zh') ? 'zh' : 'en'

export const getLocalizedAdminPhrase = (text: string, locale: AdminPhraseLocale = 'en'): string => {
  if (locale === 'en') {
    return text
  }

  return adminPhraseTranslations[text] || text
}

export const adminPhrase = (text: string): LocalizedAdminPhrase => ({
  en: text,
  zh: getLocalizedAdminPhrase(text, 'zh'),
})
