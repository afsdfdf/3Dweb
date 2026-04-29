import { en } from 'payload/i18n/en'
import { zh } from 'payload/i18n/zh'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Addresses } from './collections/Addresses'
import { BillingSubscriptions } from './collections/BillingSubscriptions'
import { Announcements } from './collections/Announcements'
import { CreditProducts } from './collections/CreditProducts'
import { CreditTransactions } from './collections/CreditTransactions'
import { Credits } from './collections/Credits'
import { GenerationTasks } from './collections/GenerationTasks'
import { HomepageItems } from './collections/HomepageItems'
import { Media } from './collections/Media'
import { ModelBundles } from './collections/ModelBundles'
import { Models } from './collections/Models'
import { PrintOrders } from './collections/PrintOrders'
import { Posts } from './collections/Posts'
import { ShopifyPayments } from './collections/ShopifyPayments'
import { TaskEvents } from './collections/TaskEvents'
import { Users } from './collections/Users'
import {
  forgotPasswordEndpoint,
  getCurrentAuthAccountEndpoint,
  loginAccountEndpoint,
  logoutAccountEndpoint,
  registerAccountEndpoint,
  resendVerificationEndpoint,
  resetPasswordEndpoint,
  verifyEmailEndpoint,
} from './endpoints/accountAuth'
import { aiWebhookEndpoint, submitAITaskEndpoint, syncAITaskEndpoint } from './endpoints/aiTasks'
import { mockModelDownloadEndpoint } from './endpoints/mockDownloads'
import { modelViewerEndpoint } from './endpoints/modelViewer'
import { opsDashboardEndpoint } from './endpoints/opsDashboard'
import { createPrintOrderEndpoint, syncPrintOrderEndpoint } from './endpoints/printOrders'
import { sessionLogoutEndpoint } from './endpoints/sessionLogout'
import { stripeWebhookEndpoint } from './endpoints/stripeWebhook'
import {
  createSubscriptionCheckoutEndpoint,
  createSubscriptionPortalEndpoint,
  syncSubscriptionCheckoutEndpoint,
} from './endpoints/subscriptions'
import { AIProviderSettings } from './globals/AIProviderSettings'
import { HomepageContent } from './globals/HomepageContent'
import { RuntimeDeploymentSettings } from './globals/RuntimeDeploymentSettings'
import { SecuritySettings } from './globals/SecuritySettings'
import { SiteSettings } from './globals/SiteSettings'
import { StorageSettings } from './globals/StorageSettings'
import { assertRuntimeSecurityGuards, getValidatedPayloadSecret } from './lib/envGuard'
import { resolveDatabaseRuntimeConfig } from './lib/databaseRuntimeConfig'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const appURL = process.env.NEXT_PUBLIC_APP_URL || 'http://127.0.0.1:3000'
const defaultFromAddress = process.env.EMAIL_FROM_ADDRESS || 'no-reply@thornstavern.com'
const defaultFromName = process.env.EMAIL_FROM_NAME || 'Thorns Tavern'
const smtpSecure = process.env.SMTP_SECURE === 'true'
const smtpPort = Number(process.env.SMTP_PORT || (smtpSecure ? 465 : 587))

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

const dbConfig = resolveDatabaseRuntimeConfig()
assertRuntimeSecurityGuards()
const payloadSecret = getValidatedPayloadSecret()

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
    HomepageItems,
    Posts,
    Announcements,
    ModelBundles,
    Credits,
    CreditTransactions,
    CreditProducts,
    BillingSubscriptions,
    Addresses,
    PrintOrders,
    ShopifyPayments,
  ],
  db:
    postgresAdapter({
      migrationDir: path.resolve(dirname, 'migrations'),
      pool: {
        connectionString: dbConfig.connectionString,
        connectionTimeoutMillis: dbConfig.pool.connectionTimeoutMillis,
        idleTimeoutMillis: dbConfig.pool.idleTimeoutMillis,
        max: dbConfig.pool.max,
        min: dbConfig.pool.min,
        ssl: dbConfig.ssl,
      },
      push: false,
    }),
  editor: lexicalEditor(),
  email: emailAdapter,
  endpoints: [
    opsDashboardEndpoint,
    registerAccountEndpoint,
    loginAccountEndpoint,
    logoutAccountEndpoint,
    getCurrentAuthAccountEndpoint,
    forgotPasswordEndpoint,
    resetPasswordEndpoint,
    verifyEmailEndpoint,
    resendVerificationEndpoint,
    submitAITaskEndpoint,
    syncAITaskEndpoint,
    aiWebhookEndpoint,
    modelViewerEndpoint,
    mockModelDownloadEndpoint,
    createPrintOrderEndpoint,
    syncPrintOrderEndpoint,
    createSubscriptionCheckoutEndpoint,
    syncSubscriptionCheckoutEndpoint,
    createSubscriptionPortalEndpoint,
    sessionLogoutEndpoint,
    stripeWebhookEndpoint,
  ],
  globals: [SiteSettings, HomepageContent, AIProviderSettings, StorageSettings, SecuritySettings, RuntimeDeploymentSettings],
  i18n: {
    fallbackLanguage: 'en' as const,
    supportedLanguages: {
      en,
      zh,
    },
  },
  localization: {
    defaultLocale: 'en',
    fallback: true,
    locales: ['en', 'zh'],
  },
  secret: payloadSecret,
  serverURL: appURL,
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
