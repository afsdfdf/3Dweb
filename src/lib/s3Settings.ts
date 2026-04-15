import type { Payload } from 'payload'

type StorageSettings = {
  accessKeyId: string
  baseURL: string
  bucket: string
  enabled: boolean
  prefix: string
  region: string
  secretAccessKey: string
  signedDownloads: boolean
}

const toRecord = (value: unknown): Record<string, unknown> => {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {}
}

const pickString = (value: unknown, fallback = '') => {
  return typeof value === 'string' ? value.trim() : fallback
}

export async function getS3StorageSettings(payload: Payload): Promise<StorageSettings> {
  const globalConfig = await payload
    .findGlobal({
      slug: 'ai-provider-settings',
    })
    .catch(() => null)

  const storage = toRecord(globalConfig?.storage)

  return {
    accessKeyId: pickString(storage.accessKeyId, process.env.AWS_ACCESS_KEY_ID || ''),
    baseURL: pickString(storage.baseURL, process.env.S3_CDN_URL || ''),
    bucket: pickString(storage.bucket, process.env.S3_BUCKET || ''),
    enabled:
      typeof storage.enabled === 'boolean'
        ? storage.enabled
        : Boolean(process.env.S3_BUCKET && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY),
    prefix: pickString(storage.prefix, process.env.S3_PREFIX || 'media'),
    region: pickString(storage.region, process.env.S3_REGION || 'us-east-1'),
    secretAccessKey: pickString(storage.secretAccessKey, process.env.AWS_SECRET_ACCESS_KEY || ''),
    signedDownloads: typeof storage.signedDownloads === 'boolean' ? storage.signedDownloads : true,
  }
}
