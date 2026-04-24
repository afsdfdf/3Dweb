'use client'

import { useLocale } from '@payloadcms/ui'

import { getAdminLocale } from '@/lib/adminText'

export function EmailSettingsNotice() {
  const locale = getAdminLocale(useLocale())
  const copy =
    locale === 'zh'
      ? {
          bodyOne: '这里用于管理邮件品牌、发件显示信息和模板文案。',
          bodyTwo:
            '真实的 SMTP 凭据仍应通过环境变量配置，例如 SMTP_HOST、SMTP_PORT、SMTP_USER、SMTP_PASS。',
          title: 'SMTP 凭据说明',
        }
      : {
          bodyOne: 'Use this page for email branding, sender display information, and template copy.',
          bodyTwo:
            'Real SMTP credentials should still be configured in environment variables such as SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS.',
          title: 'SMTP credential notice',
        }

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
      <strong style={{ display: 'block', marginBottom: 6 }}>{copy.title}</strong>
      <div>{copy.bodyOne}</div>
      <div>{copy.bodyTwo}</div>
    </div>
  )
}

export default EmailSettingsNotice
