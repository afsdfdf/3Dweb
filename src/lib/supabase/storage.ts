import { queryPostgres } from '@/lib/postgres'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'

export type RuntimeStorageSettings = {
  baseUrl: string | null
  bucket: string
  enabled: boolean
  prefix: string
  provider: 'external' | 's3' | 'supabase-storage'
  signedDownloads: boolean
}

const DEFAULT_BUCKET = 'media'

export async function getRuntimeStorageSettings(): Promise<RuntimeStorageSettings> {
  const { rows } = await queryPostgres<Record<string, unknown>>(
    `
      select enabled, bucket, prefix, base_u_r_l as base_url, signed_downloads
      from public.storage_settings
      where id = 1
      limit 1
    `,
  )

  const row = rows[0]

  return {
    baseUrl: typeof row?.base_url === 'string' && row.base_url ? row.base_url : null,
    bucket: typeof row?.bucket === 'string' && row.bucket ? row.bucket : DEFAULT_BUCKET,
    enabled: row?.enabled === undefined ? true : Boolean(row.enabled),
    prefix: typeof row?.prefix === 'string' && row.prefix ? row.prefix : 'media',
    provider: 'supabase-storage',
    signedDownloads: row?.signed_downloads === undefined ? true : Boolean(row.signed_downloads),
  }
}

export async function ensureSupabaseStorageBucket(bucket: string) {
  const supabase = getSupabaseAdminClient()
  const { data: buckets, error: listError } = await supabase.storage.listBuckets()

  if (listError) {
    throw new Error(listError.message)
  }

  const found = buckets.find((item) => item.name === bucket)
  if (found) return found

  const { data, error } = await supabase.storage.createBucket(bucket, {
    public: true,
  })

  if (error) {
    if (error.message.toLowerCase().includes('already exists')) {
      return { name: bucket }
    }

    throw new Error(error.message)
  }

  return data
}

export async function uploadToSupabaseStorage(args: {
  bucket: string
  contentType: string
  path: string
  upsert?: boolean
  value: ArrayBuffer | Blob | Buffer | File | string
}) {
  await ensureSupabaseStorageBucket(args.bucket)

  const supabase = getSupabaseAdminClient()
  const { data, error } = await supabase.storage.from(args.bucket).upload(args.path, args.value, {
    contentType: args.contentType,
    upsert: args.upsert ?? false,
  })

  if (error) {
    throw new Error(error.message)
  }

  const publicUrl = supabase.storage.from(args.bucket).getPublicUrl(args.path).data.publicUrl

  return {
    path: data.path,
    publicUrl,
  }
}

export async function createSupabaseStorageSignedUrl(args: {
  bucket: string
  expiresIn?: number
  path: string
}) {
  const supabase = getSupabaseAdminClient()
  const { data, error } = await supabase.storage.from(args.bucket).createSignedUrl(args.path, args.expiresIn ?? 600)

  if (error) {
    throw new Error(error.message)
  }

  return data.signedUrl
}

export function getSupabaseStoragePublicUrl(args: {
  bucket: string
  path: string
}) {
  const supabase = getSupabaseAdminClient()
  return supabase.storage.from(args.bucket).getPublicUrl(args.path).data.publicUrl
}

export function getSupabaseStorageObjectPathFromURL(args: {
  bucket: string
  url: string
}) {
  const rawURL = args.url.trim()
  if (!rawURL) return null

  let parsed: URL
  try {
    parsed = new URL(rawURL)
  } catch {
    return null
  }

  const objectPrefixes = ['/storage/v1/object/public/', '/storage/v1/object/sign/']
  const matchedPrefix = objectPrefixes.find((prefix) => parsed.pathname.startsWith(prefix))
  if (!matchedPrefix) {
    return null
  }

  const pathWithBucket = parsed.pathname.slice(matchedPrefix.length)
  const bucketPrefix = `${encodeURIComponent(args.bucket)}/`
  const plainBucketPrefix = `${args.bucket}/`

  if (pathWithBucket.startsWith(bucketPrefix)) {
    return decodeURIComponent(pathWithBucket.slice(bucketPrefix.length))
  }

  if (pathWithBucket.startsWith(plainBucketPrefix)) {
    return decodeURIComponent(pathWithBucket.slice(plainBucketPrefix.length))
  }

  return null
}

export async function configureSupabaseNativeStorage(args?: { bucket?: string; prefix?: string; signedDownloads?: boolean }) {
  const bucket = args?.bucket || DEFAULT_BUCKET
  const prefix = args?.prefix || 'media'
  const signedDownloads = args?.signedDownloads ?? true

  await ensureSupabaseStorageBucket(bucket)

  await queryPostgres(
    `
      update public.storage_settings
      set
        enabled = true,
        bucket = $1,
        prefix = $2,
        signed_downloads = $3,
        updated_at = timezone('utc', now())
      where id = 1
    `,
    [bucket, prefix, signedDownloads],
  )
}
