import pg from 'pg'
import { createClient } from '@supabase/supabase-js'

const { Client } = pg

async function main() {
  const supabaseUrl = process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const connectionString = process.env.POSTGRES_URL || process.env.POSTGRES_URL_NON_POOLING

  if (!supabaseUrl || !serviceRoleKey || !connectionString) {
    throw new Error('Missing SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or POSTGRES_URL.')
  }

  const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'media'
  const prefix = process.env.SUPABASE_STORAGE_PREFIX || 'media'
  const signedDownloads = process.env.SUPABASE_STORAGE_SIGNED_DOWNLOADS !== 'false'

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  const { data: buckets, error: listError } = await supabase.storage.listBuckets()
  if (listError) {
    throw new Error(listError.message)
  }

  if (!buckets.find((item) => item.name === bucket)) {
    const { error: createError } = await supabase.storage.createBucket(bucket, {
      public: true,
    })

    if (createError && !createError.message.toLowerCase().includes('already exists')) {
      throw new Error(createError.message)
    }
  }

  const parsed = new URL(connectionString)
  const client = new Client({
    database: parsed.pathname.replace(/^\//, '') || 'postgres',
    host: parsed.hostname,
    password: decodeURIComponent(parsed.password),
    port: Number(parsed.port || 5432),
    ssl: { rejectUnauthorized: false },
    user: decodeURIComponent(parsed.username),
  })

  try {
    await client.connect()
    await client.query(
      `
        update public.storage_settings
        set
          provider = 'supabase-storage',
          enabled = true,
          bucket = $1,
          prefix = $2,
          signed_downloads = $3,
          updated_at = timezone('utc', now())
        where key = 'default'
      `,
      [bucket, prefix, signedDownloads],
    )
  } finally {
    await client.end().catch(() => {})
  }

  console.log(`Configured Supabase native storage bucket: ${bucket}`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
