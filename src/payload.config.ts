import { en } from 'payload/i18n/en'
import { zh } from 'payload/i18n/zh'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
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
import { EngagementViews } from './collections/EngagementViews'
import { GenerationTasks } from './collections/GenerationTasks'
import { HomepageItems } from './collections/HomepageItems'
import { Media } from './collections/Media'
import { ModelBundles } from './collections/ModelBundles'
import { ModelComments } from './collections/ModelComments'
import { ModelFavorites } from './collections/ModelFavorites'
import { ModelLikes } from './collections/ModelLikes'
import { Models } from './collections/Models'
import { PrintOrders } from './collections/PrintOrders'
import { Posts } from './collections/Posts'
import { ShopifyPayments } from './collections/ShopifyPayments'
import { TaskEvents } from './collections/TaskEvents'
import { Users } from './collections/Users'
import { UserFollows } from './collections/UserFollows'
import { aiWebhookEndpoint, meshyWebhookEndpoint, submitAITaskEndpoint, syncAITaskEndpoint } from './endpoints/aiTasks'
import {
  adminAdjustCreditsEndpoint,
  adminRepairTaskEndpoint,
  adminUpdateOrderStatusEndpoint,
} from './endpoints/adminRepair'
import {
  changeAccountPasswordEndpoint,
  followCreatorEndpoint,
  getAccountDashboardEndpoint,
  getAccountProfileEndpoint,
  getCreatorProfileEndpoint,
  listCurrentUserFollowsEndpoint,
  unfollowCreatorEndpoint,
  updateAccountProfileEndpoint,
} from './endpoints/account'
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
import { submitImageGenerationEndpoint } from './endpoints/imageGeneration'
import { mockModelDownloadEndpoint } from './endpoints/mockDownloads'
import { modelViewerEndpoint } from './endpoints/modelViewer'
import {
  createModelCommentEndpoint,
  deleteModelCommentEndpoint,
  listModelCommentsEndpoint,
  moderateModelCommentEndpoint,
} from './endpoints/modelComments'
import {
  favoriteModelEndpoint,
  getModelReactionStateEndpoint,
  likeModelEndpoint,
  listCurrentUserFavoritesEndpoint,
  unfavoriteModelEndpoint,
  unlikeModelEndpoint,
} from './endpoints/modelReactions'
import { getModelDetailEndpoint } from './endpoints/modelDetails'
import { recordEngagementViewEndpoint } from './endpoints/engagement'
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
import { readS3PluginBootstrapSettingsFromEnv } from './lib/s3Settings'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const appURL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
const defaultFromAddress = process.env.EMAIL_FROM_ADDRESS || 'no-reply@miniforge.local'
const defaultFromName = process.env.EMAIL_FROM_NAME || 'MiniForge AI 3D'
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

const s3Settings = readS3PluginBootstrapSettingsFromEnv()
const dbConfig = resolveDatabaseRuntimeConfig()
assertRuntimeSecurityGuards()
const payloadSecret = getValidatedPayloadSecret()

const db =
  dbConfig.provider === 'postgres'
    ? (await import('@payloadcms/db-postgres')).postgresAdapter({
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
      })
    : (await import('@payloadcms/db-sqlite')).sqliteAdapter({
        client: {
          url: dbConfig.url,
        },
        push: false,
      })

export default buildConfig({
  admin: {
    components: {
      beforeNavLinks: ['./components/admin/AdminNavQuickLinks'],
      graphics: {
        Icon: './components/admin/ThornsTavernBrand#ThornsTavernIcon',
        Logo: './components/admin/ThornsTavernBrand',
      },
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
    UserFollows,
    Media,
    GenerationTasks,
    TaskEvents,
    Models,
    ModelComments,
    ModelLikes,
    ModelFavorites,
    HomepageItems,
    Posts,
    Announcements,
    ModelBundles,
    Credits,
    CreditTransactions,
    CreditProducts,
    EngagementViews,
    BillingSubscriptions,
    Addresses,
    PrintOrders,
    ShopifyPayments,
  ],
  db,
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
    getAccountProfileEndpoint,
    updateAccountProfileEndpoint,
    changeAccountPasswordEndpoint,
    getAccountDashboardEndpoint,
    listCurrentUserFollowsEndpoint,
    listCurrentUserFavoritesEndpoint,
    getCreatorProfileEndpoint,
    followCreatorEndpoint,
    unfollowCreatorEndpoint,
    listModelCommentsEndpoint,
    createModelCommentEndpoint,
    deleteModelCommentEndpoint,
    moderateModelCommentEndpoint,
    getModelDetailEndpoint,
    getModelReactionStateEndpoint,
    likeModelEndpoint,
    unlikeModelEndpoint,
    favoriteModelEndpoint,
    unfavoriteModelEndpoint,
    recordEngagementViewEndpoint,
    adminUpdateOrderStatusEndpoint,
    adminAdjustCreditsEndpoint,
    adminRepairTaskEndpoint,
    submitAITaskEndpoint,
    submitImageGenerationEndpoint,
    syncAITaskEndpoint,
    meshyWebhookEndpoint,
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
  secret: payloadSecret,
  serverURL: appURL,
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
