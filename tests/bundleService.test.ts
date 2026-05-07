import assert from 'node:assert/strict'
import test from 'node:test'

import { ModelBundles } from '../src/collections/ModelBundles.ts'
import { validatePublicBundleCoverImage } from '../src/hooks/validatePublicBundleCoverImage.ts'
import { getPublicBundleBySlug, getPublicBundleList } from '../src/lib/bundleService.ts'

type TestField = {
  fields?: TestField[]
  name?: string
}

const findField = (fields: TestField[], name: string) => {
  const field = fields.find((item) => item.name === name)
  assert.ok(field, `${name} field should exist`)
  return field
}

const makeBundle = (overrides: Record<string, unknown> = {}) => ({
  _status: 'published',
  bundleType: 'starter',
  cta: {
    mode: 'free',
    priceCredits: 0,
  },
  id: 10,
  isFeatured: true,
  isVisible: true,
  models: [
    {
      description: 'Public model',
      formats: [{ format: 'glb' }],
      id: 20,
      owner: {
        avatar: {
          url: '/api/media/file/creator-avatar.png',
        },
        displayName: 'Creator One',
        id: 7,
        profileVisibility: 'public',
      },
      previewImage: {
        url: '/api/media/file/public-preview.png',
      },
      printReady: true,
      tags: [{ label: 'Hero' }],
      title: 'Public Hero',
      visibility: 'public',
    },
    {
      description: 'Private model',
      id: 21,
      previewImage: {
        url: '/api/media/file/private-preview.png',
      },
      title: 'Private Hero',
      visibility: 'private',
    },
  ],
  slug: 'starter-pack',
  summary: 'A starter bundle.',
  tags: [{ label: 'Starter' }],
  title: 'Starter Pack',
  ...overrides,
})

test('ModelBundles exposes operator-editable bundle merchandising fields', () => {
  const fields = ModelBundles.fields as TestField[]
  const technicalSpecs = findField(fields, 'technicalSpecs')
  const license = findField(fields, 'license')
  const cta = findField(fields, 'cta')

  assert.ok(findField(fields, 'subtitle'))
  assert.ok(findField(fields, 'badgeLabel'))
  assert.ok(findField(fields, 'bundleType'))
  assert.ok(findField(fields, 'includedSummary'))
  assert.ok(findField(fields, 'releaseNotes'))
  assert.ok(findField(technicalSpecs.fields || [], 'supportedFormatsLabel'))
  assert.ok(findField(technicalSpecs.fields || [], 'assetReadinessLabel'))
  assert.ok(findField(license.fields || [], 'summary'))
  assert.ok(findField(cta.fields || [], 'mode'))
  assert.ok(findField(cta.fields || [], 'priceCredits'))
})

test('ModelBundles requires published cover media to be guest-readable', async () => {
  const result = await validatePublicBundleCoverImage({
    data: {
      _status: 'published',
      coverImage: 154,
      isVisible: true,
    },
    originalDoc: {},
    req: {
      payload: {
        findByID: async (args: unknown) => {
          assert.equal((args as { collection?: string }).collection, 'media')
          assert.equal((args as { id?: number }).id, 154)
          assert.equal((args as { overrideAccess?: boolean }).overrideAccess, true)

          return {
            publicAccess: true,
            purpose: 'preview',
          }
        },
      },
    },
  } as never)

  assert.deepEqual(result, {
    _status: 'published',
    coverImage: 154,
    isVisible: true,
  })
})

test('ModelBundles rejects published cover media that guests cannot read', async () => {
  await assert.rejects(
    () =>
      validatePublicBundleCoverImage({
        data: {
          _status: 'published',
          coverImage: 154,
          isVisible: true,
        },
        originalDoc: {},
        req: {
          payload: {
            findByID: async () => ({
              publicAccess: false,
              purpose: 'asset',
            }),
          },
        },
      } as never),
    /guest-readable/,
  )
})

test('getPublicBundleList maps public bundle cards and falls back to public model previews', async () => {
  const calls: unknown[] = []
  const payload = {
    find: async (args: unknown) => {
      calls.push(args)
      return {
        docs: [makeBundle({ coverImage: null })],
        hasNextPage: false,
        hasPrevPage: false,
        limit: 12,
        page: 1,
        totalDocs: 1,
        totalPages: 1,
      }
    },
  }

  const result = await getPublicBundleList(payload as never, { limit: 12 })
  const bundle = result.bundles[0]

  assert.equal(bundle.coverSrc, '/api/media/file/public-preview.png')
  assert.equal(bundle.href, '/bundles/starter-pack')
  assert.equal(bundle.modelCount, 1)
  assert.equal(bundle.modelCountLabel, '1 Model')
  assert.equal(bundle.bundleTypeLabel, 'Starter Pack')
  assert.equal(calls.length, 1)
  assert.equal((calls[0] as { fallbackLocale?: string }).fallbackLocale, 'en')
  assert.equal((calls[0] as { locale?: string }).locale, 'zh')
  assert.equal((calls[0] as { overrideAccess?: boolean }).overrideAccess, false)
})

test('getPublicBundleBySlug excludes private models from detail payloads', async () => {
  const calls: unknown[] = []
  const payload = {
    find: async (args: unknown) => {
      calls.push(args)
      if (calls.length === 1) {
        return {
          docs: [
            makeBundle({
              license: {
                summary: 'Personal previews only.',
                type: 'personal',
              },
              technicalSpecs: {
                supportedFormatsLabel: 'GLB',
              },
            }),
          ],
        }
      }

      return {
        docs: [makeBundle({ id: 11, slug: 'another-starter', title: 'Another Starter' })],
        hasNextPage: false,
        hasPrevPage: false,
        limit: 4,
        page: 1,
        totalDocs: 1,
        totalPages: 1,
      }
    },
  }

  const detail = await getPublicBundleBySlug(payload as never, 'starter-pack')

  assert.ok(detail)
  assert.equal(detail.models.length, 1)
  assert.equal(detail.models[0]?.title, 'Public Hero')
  assert.equal(detail.models[0]?.imageSrc, '/api/media/file/public-preview.png')
  assert.equal(detail.models[0]?.authorName, 'Creator One')
  assert.equal(detail.models[0]?.avatarSrc, '/api/media/file/creator-avatar.png')
  assert.equal(detail.license.summary, 'Personal previews only.')
  assert.equal(detail.technicalSpecs.formatsLabel, 'GLB')
  assert.equal(detail.relatedBundles.length, 1)
  assert.equal(calls.length, 2)
  assert.equal((calls[0] as { fallbackLocale?: string }).fallbackLocale, 'en')
  assert.equal((calls[0] as { locale?: string }).locale, 'zh')
  assert.equal((calls[0] as { overrideAccess?: boolean }).overrideAccess, false)
  assert.equal((calls[1] as { fallbackLocale?: string }).fallbackLocale, 'en')
  assert.equal((calls[1] as { locale?: string }).locale, 'zh')
  assert.equal((calls[1] as { overrideAccess?: boolean }).overrideAccess, false)
})
