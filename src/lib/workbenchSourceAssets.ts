import type { PayloadRequest } from 'payload'

import {
  getRuntimeStorageSettings,
  getSupabaseStorageObjectPathFromURL,
  getSupabaseStoragePublicUrl,
  type RuntimeStorageSettings,
} from '@/lib/supabase/storage'

type WorkbenchSourceAssetSecurityTestHooks = {
  getRuntimeStorageSettings?: typeof getRuntimeStorageSettings
  getSupabaseStoragePublicUrl?: typeof getSupabaseStoragePublicUrl
}

type ValidatedWorkbenchSourceImageAssets = {
  sourceImageAsset?: Record<string, unknown>
  sourceImageAssets?: Record<string, unknown>[]
}

let workbenchSourceAssetSecurityTestHooks: WorkbenchSourceAssetSecurityTestHooks | null = null

export function __setWorkbenchSourceAssetSecurityTestHooks(hooks: WorkbenchSourceAssetSecurityTestHooks | null) {
  workbenchSourceAssetSecurityTestHooks = hooks
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

const readString = (value: unknown) => {
  return typeof value === 'string' && value.trim() ? value.trim() : ''
}

const readPositiveNumber = (value: unknown) => {
  const numberValue = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : 0
}

const readMediaPublicUrl = (media: unknown) => {
  if (!isRecord(media)) return ''

  const url = readString(media.url)
  if (url) return url

  return readString(media.thumbnailURL)
}

const sanitizePathPart = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

const getStorageSettings = () => {
  return (workbenchSourceAssetSecurityTestHooks?.getRuntimeStorageSettings || getRuntimeStorageSettings)()
}

const getStoragePublicUrl = (args: { bucket: string; path: string }) => {
  return (workbenchSourceAssetSecurityTestHooks?.getSupabaseStoragePublicUrl || getSupabaseStoragePublicUrl)(args)
}

const getUserInputPrefixes = (args: { settings: RuntimeStorageSettings; userId: number | string }) => {
  const cleanPrefix = args.settings.prefix.replace(/^\/+|\/+$/g, '')
  const userPath = sanitizePathPart(`user-${args.userId}`) || 'user'
  const objectPrefix = [cleanPrefix, 'input', userPath].filter(Boolean).join('/')

  return objectPrefix ? [`${objectPrefix}/`, `/${objectPrefix}/`] : [`input/${userPath}/`, `/input/${userPath}/`]
}

const assertCurrentUserInputPath = (args: {
  path: string
  settings: RuntimeStorageSettings
  userId: number | string
}) => {
  const allowedPrefixes = getUserInputPrefixes({
    settings: args.settings,
    userId: args.userId,
  })

  if (!allowedPrefixes.some((prefix) => args.path.startsWith(prefix))) {
    throw new Error('Source image asset does not belong to the current user.')
  }
}

const assertMediaReadable = async (args: {
  mediaId: number
  req: PayloadRequest
}) => {
  const media = await args.req.payload
    .findByID({
      collection: 'media',
      depth: 0,
      id: args.mediaId,
      overrideAccess: false,
      req: args.req,
      user: args.req.user,
    })
    .catch(() => null)

  if (!media) {
    throw new Error('Source image media is not available to the current user.')
  }

  return media
}

async function validateWorkbenchSourceImageAsset(args: {
  asset: Record<string, unknown>
  req: PayloadRequest
  settings?: RuntimeStorageSettings
}): Promise<Record<string, unknown>> {
  if (!args.req.user?.id) {
    throw new Error('Please sign in first.')
  }

  const bucket = readString(args.asset.bucket)
  const path = readString(args.asset.path)
  const publicUrl = readString(args.asset.publicUrl)
  const mediaId = readPositiveNumber(args.asset.mediaId)

  if ((bucket && !path) || (!bucket && path)) {
    throw new Error('Source image asset storage reference is incomplete.')
  }

  if (bucket && path) {
    const settings = args.settings || (await getStorageSettings())

    if (!settings.enabled || settings.provider !== 'supabase-storage') {
      throw new Error('Source image uploads require Supabase Storage.')
    }

    if (bucket !== settings.bucket) {
      throw new Error('Source image asset bucket is not allowed.')
    }

    assertCurrentUserInputPath({
      path,
      settings,
      userId: args.req.user.id,
    })

    if (publicUrl) {
      const objectPath = getSupabaseStorageObjectPathFromURL({
        bucket: settings.bucket,
        url: publicUrl,
      })

      if (objectPath) {
        assertCurrentUserInputPath({
          path: objectPath,
          settings,
          userId: args.req.user.id,
        })
      }
    }

    return {
      ...args.asset,
      bucket,
      path,
      publicUrl: getStoragePublicUrl({ bucket, path }),
    }
  }

  if (mediaId) {
    const media = await assertMediaReadable({
      mediaId,
      req: args.req,
    })
    const mediaPublicUrl = readMediaPublicUrl(media)

    if (!mediaPublicUrl) {
      throw new Error('Source image media is missing a usable URL.')
    }

    return {
      contentType: readString((media as { mimeType?: unknown }).mimeType) || readString(args.asset.contentType),
      fileName: readString((media as { filename?: unknown }).filename) || readString(args.asset.fileName) || `media-${mediaId}`,
      mediaId,
      publicUrl: mediaPublicUrl,
    }
  }

  if (publicUrl) {
    throw new Error('Source image asset must be uploaded before generation.')
  }

  throw new Error('Source image asset is invalid.')
}

const getAssetKey = (asset: Record<string, unknown>) => {
  const mediaId = readPositiveNumber(asset.mediaId)
  if (mediaId) return `media:${mediaId}`

  const bucket = readString(asset.bucket)
  const path = readString(asset.path)
  if (bucket && path) return `${bucket}:${path}`

  return readString(asset.publicUrl)
}

export async function validateWorkbenchSourceImageAssets(args: {
  maxAssets?: number
  req: PayloadRequest
  sourceImageAsset?: unknown
  sourceImageAssets?: unknown
}): Promise<ValidatedWorkbenchSourceImageAssets> {
  const configuredMaxAssets = Number(args.maxAssets ?? 4)
  const maxAssets = Number.isFinite(configuredMaxAssets) ? Math.max(1, Math.floor(configuredMaxAssets)) : 4
  const rawAssets = [
    ...(isRecord(args.sourceImageAsset) ? [args.sourceImageAsset] : []),
    ...(Array.isArray(args.sourceImageAssets) ? args.sourceImageAssets.filter(isRecord) : []),
  ]
  const seen = new Set<string>()
  const settings = rawAssets.some((asset) => readString(asset.bucket) || readString(asset.path))
    ? await getStorageSettings()
    : undefined
  const validatedAssets: Record<string, unknown>[] = []

  for (const asset of rawAssets) {
    const validated = await validateWorkbenchSourceImageAsset({
      asset,
      req: args.req,
      settings,
    })
    const key = getAssetKey(validated)
    if (!key || seen.has(key)) continue

    seen.add(key)
    validatedAssets.push(validated)

    if (validatedAssets.length >= maxAssets) break
  }

  return {
    sourceImageAsset: validatedAssets[0],
    sourceImageAssets: validatedAssets.length > 0 ? validatedAssets : undefined,
  }
}

export function applyWorkbenchSourceImageAssetsToSnapshot(args: {
  parameterSnapshot?: unknown
  sourceImageAsset?: Record<string, unknown>
  sourceImageAssets?: Record<string, unknown>[]
}) {
  const snapshot = isRecord(args.parameterSnapshot) ? { ...args.parameterSnapshot } : {}
  delete snapshot.sourceImageAsset
  delete snapshot.sourceImageAssets

  const workbench = isRecord(snapshot.workbench) ? { ...snapshot.workbench } : null
  if (workbench) {
    delete workbench.sourceImageAssets
  }

  const nextSnapshot: Record<string, unknown> = {
    ...snapshot,
    ...(args.sourceImageAsset ? { sourceImageAsset: args.sourceImageAsset } : {}),
    ...(args.sourceImageAssets?.length ? { sourceImageAssets: args.sourceImageAssets } : {}),
  }

  if (workbench) {
    nextSnapshot.workbench = {
      ...workbench,
      ...(args.sourceImageAssets?.length ? { sourceImageAssets: args.sourceImageAssets } : {}),
    }
  }

  return nextSnapshot
}
