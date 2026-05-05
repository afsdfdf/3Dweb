'use client'

import { useTranslation } from '@payloadcms/ui'
import Link from 'next/link'

import { getAdminPhraseLocale, getLocalizedAdminPhrase } from '@/lib/adminPhrase'

const shellStyle = {
  display: 'grid',
  gap: 12,
  marginBottom: 16,
}

const panelStyle = {
  background: 'var(--theme-elevation-50)',
  border: '1px solid var(--theme-elevation-150)',
  borderRadius: 14,
  padding: 12,
}

const headingStyle = {
  color: 'var(--theme-text)',
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: '0.04em',
  margin: 0,
  textTransform: 'uppercase' as const,
}

const rowStyle = {
  alignItems: 'center',
  display: 'flex',
  flexWrap: 'wrap' as const,
  gap: 8,
  marginTop: 10,
}

const linkStyle = {
  border: '1px solid var(--theme-elevation-200)',
  borderRadius: 999,
  color: 'var(--theme-text)',
  fontSize: 13,
  fontWeight: 600,
  padding: '6px 12px',
  textDecoration: 'none',
}

export default function AdminNavQuickLinks() {
  const { i18n } = useTranslation()
  const locale = getAdminPhraseLocale((i18n as { language?: string }).language)
  const text = (value: string) => getLocalizedAdminPhrase(value, locale)

  return (
    <div style={shellStyle}>
      <div style={panelStyle}>
        <p style={headingStyle}>{text('Overview')}</p>
        <div style={rowStyle}>
          <Link href="/admin" style={linkStyle}>
            {text('Open dashboard')}
          </Link>
        </div>
      </div>
    </div>
  )
}
