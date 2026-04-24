'use client'

import { useFormFields } from '@payloadcms/ui'

type RuntimeFieldValue = {
  value?: boolean | number | string | null
}

export function RuntimeEnvPreview() {
  const fields = useFormFields(([formFields]) => formFields as Record<string, RuntimeFieldValue>)

  const connectionMode = String(fields.databaseConnectionMode?.value || 'aws-rds-fields')
  const databaseUrlTemplate = String(fields.databaseUrlTemplate?.value || '')
  const awsRdsHost = String(fields.awsRdsHost?.value || '')
  const awsRdsPort = String(fields.awsRdsPort?.value || 5432)
  const awsRdsDbName = String(fields.awsRdsDbName?.value || 'payload_local_demo')
  const awsRdsUsername = String(fields.awsRdsUsername?.value || 'payload_admin')
  const awsRdsSslMode = String(fields.awsRdsSslMode?.value || 'require')
  const awsRdsSslRejectUnauthorized = String(Boolean(fields.awsRdsSslRejectUnauthorized?.value))
  const nextPublicAppUrl = String(fields.nextPublicAppUrl?.value || 'http://localhost:3000')

  const envLines =
    connectionMode === 'database-url'
      ? [
          'DATABASE_PROVIDER=postgres',
          `DATABASE_URL=${databaseUrlTemplate || 'postgresql://payload_admin:<password>@your-rds-endpoint:5432/payload_local_demo?sslmode=require'}`,
          `NEXT_PUBLIC_APP_URL=${nextPublicAppUrl}`,
        ]
      : [
          'DATABASE_PROVIDER=postgres',
          `AWS_RDS_HOST=${awsRdsHost || 'your-rds-endpoint.region.rds.amazonaws.com'}`,
          `AWS_RDS_PORT=${awsRdsPort}`,
          `AWS_RDS_DB_NAME=${awsRdsDbName}`,
          `AWS_RDS_USERNAME=${awsRdsUsername}`,
          'AWS_RDS_PASSWORD=<set-in-hosting-platform-secret>',
          `AWS_RDS_SSL_MODE=${awsRdsSslMode}`,
          `AWS_RDS_SSL_REJECT_UNAUTHORIZED=${awsRdsSslRejectUnauthorized}`,
          `NEXT_PUBLIC_APP_URL=${nextPublicAppUrl}`,
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
