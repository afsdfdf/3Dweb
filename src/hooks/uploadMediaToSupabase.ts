import { readFile } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'

import type { CollectionBeforeChangeHook, PayloadRequest } from 'payload'

import {
  getRuntimeStorageSettings,
  uploadToSupabaseStorage,
  type RuntimeStorageSettings,
} from '@/lib/supabase/storage'

type MediaUploadData = Record<string, unknown> & {
  filename?: null | string
  mimeType?: null | string
  purpose?: null | string
  thumbnailURL?: null | string
  url?: null | string
}

type PayloadUploadFile = NonNullable<PayloadRequest['file']>

type MediaUploadTestHooks = {
  getRuntimeStorageSettings?: () => Promise<RuntimeStorageSettings>
  now?: () => number
  randomSuffix?: () => string
  uploadToSupabaseStorage?: typeof uploadToSupabaseStorage
}

const mediaPurposes = new Set(['asset', 'avatar', 'document', 'input', 'model', 'preview', 'profile-banner'])

const storageFolderByPurpose: Record<string, string> = {
  asset: 'asset',
  avatar: 'profile/avatar',
  document: 'document',
  input: 'input',
  model: 'model',
  preview: 'preview',
  'profile-banner': 'profile/profile-banner',
}

let mediaUploadTestHooks: MediaUploadTestHooks | null = null

export function __setMediaUploadToSupabaseTestHooks(hooks: MediaUploadTestHooks | null) {
  mediaUploadTestHooks = hooks
}

const readRuntimeStorageSettings = () =>
  (mediaUploadTestHooks?.getRuntimeStorageSettings || getRuntimeStorageSettings)()

const uploadRuntimeMedia = (args: Parameters<typeof uploadToSupabaseStorage>[0]) =>
  (mediaUploadTestHooks?.uploadToSupabaseStorage || uploadToSupabaseStorage)(args)

const sanitizeFilename = (value: string) => {
  const raw = value.trim() || 'media-upload'
  const extensionMatch = raw.match(/\.([a-zA-Z0-9]{1,12})$/)
  const extension = extensionMatch?.[1] ? `.${extensionMatch[1].toLowerCase()}` : ''
  const base = extension ? raw.slice(0, -extension.length) : raw
  const safeBase =
    base
      .replace(/[^a-zA-Z0-9._-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'media-upload'

  return `${safeBase}${extension}`
}

const sanitizePathPart = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

const sanitizePrefix = (value: string) => {
  const parts = value
    .split('/')
    .map((part) => sanitizePathPart(part))
    .filter(Boolean)

  return parts.join('/') || 'media'
}

const normalizePurpose = (...values: unknown[]) => {
  for (const value of values) {
    if (typeof value !== 'string') continue

    const normalized = value.trim()
    if (mediaPurposes.has(normalized)) {
      return normalized
    }
  }

  return 'asset'
}

const getUserPath = (userId: unknown) => {
  if (typeof userId === 'number' || typeof userId === 'string') {
    return sanitizePathPart(`user-${String(userId)}`) || 'user'
  }

  return 'admin'
}

async function getUploadBuffer(file: PayloadUploadFile) {
  if (Buffer.isBuffer(file.data) && file.data.byteLength > 0) {
    return file.data
  }

  if (file.tempFilePath) {
    const buffer = await readFile(file.tempFilePath)
    if (buffer.byteLength > 0) {
      return buffer
    }
  }

  if (Buffer.isBuffer(file.data)) {
    return file.data
  }

  return Buffer.from(file.data)
}

export function buildMediaStoragePath(args: {
  filename: string
  prefix: string
  purpose?: null | string
  randomSuffix?: string
  timestamp?: number
  userId?: unknown
}) {
  const prefix = sanitizePrefix(args.prefix)
  const purpose = normalizePurpose(args.purpose)
  const folder = storageFolderByPurpose[purpose] || storageFolderByPurpose.asset
  const userPath = getUserPath(args.userId)
  const timestamp = Number.isFinite(args.timestamp) ? Math.trunc(Number(args.timestamp)) : Date.now()
  const suffix = sanitizePathPart(args.randomSuffix || randomUUID().slice(0, 12)) || 'upload'
  const filename = sanitizeFilename(args.filename)

  return `${prefix}/${folder}/${userPath}/${timestamp}-${suffix}-${filename}`
}

export const uploadMediaToSupabase: CollectionBeforeChangeHook = async ({ data, originalDoc, req }) => {
  const file = req.file

  if (!file) {
    return data
  }

  const nextData = (data || {}) as MediaUploadData
  const currentDoc = (originalDoc || {}) as MediaUploadData
  const storage = await readRuntimeStorageSettings()

  if (!storage.enabled || storage.provider !== 'supabase-storage') {
    throw new Error('Supabase Storage is not enabled for media uploads.')
  }

  const uploadBuffer = await getUploadBuffer(file)
  if (uploadBuffer.byteLength <= 0) {
    throw new Error('Media upload file is empty.')
  }

  const filename = nextData.filename || file.name || 'media-upload'
  const contentType = nextData.mimeType || file.mimetype || 'application/octet-stream'
  const purpose = normalizePurpose(nextData.purpose, currentDoc.purpose)
  const uploaded = await uploadRuntimeMedia({
    bucket: storage.bucket,
    contentType,
    path: buildMediaStoragePath({
      filename,
      prefix: storage.prefix,
      purpose,
      randomSuffix: mediaUploadTestHooks?.randomSuffix?.(),
      timestamp: mediaUploadTestHooks?.now?.(),
      userId: req.user?.id,
    }),
    upsert: false,
    value: uploadBuffer,
  })

  const shouldUseAsThumbnail = contentType.toLowerCase().startsWith('image/')

  return {
    ...nextData,
    thumbnailURL: shouldUseAsThumbnail ? uploaded.publicUrl : null,
    url: uploaded.publicUrl,
  }
}
