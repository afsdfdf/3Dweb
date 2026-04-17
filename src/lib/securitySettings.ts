import type { Payload } from 'payload'

const toRecord = (value: unknown): Record<string, unknown> => {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {}
}

const normalizeOrigin = (value: null | string | undefined) => {
  if (!value) return ''

  try {
    return new URL(value).origin.toLowerCase()
  } catch {
    return ''
  }
}

const normalizeHost = (value: null | string | undefined) => {
  return String(value || '').trim().toLowerCase()
}

export type SecuritySettingsSnapshot = {
  allowedMutationOrigins: string[]
  allowedRemoteAssetHosts: string[]
}

type PayloadWithGlobals = Pick<Payload, 'findGlobal'>

const hasFindGlobal = (payload: unknown): payload is PayloadWithGlobals => {
  return payload !== null && typeof payload === 'object' && 'findGlobal' in payload && typeof payload.findGlobal === 'function'
}

export async function readSecuritySettings(payload?: unknown) {
  if (!hasFindGlobal(payload)) {
    return null
  }

  return payload
    .findGlobal({
      overrideAccess: true,
      slug: 'security-settings' as never,
    })
    .catch(() => null)
}

export function getConfiguredMutationOriginsFromValue(value: unknown) {
  const settings = toRecord(value)
  const configured = Array.isArray(settings.allowedMutationOrigins) ? settings.allowedMutationOrigins : []

  return configured
    .map((item) => normalizeOrigin(toRecord(item).origin as string | undefined))
    .filter(Boolean)
}

export function getConfiguredRemoteAssetHostsFromValue(value: unknown) {
  const settings = toRecord(value)
  const configured = Array.isArray(settings.allowedRemoteAssetHosts) ? settings.allowedRemoteAssetHosts : []

  return configured
    .map((item) => normalizeHost(toRecord(item).host as string | undefined))
    .filter(Boolean)
}

export function getAllowedOriginsFromEnv() {
  return String(process.env.ALLOWED_REQUEST_ORIGINS || '')
    .split(',')
    .map((item) => normalizeOrigin(item))
    .filter(Boolean)
}

export function getAllowedRemoteAssetHostsFromEnv() {
  return String(process.env.AI_REMOTE_ASSET_ALLOWLIST || '')
    .split(',')
    .map((item) => normalizeHost(item))
    .filter(Boolean)
}

export async function getSecuritySettingsSnapshot(payload?: unknown): Promise<SecuritySettingsSnapshot> {
  const settings = await readSecuritySettings(payload)
  const allowedMutationOrigins = getConfiguredMutationOriginsFromValue(settings)
  const allowedRemoteAssetHosts = getConfiguredRemoteAssetHostsFromValue(settings)

  return {
    allowedMutationOrigins,
    allowedRemoteAssetHosts,
  }
}
