import { zh } from 'payload/i18n/zh'
import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Addresses } from './collections/Addresses'
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
import { createPrintOrderEndpoint, syncPrintOrderEndpoint } from './endpoints/printOrders'
import { AIProviderSettings } from './globals/AIProviderSettings'
import { HomepageContent } from './globals/HomepageContent'
import { SiteSettings } from './globals/SiteSettings'
import { opsDashboardEndpoint } from './endpoints/opsDashboard'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

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
    Addresses,
    PrintOrders,
    ShopifyPayments,
  ],
  db: sqliteAdapter({
    client: {
      url: process.env.DATABASE_URL || 'file:./payload.db',
    },
    push: false,
  }),
  editor: lexicalEditor(),
  endpoints: [
    opsDashboardEndpoint,
    submitAITaskEndpoint,
    syncAITaskEndpoint,
    aiWebhookEndpoint,
    mockModelDownloadEndpoint,
    createPrintOrderEndpoint,
    syncPrintOrderEndpoint,
  ],
  globals: [SiteSettings, HomepageContent, AIProviderSettings],
  i18n: {
    fallbackLanguage: 'zh',
    supportedLanguages: {
      zh,
    },
  },
  plugins: [],
  secret: process.env.PAYLOAD_SECRET || '',
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
