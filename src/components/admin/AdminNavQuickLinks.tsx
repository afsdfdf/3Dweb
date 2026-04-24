'use client'

import Link from 'next/link'
import { useLocale } from '@payloadcms/ui'

import { getAdminLocale } from '@/lib/adminText'

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

const activeStyle = {
  ...linkStyle,
  background: 'var(--theme-success-150)',
  borderColor: 'var(--theme-success-400)',
}

export default function AdminNavQuickLinks() {
  const locale = useLocale()
  const language = getAdminLocale(locale)

  return (
    <div style={shellStyle}>
      <div style={panelStyle}>
        <p style={headingStyle}>{language === 'zh' ? '总览入口' : 'Overview'}</p>
        <div style={rowStyle}>
          <Link href="/admin" style={linkStyle}>
            {language === 'zh' ? '进入总览仪表板' : 'Open dashboard'}
          </Link>
        </div>
      </div>
    </div>
  )
}
