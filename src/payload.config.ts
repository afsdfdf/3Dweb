import { zh } from 'payload/i18n/zh'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Addresses } from './collections/Addresses'
import { BillingSubscriptions } from './collections/BillingSubscriptions'
import { CreditProducts } from './collections/CreditProducts'
import { CreditTransactions } from './collections/CreditTransactions'
import { Credits } from './collections/Credits'
import { GenerationTasks } from './collections/GenerationTasks'
import { Media } from './collections/Media'
import { Models } from './collections/Models'
import { PrintOrders } from './collections/PrintOrders'
import { ShopifyPayments } from './collections/ShopifyPayments'
import { TaskEvents } from './collections/TaskEvents'
import { Users } from './collections/Users'
import { aiWebhookEndpoint, submitAITaskEndpoint, syncAITaskEndpoint } from './endpoints/aiTasks'
import { mockModelDownloadEndpoint } from './endpoints/mockDownloads'
import { opsDashboardEndpoint } from './endpoints/opsDashboard'
import { createPrintOrderEndpoint, syncPrintOrderEndpoint } from './endpoints/printOrders'
import { stripeWebhookEndpoint } from './endpoints/stripeWebhook'
import {
  createSubscriptionCheckoutEndpoint,
  createSubscriptionPortalEndpoint,
  syncSubscriptionCheckoutEndpoint,
} from './endpoints/subscriptions'
import { AIProviderSettings } from './globals/AIProviderSettings'
import { HomepageContent } from './globals/HomepageContent'
import { RuntimeDeploymentSettings } from './globals/RuntimeDeploymentSettings'
import { SiteSettings } from './globals/SiteSettings'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const appURL = process.env.NEXT_PUBLIC_APP_URL || 'http://127.0.0.1:3000'
const defaultFromAddress = process.env.EMAIL_FROM_ADDRESS || 'no-reply@miniforge.local'
const defaultFromName = process.env.EMAIL_FROM_NAME || 'MiniForge AI 3D'
const smtpSecure = process.env.SMTP_SECURE === 'true'
const smtpPort = Number(process.env.SMTP_PORT || (smtpSecure ? 465 : 587))

type S3StorageSettings = {
  accessKeyId: string
  baseURL: string
  bucket: string
  enabled: boolean
  prefix: string
  region: string
  secretAccessKey: string
  signedDownloads: boolean
}

type DatabaseRuntimeConfig =
  | {
      connectionString: string
      provider: 'postgres'
      ssl:
        | false
        | {
            rejectUnauthorized: boolean
          }
    }
  | {
      provider: 'sqlite'
      url: string
    }

const isTruthy = (value: string | undefined) => ['1', 'true', 'yes', 'on'].includes(String(value || '').toLowerCase())

function readS3StorageSettings(): S3StorageSettings {
  return {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    baseURL: process.env.S3_CDN_URL || '',
    bucket: process.env.S3_BUCKET || '',
    enabled: Boolean(process.env.S3_BUCKET && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY),
    prefix: process.env.S3_PREFIX || 'media',
    region: process.env.S3_REGION || 'us-east-1',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    signedDownloads: process.env.S3_SIGNED_DOWNLOADS !== 'false',
  }
}

function buildAwsRdsConnectionString() {
  const host = process.env.AWS_RDS_HOST || ''
  const database = process.env.AWS_RDS_DB_NAME || process.env.AWS_RDS_DATABASE || ''
  const username = process.env.AWS_RDS_USERNAME || process.env.AWS_RDS_USER || ''
  const password = process.env.AWS_RDS_PASSWORD || ''

  if (!host || !database || !username || !password) {
    return ''
  }

  const port = Number(process.env.AWS_RDS_PORT || 5432)
  const sslmode = process.env.AWS_RDS_SSL_MODE || 'require'

  const url = new URL(`postgresql://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${host}:${port}/${database}`)
  url.searchParams.set('sslmode', sslmode)

  if (process.env.AWS_RDS_SCHEMA) {
    url.searchParams.set('schema', process.env.AWS_RDS_SCHEMA)
  }

  return url.toString()
}

function resolveDatabaseRuntimeConfig(): DatabaseRuntimeConfig {
  const explicitProvider = String(process.env.DATABASE_PROVIDER || process.env.DB_PROVIDER || '').toLowerCase()
  const directUrl = process.env.DATABASE_URL || ''
  const awsRdsUrl = buildAwsRdsConnectionString()
  const connectionString = directUrl || awsRdsUrl
  const shouldUsePostgres =
    explicitProvider === 'postgres' ||
    explicitProvider === 'postgresql' ||
    /^postgres(ql)?:\/\//i.test(connectionString) ||
    Boolean(awsRdsUrl)

  if (shouldUsePostgres && connectionString) {
    const sslDisabled = explicitProvider === 'postgres' || explicitProvider === 'postgresql'
      ? process.env.AWS_RDS_SSL === 'false' || process.env.POSTGRES_SSL === 'false'
      : false
    const rejectUnauthorized = isTruthy(process.env.AWS_RDS_SSL_REJECT_UNAUTHORIZED || process.env.POSTGRES_SSL_REJECT_UNAUTHORIZED)

    return {
      connectionString,
      provider: 'postgres',
      ssl: sslDisabled ? false : { rejectUnauthorized },
    }
  }

  return {
    provider: 'sqlite',
    url: process.env.DATABASE_URL || 'file:./payload.db',
  }
}

const emailAdapter = nodemailerAdapter({
  defaultFromAddress,
  defaultFromName,
  ...(process.env.SMTP_HOST
    ? {
        skipVerify: process.env.SMTP_SKIP_VERIFY === 'true',
        transportOptions: {
          auth:
            process.env.SMTP_USER && process.env.SMTP_PASS
              ? {
                  pass: process.env.SMTP_PASS,
                  user: process.env.SMTP_USER,
                }
              : undefined,
          host: process.env.SMTP_HOST,
          port: smtpPort,
          secure: smtpSecure,
        },
      }
    : {
        transportOptions: {
          jsonTransport: true,
        },
      }),
})

const s3Settings = readS3StorageSettings()
const dbConfig = resolveDatabaseRuntimeConfig()

export default buildConfig({
  admin: {
    components: {
      views: {
        dashboard: {
          Component: {
            exportName: 'OpsDashboardView',
            path: './components/admin/OpsDashboard',
          },
        },
      },
    },
    dateFormat: 'yyyy-MM-dd HH:mm',
    importMap: {
      baseDir: path.resolve(dirname),
    },
    user: Users.slug,
  },
  collections: [
    Users,
    Media,
    GenerationTasks,
    TaskEvents,
    Models,
    Credits,
    CreditTransactions,
    CreditProducts,
    BillingSubscriptions,
    Addresses,
    PrintOrders,
    ShopifyPayments,
  ],
  db:
    dbConfig.provider === 'postgres'
      ? postgresAdapter({
          migrationDir: path.resolve(dirname, 'migrations'),
          pool: {
            connectionString: dbConfig.connectionString,
            ssl: dbConfig.ssl,
          },
          push: false,
        })
      : sqliteAdapter({
          client: {
            url: dbConfig.url,
          },
          push: false,
        }),
  editor: lexicalEditor(),
  email: emailAdapter,
  endpoints: [
    opsDashboardEndpoint,
    submitAITaskEndpoint,
    syncAITaskEndpoint,
    aiWebhookEndpoint,
    mockModelDownloadEndpoint,
    createPrintOrderEndpoint,
    syncPrintOrderEndpoint,
    createSubscriptionCheckoutEndpoint,
    syncSubscriptionCheckoutEndpoint,
    createSubscriptionPortalEndpoint,
    stripeWebhookEndpoint,
  ],
  globals: [SiteSettings, HomepageContent, AIProviderSettings, RuntimeDeploymentSettings],
  i18n: {
    fallbackLanguage: 'zh' as const,
    supportedLanguages: {
      zh,
    },
  },
  plugins: [
    ...(s3Settings.enabled && s3Settings.bucket && s3Settings.region && s3Settings.accessKeyId && s3Settings.secretAccessKey
      ? [
          s3Storage({
            acl: 'private',
            bucket: s3Settings.bucket,
            collections: {
              media: {
                prefix: s3Settings.prefix,
                signedDownloads: {
                  shouldUseSignedURL: () => s3Settings.signedDownloads,
                },
              },
            },
            config: {
              credentials: {
                accessKeyId: s3Settings.accessKeyId,
                secretAccessKey: s3Settings.secretAccessKey,
              },
              region: s3Settings.region,
            },
            enabled: true,
          }),
        ]
      : []),
  ],
  secret: process.env.PAYLOAD_SECRET || '',
  serverURL: appURL,
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
