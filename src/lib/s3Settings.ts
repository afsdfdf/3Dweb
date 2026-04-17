import type { Payload } from 'payload'

type StorageSettings = {
  accessKeyId: string
  baseURL: string
  bucket: string
  enabled: boolean
  hasRequiredConfig: boolean
  missingRequiredSettings: string[]
  prefix: string
  region: string
  secretAccessKey: string
  signedDownloads: boolean
  source: 'storage-settings'
}

type S3PluginBootstrapSettings = {
  accessKeyId: string
  baseURL: string
  bucket: string
  enabled: boolean
  prefix: string
  region: string
  secretAccessKey: string
  signedDownloads: boolean
  source: 'env-bootstrap'
}

const toRecord = (value: unknown): Record<string, unknown> => {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {}
}

const pickString = (value: unknown, fallback = '') => {
  return typeof value === 'string' ? value.trim() : fallback
}

const pickBoolean = (value: unknown, fallback: boolean) => {
  return typeof value === 'boolean' ? value : fallback
}

const STORAGE_DEFAULTS = {
  baseURL: '',
  bucket: '',
  enabled: false,
  prefix: 'media',
  region: 'us-east-1',
  signedDownloads: true,
} as const

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

function buildRuntimeMissingSettings(args: {
  accessKeyId: string
  bucket: string
  enabled: boolean
  region: string
  secretAccessKey: string
}) {
  if (!args.enabled) {
    return []
  }

  const missing: string[] = []

  if (!args.bucket) {
    missing.push('storage-settings.bucket')
  }

  if (!args.region) {
    missing.push('storage-settings.region')
  }

  if (!args.accessKeyId) {
    missing.push('AWS_ACCESS_KEY_ID')
  }

  if (!args.secretAccessKey) {
    missing.push('AWS_SECRET_ACCESS_KEY')
  }

  return missing
}

function buildPluginBootstrapMissingSettings(args: {
  accessKeyId: string
  bucket: string
  region: string
  secretAccessKey: string
}) {
  const missing: string[] = []

  if (!args.bucket) {
    missing.push('S3_BUCKET')
  }

  if (!args.region) {
    missing.push('S3_REGION')
  }

  if (!args.accessKeyId) {
    missing.push('AWS_ACCESS_KEY_ID')
  }

  if (!args.secretAccessKey) {
    missing.push('AWS_SECRET_ACCESS_KEY')
  }

  return missing
}

export async function getS3StorageSettings(payload: Payload): Promise<StorageSettings> {
  const storage = toRecord(await readGlobal(payload, 'storage-settings'))
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID || ''
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || ''
  const enabled = pickBoolean(storage.enabled, STORAGE_DEFAULTS.enabled)
  const bucket = pickString(storage.bucket, STORAGE_DEFAULTS.bucket)
  const region = pickString(storage.region, STORAGE_DEFAULTS.region)
  const prefix = pickString(storage.prefix, STORAGE_DEFAULTS.prefix)
  const baseURL = pickString(storage.baseURL, STORAGE_DEFAULTS.baseURL)
  const signedDownloads = pickBoolean(storage.signedDownloads, STORAGE_DEFAULTS.signedDownloads)
  const missingRequiredSettings = buildRuntimeMissingSettings({
    accessKeyId,
    bucket,
    enabled,
    region,
    secretAccessKey,
  })

  return {
    accessKeyId,
    baseURL,
    bucket,
    enabled,
    hasRequiredConfig: missingRequiredSettings.length === 0,
    missingRequiredSettings,
    prefix,
    region,
    secretAccessKey,
    signedDownloads,
    source: 'storage-settings',
  }
}

export function readS3PluginBootstrapSettingsFromEnv(): S3PluginBootstrapSettings {
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID || ''
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || ''
  const bucket = process.env.S3_BUCKET || ''
  const region = process.env.S3_REGION || STORAGE_DEFAULTS.region
  const prefix = process.env.S3_PREFIX || STORAGE_DEFAULTS.prefix
  const baseURL = process.env.S3_CDN_URL || STORAGE_DEFAULTS.baseURL
  const signedDownloads = process.env.S3_SIGNED_DOWNLOADS !== 'false'

  const hasAnyBootstrapValue = [
    accessKeyId,
    secretAccessKey,
    bucket,
    process.env.S3_REGION,
    process.env.S3_PREFIX,
    process.env.S3_CDN_URL,
    process.env.S3_SIGNED_DOWNLOADS,
  ].some((value) => typeof value === 'string' && value.trim().length > 0)

  if (hasAnyBootstrapValue) {
    const missingRequiredSettings = buildPluginBootstrapMissingSettings({
      accessKeyId,
      bucket,
      region,
      secretAccessKey,
    })

    if (missingRequiredSettings.length > 0) {
      throw new Error(
        `Incomplete S3 plugin bootstrap env configuration. Missing: ${missingRequiredSettings.join(', ')}. ` +
          'Keep AWS secrets in env, and move non-sensitive runtime settings to the Storage Settings global.',
      )
    }
  }

  return {
    accessKeyId,
    baseURL,
    bucket,
    enabled: Boolean(bucket && region && accessKeyId && secretAccessKey),
    prefix,
    region,
    secretAccessKey,
    signedDownloads,
    source: 'env-bootstrap',
  }
}

export function describeS3StorageConfigProblem(settings: Pick<StorageSettings, 'enabled' | 'hasRequiredConfig' | 'missingRequiredSettings'>) {
  if (!settings.enabled || settings.hasRequiredConfig) {
    return null
  }

  return `Storage Settings is enabled but incomplete. Missing: ${settings.missingRequiredSettings.join(', ')}.`
}
