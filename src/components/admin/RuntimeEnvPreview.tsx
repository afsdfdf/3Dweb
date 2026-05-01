'use client'

import { useFormFields } from '@payloadcms/ui'

type RuntimeFieldValue = {
  value?: boolean | number | string | null
}

export function RuntimeEnvPreview() {
  const fields = useFormFields(([formFields]) => formFields as Record<string, RuntimeFieldValue>)

  const databaseUrlTemplate = String(fields.databaseUrlTemplate?.value || '')
  const nextPublicAppUrl = String(fields.nextPublicAppUrl?.value || 'http://localhost:3000')

  const envLines = [
    'DATABASE_PROVIDER=postgres',
    `DATABASE_URL=${databaseUrlTemplate || 'postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres?sslmode=require'}`,
    `NEXT_PUBLIC_APP_URL=${nextPublicAppUrl}`,
    `CANONICAL_APP_URL=${nextPublicAppUrl}`,
    'SUPABASE_URL=https://<project-ref>.supabase.co',
    'SUPABASE_SERVICE_ROLE_KEY=<set-in-hosting-platform-secret>',
  ]

  return (
    <div
      style={{
        background: '#0f172a',
        borderRadius: 12,
        color: '#e2e8f0',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, monospace',
        fontSize: 12,
        lineHeight: 1.7,
        padding: 14,
        whiteSpace: 'pre-wrap',
      }}
    >
      {envLines.join('\n')}
    </div>
  )
}

export default RuntimeEnvPreview
