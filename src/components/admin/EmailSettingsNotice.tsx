'use client'

import { useTranslation } from '@payloadcms/ui'

import { getAdminPhraseLocale, getLocalizedAdminPhrase } from '@/lib/adminPhrase'

export function EmailSettingsNotice() {
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
      <strong style={{ display: 'block', marginBottom: 6 }}>{text('SMTP credential notice')}</strong>
      <div>{text('Use this page for email branding, sender display information, and template copy.')}</div>
      <div>
        {text(
          'Real SMTP credentials should still be configured in environment variables such as SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS.',
        )}
      </div>
    </div>
  )
}

export default EmailSettingsNotice
