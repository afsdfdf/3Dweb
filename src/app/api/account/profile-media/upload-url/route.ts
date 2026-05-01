import { NextRequest } from 'next/server'

import { getCachedPayload } from '@/lib/getCachedPayload'
import { resolvePayloadUserFromHeaders } from '@/lib/payloadAuthFallback'
import { rejectDisallowedMutationOrigin } from '@/lib/requestSecurity'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { ensureSupabaseStorageBucket, getRuntimeStorageSettings } from '@/lib/supabase/storage'

const MAX_AVATAR_UPLOAD_BYTES = Number(process.env.MAX_AVATAR_UPLOAD_BYTES || 5 * 1024 * 1024)
const MAX_PROFILE_BANNER_UPLOAD_BYTES = Number(process.env.MAX_PROFILE_BANNER_UPLOAD_BYTES || 10 * 1024 * 1024)

const allowedProfileImageContentTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])
const allowedPurposes = new Set(['avatar', 'profile-banner'])
type ProfileMediaPurpose = 'avatar' | 'profile-banner'

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

  const body = await request.json().catch(() => ({}))
  const filename = sanitizeFilename(String(body.filename || 'profile-media')) || 'profile-media'
  const contentType = String(body.contentType || '').toLowerCase()
  const purpose = String(body.purpose || '')
  const size = Number(body.size || 0)
  const publicAccess = body.publicAccess === true

  if (!allowedPurposes.has(purpose)) {
    return Response.json({ message: 'Unsupported profile media purpose.' }, { status: 400 })
  }
  const mediaPurpose = purpose as ProfileMediaPurpose

  if (!allowedProfileImageContentTypes.has(contentType)) {
    return Response.json({ message: 'Only JPEG, PNG, and WebP profile images are supported.' }, { status: 400 })
  }

  const maxBytes = mediaPurpose === 'avatar' ? MAX_AVATAR_UPLOAD_BYTES : MAX_PROFILE_BANNER_UPLOAD_BYTES
  if (size <= 0 || size > maxBytes) {
    return Response.json(
      { message: `Profile media must be between 1 byte and ${Math.round(maxBytes / (1024 * 1024))}MB.` },
      { status: 400 },
    )
  }

  const storage = await getRuntimeStorageSettings()
  if (!storage.enabled || storage.provider !== 'supabase-storage') {
    return Response.json({ message: 'Supabase Storage is not enabled.' }, { status: 400 })
  }

  await ensureSupabaseStorageBucket(storage.bucket)

  const cleanPrefix = storage.prefix.replace(/^\/+|\/+$/g, '')
  const userPath = sanitizePathPart(`user-${user.id}`) || 'user'
  const objectPath = `${cleanPrefix}/profile/${mediaPurpose}/${userPath}/${Date.now()}-${filename}`
  const supabase = getSupabaseAdminClient()
  const signed = await supabase.storage.from(storage.bucket).createSignedUploadUrl(objectPath)

  if (signed.error || !signed.data?.token) {
    return Response.json({ message: signed.error?.message || 'Failed to create upload URL.' }, { status: 500 })
  }

  const publicUrl = supabase.storage.from(storage.bucket).getPublicUrl(objectPath).data.publicUrl
  const media = await payload.create({
    collection: 'media',
    data: {
      alt: String(body.alt || (mediaPurpose === 'avatar' ? 'User avatar' : 'User profile banner')),
      filename,
      filesize: size,
      mimeType: contentType,
      owner: Number(user.id),
      publicAccess,
      purpose: mediaPurpose,
      url: publicUrl,
    },
    overrideAccess: false,
    user,
  })

  return Response.json({
    bucket: storage.bucket,
    contentType,
    mediaId: media.id,
    path: objectPath,
    publicUrl,
    token: signed.data.token,
  })
}
