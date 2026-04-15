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
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID || ''
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || ''
  const bucket = pickString(storage.bucket, process.env.S3_BUCKET || '')
  const region = pickString(storage.region, process.env.S3_REGION || 'us-east-1')
  const prefix = pickString(storage.prefix, process.env.S3_PREFIX || 'media')
  const baseURL = pickString(storage.baseURL, process.env.S3_CDN_URL || '')
  const signedDownloads = typeof storage.signedDownloads === 'boolean' ? storage.signedDownloads : true
  const enabledByConfig =
    typeof storage.enabled === 'boolean'
      ? storage.enabled
      : Boolean(bucket && accessKeyId && secretAccessKey)

  return {
    accessKeyId,
    baseURL,
    bucket,
    enabled: enabledByConfig && Boolean(bucket && region && accessKeyId && secretAccessKey),
    prefix,
    region,
    secretAccessKey,
    signedDownloads,
  }
}

