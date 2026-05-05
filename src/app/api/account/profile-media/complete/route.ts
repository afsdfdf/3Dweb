import { NextRequest } from 'next/server'

import { getCachedPayload } from '@/lib/getCachedPayload'
import { resolvePayloadUserFromHeaders } from '@/lib/payloadAuthFallback'
import { getAvatarDerivativePath, inspectProfileImage, processAvatarImage } from '@/lib/profileMedia/avatarImage'
import { rejectDisallowedMutationOrigin } from '@/lib/requestSecurity'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { getRuntimeStorageSettings } from '@/lib/supabase/storage'

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

async function completeProfileMediaRecord(args: {
  filename: string
  mediaId: number
  mimeType: string
  ownerId: number
  payload: Awaited<ReturnType<typeof getCachedPayload>>
  publicAccess: boolean
  size: number
  thumbnailURL?: null | string
  url: string
  height: number
  width: number
}) {
  const rawClient = (args.payload.db.drizzle as { $client?: { query?: (...queryArgs: unknown[]) => Promise<{ rowCount?: number; rows: Array<{ id: number }> }> } })
    .$client

  if (!rawClient?.query) {
    throw new Error('Postgres client is not available for profile media records.')
  }

  const result = await rawClient.query(
    `
      UPDATE media
      SET
        filename = $1,
        filesize = $2,
        mime_type = $3,
        public_access = $4,
        url = $5,
        thumbnail_u_r_l = $6,
        width = $7,
        height = $8,
        updated_at = now()
      WHERE id = $9
        AND owner_id = $10
        AND purpose IN ('avatar', 'profile-banner')
      RETURNING id
    `,
    [
      args.filename,
      args.size,
      args.mimeType,
      args.publicAccess,
      args.url,
      args.thumbnailURL ?? null,
      args.width,
      args.height,
      args.mediaId,
      args.ownerId,
    ],
  )

  return result.rows[0] || null
}

async function createAvatarDerivative(args: {
  bucket: string
  input: Buffer
  objectPath: string
  supabase: ReturnType<typeof getSupabaseAdminClient>
}) {
  const processed = await processAvatarImage(args.input)
  const derivativePath = getAvatarDerivativePath(args.objectPath)
  const upload = await args.supabase.storage.from(args.bucket).upload(derivativePath, processed.buffer, {
    cacheControl: '31536000',
    contentType: processed.contentType,
    upsert: true,
  })

  if (upload.error) {
    throw new Error(upload.error.message || 'Processed avatar could not be saved.')
  }

  return {
    ...processed,
    path: derivativePath,
    publicUrl: args.supabase.storage.from(args.bucket).getPublicUrl(derivativePath).data.publicUrl,
  }
}

async function downloadProfileMediaObject(args: {
  bucket: string
  objectPath: string
  supabase: ReturnType<typeof getSupabaseAdminClient>
}) {
  const source = await args.supabase.storage.from(args.bucket).download(args.objectPath)

  if (source.error || !source.data) {
    throw new Error(source.error?.message || 'Uploaded profile media could not be read.')
  }

  return Buffer.from(await source.data.arrayBuffer())
}

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
  const mediaId = Number(body.mediaId || 0)
  const objectPath = String(body.path || '').replace(/^\/+/, '')
  const filename = sanitizeFilename(String(body.filename || 'profile-media')) || 'profile-media'
  const contentType = String(body.contentType || '').toLowerCase()
  const purpose = String(body.purpose || '')
  const size = Number(body.size || 0)
  const publicAccess = body.publicAccess === true

  if (!mediaId) {
    return Response.json({ message: 'Media record is required.' }, { status: 400 })
  }

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

  const cleanPrefix = storage.prefix.replace(/^\/+|\/+$/g, '')
  const userPath = sanitizePathPart(`user-${user.id}`) || 'user'
  const expectedPrefix = `${cleanPrefix}/profile/${mediaPurpose}/${userPath}/`

  if (!objectPath.startsWith(expectedPrefix)) {
    return Response.json({ message: 'Profile media path is not allowed.' }, { status: 400 })
  }

  const supabase = getSupabaseAdminClient()
  const exists = await supabase.storage.from(storage.bucket).exists(objectPath)
  if (exists.error || !exists.data) {
    return Response.json({ message: 'Uploaded profile media was not found.' }, { status: 400 })
  }

  const publicUrl = supabase.storage.from(storage.bucket).getPublicUrl(objectPath).data.publicUrl
  let actualImage: Awaited<ReturnType<typeof inspectProfileImage>> | null = null
  let thumbnailURL: null | string = null

  try {
    const input = await downloadProfileMediaObject({
      bucket: storage.bucket,
      objectPath,
      supabase,
    })
    actualImage = await inspectProfileImage(input)

    if (actualImage.size <= 0 || actualImage.size > maxBytes) {
      return Response.json(
        { message: `Profile media must be between 1 byte and ${Math.round(maxBytes / (1024 * 1024))}MB.` },
        { status: 400 },
      )
    }

    if (mediaPurpose === 'avatar') {
      const avatar = await createAvatarDerivative({
        bucket: storage.bucket,
        input,
        objectPath,
        supabase,
      })
      thumbnailURL = avatar.publicUrl
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Uploaded profile media could not be processed.'
    return Response.json({ message }, { status: 400 })
  }

  if (!actualImage) {
    return Response.json({ message: 'Uploaded profile media could not be processed.' }, { status: 400 })
  }

  const media = await completeProfileMediaRecord({
    filename,
    mediaId,
    mimeType: actualImage.contentType,
    ownerId: Number(user.id),
    payload,
    publicAccess,
    size: actualImage.size,
    thumbnailURL,
    url: publicUrl,
    height: actualImage.height,
    width: actualImage.width,
  })

  if (!media) {
    return Response.json({ message: 'Profile media record was not found.' }, { status: 404 })
  }

  return Response.json({
    mediaId: media.id,
    publicUrl: thumbnailURL || publicUrl,
    thumbnailURL,
  })
}
