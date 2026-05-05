'use client'

import { useTranslation } from '@payloadcms/ui'

import { getAdminPhraseLocale, getLocalizedAdminPhrase } from '@/lib/adminPhrase'

export function RuntimeConfigNotice() {
  const { i18n } = useTranslation()
  const locale = getAdminPhraseLocale((i18n as { language?: string }).language)
  const text = (value: string) => getLocalizedAdminPhrase(value, locale)

  return (
    <div
      style={{
        background: '#f8fafc',
        border: '1px solid rgba(15, 23, 42, 0.08)',
        borderRadius: 12,
        color: '#334155',
        fontSize: 13,
        lineHeight: 1.7,
        padding: 14,
      }}
    >
      <strong style={{ display: 'block', marginBottom: 6 }}>{text('Runtime deployment notice')}</strong>
      <div>{text('Use this page for deployment-time database connection details and application runtime variables.')}</div>
      <div>{text('Database credentials and other secrets should stay in your hosting platform environment, not in Payload content.')}</div>
      <div>{text('Changes here do not hot-switch the current Payload database. Restart the backend after updating deployment variables.')}</div>
    </div>
  )
}

export default RuntimeConfigNotice
