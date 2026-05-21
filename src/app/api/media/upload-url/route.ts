import { NextRequest } from 'next/server'

import { rejectRateLimitedEndpoint } from '@/lib/endpointRateLimit'
import { getCachedPayload } from '@/lib/getCachedPayload'
import { resolvePayloadUserFromHeaders } from '@/lib/payloadAuthFallback'
import { rejectDisallowedMutationOrigin } from '@/lib/requestSecurity'
import { ensureSupabaseStorageBucket, getRuntimeStorageSettings } from '@/lib/supabase/storage'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'

const DEFAULT_SOURCE_IMAGE_UPLOAD_BYTES = 8 * 1024 * 1024
const configuredMaxUploadBytes = Number(process.env.NEXT_PUBLIC_MAX_UPLOAD_BYTES)
const MAX_SOURCE_IMAGE_UPLOAD_BYTES =
  Number.isFinite(configuredMaxUploadBytes) && configuredMaxUploadBytes > 0
    ? configuredMaxUploadBytes
    : DEFAULT_SOURCE_IMAGE_UPLOAD_BYTES
const allowedImageContentTypes = new Set(['image/jpeg', 'image/png'])

const sanitizeFilename = (value: string) =>
  value
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

const sanitizePathPart = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

export async function POST(request: NextRequest) {
  const payload = await getCachedPayload()
  const blocked = await rejectDisallowedMutationOrigin({
    headers: request.headers,
    payload,
  })

  if (blocked) {
    return blocked
  }

  const user = await resolvePayloadUserFromHeaders({
    headers: new Headers(request.headers),
    payload,
  })

  if (!user) {
    return Response.json({ message: 'Please sign in first.' }, { status: 401 })
  }

  const rateLimited = await rejectRateLimitedEndpoint({
    req: {
      headers: request.headers,
      user,
    } as never,
    scope: 'media-upload-url',
  })

  if (rateLimited) {
    return rateLimited
  }

  const body = await request.json().catch(() => ({}))
  const filename = sanitizeFilename(String(body.filename || 'reference-image')) || 'reference-image'
  const contentType = String(body.contentType || '').toLowerCase()
  const purpose = String(body.purpose || 'input')
  const size = Number(body.size || 0)
  const storage = await getRuntimeStorageSettings()

  if (purpose !== 'input') {
    return Response.json({ message: 'Unsupported upload purpose.' }, { status: 400 })
  }

  if (!allowedImageContentTypes.has(contentType)) {
    return Response.json({ message: 'Only JPEG and PNG reference images are supported by Meshy.' }, { status: 400 })
  }

  if (size <= 0 || size > MAX_SOURCE_IMAGE_UPLOAD_BYTES) {
    return Response.json(
      { message: `Reference image must be between 1 byte and ${Math.round(MAX_SOURCE_IMAGE_UPLOAD_BYTES / (1024 * 1024))}MB.` },
      { status: 400 },
    )
  }

  if (!storage.enabled || storage.provider !== 'supabase-storage') {
    return Response.json({ message: 'Supabase Storage is not enabled.' }, { status: 400 })
  }

  await ensureSupabaseStorageBucket(storage.bucket)

  const cleanPrefix = storage.prefix.replace(/^\/+|\/+$/g, '')
  const userPath = sanitizePathPart(`user-${user.id}`) || 'user'
  const objectPath = `${cleanPrefix}/input/${userPath}/${Date.now()}-${filename}`
  const supabase = getSupabaseAdminClient()
  const signed = await supabase.storage.from(storage.bucket).createSignedUploadUrl(objectPath)

  if (signed.error || !signed.data?.token) {
    return Response.json({ message: signed.error?.message || 'Failed to create upload URL.' }, { status: 500 })
  }

  const publicUrl = supabase.storage.from(storage.bucket).getPublicUrl(objectPath).data.publicUrl

  return Response.json({
    bucket: storage.bucket,
    contentType,
    path: objectPath,
    publicUrl,
    token: signed.data.token,
  })
}
