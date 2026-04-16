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

async function readGlobal(payload: Payload, slug: string) {
  if (typeof payload?.findGlobal !== 'function') {
    return null
  }

  return payload
    .findGlobal({
      overrideAccess: true,
      slug: slug as never,
    })
    .catch(() => null)
}

export async function getS3StorageSettings(payload: Payload): Promise<StorageSettings> {
  const [storageSettings, legacyAIProviderSettings] = await Promise.all([
    readGlobal(payload, 'storage-settings'),
    readGlobal(payload, 'ai-provider-settings'),
  ])

  const storage = toRecord(storageSettings)
  const legacyStorage = toRecord(toRecord(legacyAIProviderSettings).storage)
  const resolvedStorage = Object.keys(storage).length > 0 ? storage : legacyStorage
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID || ''
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || ''
  const bucket = pickString(resolvedStorage.bucket, process.env.S3_BUCKET || '')
  const region = pickString(resolvedStorage.region, process.env.S3_REGION || 'us-east-1')
  const prefix = pickString(resolvedStorage.prefix, process.env.S3_PREFIX || 'media')
  const baseURL = pickString(resolvedStorage.baseURL, process.env.S3_CDN_URL || '')
  const signedDownloads = typeof resolvedStorage.signedDownloads === 'boolean' ? resolvedStorage.signedDownloads : true
  const enabledByConfig =
    typeof resolvedStorage.enabled === 'boolean'
      ? resolvedStorage.enabled
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
