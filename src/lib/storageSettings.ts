import type { Payload } from 'payload'

type StorageSettings = {
  baseURL: string
  bucket: string
  enabled: boolean
  hasRequiredConfig: boolean
  missingRequiredSettings: string[]
  prefix: string
  signedDownloads: boolean
  source: 'storage-settings'
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
  bucket: 'media',
  enabled: true,
  prefix: 'media',
  signedDownloads: true,
} as const
const STORAGE_SETTINGS_CACHE_TTL_MS = 30_000

type CachedStorageSettings = {
  expiresAt: number
  promise: Promise<StorageSettings>
}

const storageSettingsCache = new WeakMap<Payload, CachedStorageSettings>()

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
  bucket: string
  enabled: boolean
}) {
  if (!args.enabled) {
    return []
  }

  const missing: string[] = []

  if (!args.bucket) {
    missing.push('storage-settings.bucket')
  }

  return missing
}

async function readObjectStorageSettings(payload: Payload): Promise<StorageSettings> {
  const storage = toRecord(await readGlobal(payload, 'storage-settings'))
  const enabled = pickBoolean(storage.enabled, STORAGE_DEFAULTS.enabled)
  const bucket = pickString(storage.bucket, STORAGE_DEFAULTS.bucket)
  const prefix = pickString(storage.prefix, STORAGE_DEFAULTS.prefix)
  const baseURL = pickString(storage.baseURL, STORAGE_DEFAULTS.baseURL)
  const signedDownloads = pickBoolean(storage.signedDownloads, STORAGE_DEFAULTS.signedDownloads)
  const missingRequiredSettings = buildRuntimeMissingSettings({
    bucket,
    enabled,
  })

  return {
    baseURL,
    bucket,
    enabled,
    hasRequiredConfig: missingRequiredSettings.length === 0,
    missingRequiredSettings,
    prefix,
    signedDownloads,
    source: 'storage-settings',
  }
}

export async function getObjectStorageSettings(payload: Payload): Promise<StorageSettings> {
  const now = Date.now()
  const cached = storageSettingsCache.get(payload)
  if (cached && cached.expiresAt > now) {
    return cached.promise
  }

  const promise = readObjectStorageSettings(payload).catch((error) => {
    const current = storageSettingsCache.get(payload)
    if (current?.promise === promise) {
      storageSettingsCache.delete(payload)
    }
    throw error
  })

  storageSettingsCache.set(payload, {
    expiresAt: now + STORAGE_SETTINGS_CACHE_TTL_MS,
    promise,
  })

  return promise
}

export function describeObjectStorageConfigProblem(settings: Pick<StorageSettings, 'enabled' | 'hasRequiredConfig' | 'missingRequiredSettings'>) {
  if (!settings.enabled || settings.hasRequiredConfig) {
    return null
  }

  return `Storage Settings is enabled but incomplete. Missing: ${settings.missingRequiredSettings.join(', ')}.`
}
