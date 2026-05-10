import assert from 'node:assert/strict'
import test from 'node:test'

import { Media } from '../src/collections/Media.ts'
import { sanitizeMediaUploadVisibility } from '../src/hooks/sanitizeMediaUploadVisibility.ts'
import {
  __setMediaUploadToSupabaseTestHooks,
  buildMediaStoragePath,
  uploadMediaToSupabase,
} from '../src/hooks/uploadMediaToSupabase.ts'

test('buildMediaStoragePath creates a sanitized Supabase object path', () => {
  const path = buildMediaStoragePath({
    filename: 'Starter Guide Cover.webp',
    prefix: '/media/',
    purpose: 'preview',
    randomSuffix: 'ABC 123',
    timestamp: 1777777777777,
    userId: 42,
  })

  assert.equal(path, 'media/preview/user-42/1777777777777-abc-123-Starter-Guide-Cover.webp')
})

test('uploadMediaToSupabase stores Payload Admin uploads in Supabase Storage', async () => {
  const uploads: Array<{ bucket: string; contentType: string; path: string; value: Buffer }> = []

  __setMediaUploadToSupabaseTestHooks({
    getRuntimeStorageSettings: async () => ({
      baseUrl: null,
      bucket: 'media',
      enabled: true,
      prefix: 'media',
      provider: 'supabase-storage',
      signedDownloads: true,
    }),
    now: () => 1777777777777,
    randomSuffix: () => 'cover-upload',
    uploadToSupabaseStorage: async ({ bucket, contentType, path, value }) => {
      uploads.push({
        bucket,
        contentType,
        path,
        value: Buffer.isBuffer(value) ? value : Buffer.from(String(value)),
      })

      return {
        path,
        publicUrl: `https://demo.supabase.co/storage/v1/object/public/${bucket}/${path}`,
      }
    },
  })

  try {
    const result = await uploadMediaToSupabase({
      data: {
        filename: 'starter-cover.webp',
        mimeType: 'image/webp',
        purpose: 'preview',
      },
      originalDoc: {},
      req: {
        file: {
          data: Buffer.from([1, 2, 3]),
          mimetype: 'image/webp',
          name: 'starter-cover.webp',
          size: 3,
        },
        user: {
          id: 9,
        },
      },
    } as never)

    assert.equal(uploads.length, 1)
    assert.equal(uploads[0]?.bucket, 'media')
    assert.equal(uploads[0]?.contentType, 'image/webp')
    assert.equal(uploads[0]?.path, 'media/preview/user-9/1777777777777-cover-upload-starter-cover.webp')
    assert.deepEqual([...uploads[0]!.value], [1, 2, 3])
    assert.equal(
      (result as { url?: string }).url,
      'https://demo.supabase.co/storage/v1/object/public/media/media/preview/user-9/1777777777777-cover-upload-starter-cover.webp',
    )
    assert.equal((result as { thumbnailURL?: string }).thumbnailURL, (result as { url?: string }).url)
  } finally {
    __setMediaUploadToSupabaseTestHooks(null)
  }
})

test('Media collection uses Supabase admin upload handling', () => {
  assert.equal(typeof Media.upload, 'object')
  assert.equal(Media.upload && typeof Media.upload === 'object' ? Media.upload.disableLocalStorage : false, true)
  assert.equal(Media.hooks?.beforeChange?.[0], sanitizeMediaUploadVisibility)
  assert.equal(Media.hooks?.beforeChange?.includes(uploadMediaToSupabase), true)

  const adminThumbnail = Media.upload && typeof Media.upload === 'object' ? Media.upload.adminThumbnail : null
  assert.equal(typeof adminThumbnail, 'function')
  assert.equal(
    typeof adminThumbnail === 'function' ? adminThumbnail({ doc: { thumbnailURL: '', url: 'https://cdn.example.com/cover.webp' } }) : null,
    'https://cdn.example.com/cover.webp',
  )
})

test('Media upload visibility sanitizes customer-created public media flags', async () => {
  const result = await sanitizeMediaUploadVisibility({
    data: {
      alt: 'Customer file',
      publicAccess: true,
      purpose: 'preview',
    },
    operation: 'create',
    req: {
      user: {
        id: 7,
        role: 'customer',
      },
    },
  } as never)

  assert.equal((result as { purpose?: string }).purpose, 'asset')
  assert.equal((result as { publicAccess?: boolean }).publicAccess, false)
})

test('Media upload visibility keeps safe customer purposes private', async () => {
  const result = await sanitizeMediaUploadVisibility({
    data: {
      alt: 'Reference input',
      publicAccess: true,
      purpose: 'input',
    },
    operation: 'create',
    req: {
      user: {
        id: 7,
        role: 'customer',
      },
    },
  } as never)

  assert.equal((result as { purpose?: string }).purpose, 'input')
  assert.equal((result as { publicAccess?: boolean }).publicAccess, false)
})

test('Media upload visibility allows staff and managed service writes', async () => {
  const staffResult = await sanitizeMediaUploadVisibility({
    data: {
      alt: 'Public preview',
      publicAccess: true,
      purpose: 'preview',
    },
    operation: 'create',
    req: {
      user: {
        id: 1,
        role: 'operator',
      },
    },
  } as never)
  const serviceResult = await sanitizeMediaUploadVisibility({
    context: {
      allowManagedMediaVisibility: true,
    },
    data: {
      alt: 'Generated preview',
      publicAccess: true,
      purpose: 'preview',
    },
    operation: 'create',
    req: {
      user: {
        id: 7,
        role: 'customer',
      },
    },
  } as never)

  assert.equal((staffResult as { purpose?: string }).purpose, 'preview')
  assert.equal((staffResult as { publicAccess?: boolean }).publicAccess, true)
  assert.equal((serviceResult as { purpose?: string }).purpose, 'preview')
  assert.equal((serviceResult as { publicAccess?: boolean }).publicAccess, true)
})

test('Media purpose and public access are staff-updatable only', () => {
  const purposeField = Media.fields.find((field: any) => field.name === 'purpose') as any
  const publicAccessField = Media.fields.find((field: any) => field.name === 'publicAccess') as any
  const customerArgs = {
    req: {
      user: {
        id: 7,
        role: 'customer',
      },
    },
  } as never
  const staffArgs = {
    req: {
      user: {
        id: 1,
        role: 'operator',
      },
    },
  } as never

  assert.equal(Boolean(purposeField.access.update(customerArgs)), false)
  assert.equal(Boolean(publicAccessField.access.update(customerArgs)), false)
  assert.equal(Boolean(purposeField.access.update(staffArgs)), true)
  assert.equal(Boolean(publicAccessField.access.update(staffArgs)), true)
})
