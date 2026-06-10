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
import { AvatarFrameStyles } from './collections/AvatarFrameStyles'
import { BillingSubscriptions } from './collections/BillingSubscriptions'
import { Announcements } from './collections/Announcements'
import { CreditProducts } from './collections/CreditProducts'
import { CreditTransactions } from './collections/CreditTransactions'
import { Credits } from './collections/Credits'
import { EngagementViews } from './collections/EngagementViews'
import { EmailVerificationCodes } from './collections/EmailVerificationCodes'
import { GenerationTasks } from './collections/GenerationTasks'
import { HomepageItems } from './collections/HomepageItems'
import { Media } from './collections/Media'
import { ModelComments } from './collections/ModelComments'
import { ModelFavorites } from './collections/ModelFavorites'
import { ModelLikes } from './collections/ModelLikes'
import { ModelBundles } from './collections/ModelBundles'
import { ModelOptimizationJobs } from './collections/ModelOptimizationJobs'
import { Models } from './collections/Models'
import { PrintOrders } from './collections/PrintOrders'
import { Posts } from './collections/Posts'
import { ShopifyPayments } from './collections/ShopifyPayments'
import { TaskEvents } from './collections/TaskEvents'
import { Users } from './collections/Users'
import { UserFollows } from './collections/UserFollows'
import { UserNotifications } from './collections/UserNotifications'
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
  updateAccountModelVisibilityEndpoint,
  updateAccountProfileEndpoint,
} from './endpoints/account'
import {
  forgotPasswordEndpoint,
  getAuthSettingsEndpoint,
  getCurrentAuthAccountEndpoint,
  loginAccountEndpoint,
  logoutAccountEndpoint,
  registerAccountEndpoint,
  resendVerificationEndpoint,
  resetPasswordEndpoint,
  sendRegistrationVerificationCodeEndpoint,
  verifyEmailEndpoint,
} from './endpoints/accountAuth'
import { aiWebhookEndpoint, meshyWebhookEndpoint, submitAITaskEndpoint, syncAITaskEndpoint } from './endpoints/aiTasks'
import { createCreditTopupCheckoutEndpoint, syncCreditTopupCheckoutEndpoint } from './endpoints/creditTopups'
import { recordEngagementViewEndpoint } from './endpoints/engagement'
import {
  listImageGenerationAssetsEndpoint,
  submitImageGenerationEndpoint,
  syncImageGenerationEndpoint,
} from './endpoints/imageGeneration'
import { modelDownloadEndpoint } from './endpoints/modelDownloads'
import {
  backfillModelOptimizationEndpoint,
  cronModelOptimizationDispatchEndpoint,
  dispatchModelOptimizationEndpoint,
  manualModelOptimizationEndpoint,
  modelOptimizationCallbackEndpoint,
  modelOptimizationStatusEndpoint,
} from './endpoints/modelOptimization'
import {
  createModelCommentEndpoint,
  deleteModelCommentEndpoint,
  listModelCommentsEndpoint,
  moderateModelCommentEndpoint,
} from './endpoints/modelComments'
import { getModelDetailEndpoint, listModelRelatedEndpoint } from './endpoints/modelDetails'
import {
  favoriteModelEndpoint,
  getModelReactionStateEndpoint,
  likeModelEndpoint,
  listCurrentUserFavoritesEndpoint,
  unfavoriteModelEndpoint,
  unlikeModelEndpoint,
} from './endpoints/modelReactions'
import { modelViewerEndpoint } from './endpoints/modelViewer'
import {
  getUnreadNotificationCountEndpoint,
  listAccountNotificationsEndpoint,
  markAllNotificationsReadEndpoint,
  markNotificationReadEndpoint,
} from './endpoints/notifications'
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
import { FormalPages } from './globals/FormalPages'
import { HomepageContent } from './globals/HomepageContent'
import { RuntimeDeploymentSettings } from './globals/RuntimeDeploymentSettings'
import { SecuritySettings } from './globals/SecuritySettings'
import { SiteSettings } from './globals/SiteSettings'
import { StorageSettings } from './globals/StorageSettings'
import { assertRuntimeSecurityGuards, getValidatedPayloadSecret } from './lib/envGuard'
import { resolveDatabaseRuntimeConfig } from './lib/databaseRuntimeConfig'
import { getCanonicalAppURL } from './lib/getCanonicalAppURL'
import { localizeCollectionAdminConfig, localizeGlobalAdminConfig } from './lib/payloadAdminI18n'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const appURL = getCanonicalAppURL()
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
    UserNotifications,
    AvatarFrameStyles,
    EmailVerificationCodes,
    Media,
    GenerationTasks,
    TaskEvents,
    Models,
    ModelOptimizationJobs,
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
  ].map(localizeCollectionAdminConfig),
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
    getAuthSettingsEndpoint,
    sendRegistrationVerificationCodeEndpoint,
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
    updateAccountModelVisibilityEndpoint,
    changeAccountPasswordEndpoint,
    getAccountDashboardEndpoint,
    listAccountNotificationsEndpoint,
    getUnreadNotificationCountEndpoint,
    markNotificationReadEndpoint,
    markAllNotificationsReadEndpoint,
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
    listModelRelatedEndpoint,
    getModelReactionStateEndpoint,
    likeModelEndpoint,
    unlikeModelEndpoint,
    favoriteModelEndpoint,
    unfavoriteModelEndpoint,
    recordEngagementViewEndpoint,
    adminUpdateOrderStatusEndpoint,
    adminAdjustCreditsEndpoint,
    adminRepairTaskEndpoint,
    listImageGenerationAssetsEndpoint,
    submitAITaskEndpoint,
    submitImageGenerationEndpoint,
    syncImageGenerationEndpoint,
    syncAITaskEndpoint,
    meshyWebhookEndpoint,
    aiWebhookEndpoint,
    modelViewerEndpoint,
    modelOptimizationCallbackEndpoint,
    dispatchModelOptimizationEndpoint,
    cronModelOptimizationDispatchEndpoint,
    backfillModelOptimizationEndpoint,
    manualModelOptimizationEndpoint,
    modelOptimizationStatusEndpoint,
    modelDownloadEndpoint,
    createPrintOrderEndpoint,
    syncPrintOrderEndpoint,
    createCreditTopupCheckoutEndpoint,
    syncCreditTopupCheckoutEndpoint,
    createSubscriptionCheckoutEndpoint,
    syncSubscriptionCheckoutEndpoint,
    createSubscriptionPortalEndpoint,
    sessionLogoutEndpoint,
    stripeWebhookEndpoint,
  ],
  globals: [SiteSettings, HomepageContent, FormalPages, AIProviderSettings, StorageSettings, SecuritySettings, RuntimeDeploymentSettings].map(
    localizeGlobalAdminConfig,
  ),
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
