import assert from 'node:assert/strict'
import test from 'node:test'

import { Posts } from '../src/collections/Posts.ts'
import { revalidateBlogPostCacheAfterChange, revalidateBlogPostCacheAfterDelete } from '../src/hooks/revalidateBlogPostCache.ts'
import { normalizePostSlugBeforeValidate, normalizePostSlugValue } from '../src/hooks/normalizePostSlug.ts'
import { validatePostCoverImage } from '../src/hooks/validatePostCoverImage.ts'

test('Posts public read access requires published visible non-future posts', async () => {
  const readAccess = Posts.access?.read
  assert.equal(typeof readAccess, 'function')

  const result = await readAccess?.({
    req: {},
  } as never)

  assert.deepEqual(result, {
    and: [
      {
        _status: {
          equals: 'published',
        },
      },
      {
        isVisible: {
          equals: true,
        },
      },
      {
        or: [
          {
            publishedAt: {
              exists: false,
            },
          },
          {
            publishedAt: {
              less_than_equal: (result as { and: { or?: { publishedAt?: { less_than_equal?: string } }[] }[] }).and[2].or?.[1]
                ?.publishedAt?.less_than_equal,
            },
          },
        ],
      },
    ],
  })
})

test('Posts staff read access can read all posts', async () => {
  const result = await Posts.access?.read?.({
    req: {
      user: {
        id: 1,
        role: 'operator',
      },
    },
  } as never)

  assert.equal(result, true)
})

test('Posts content changes revalidate public blog pages', () => {
  assert.ok(Posts.hooks?.afterChange?.includes(revalidateBlogPostCacheAfterChange))
  assert.ok(Posts.hooks?.afterDelete?.includes(revalidateBlogPostCacheAfterDelete))
})

test('Posts normalizes operator-entered slugs before validation', async () => {
  assert.ok(Posts.hooks?.beforeValidate?.includes(normalizePostSlugBeforeValidate))
  assert.equal(normalizePostSlugValue(' Thorns Tavern Testing '), 'thorns-tavern-testing')
  assert.equal(normalizePostSlugValue('\u4e2d\u6587 \u6807\u9898 2026'), '\u4e2d\u6587-\u6807\u9898-2026')

  const result = await normalizePostSlugBeforeValidate({
    data: {
      slug: '  Launch Dispatch: First Look!  ',
      title: 'Ignored Title',
    },
    operation: 'create',
  } as never)

  assert.deepEqual(result, {
    slug: 'launch-dispatch-first-look',
    title: 'Ignored Title',
  })
})

test('validatePostCoverImage accepts guest-readable published cover media', async () => {
  const result = await validatePostCoverImage({
    data: {
      _status: 'published',
      coverImage: 24,
      isVisible: true,
    },
    originalDoc: {},
    req: {
      payload: {
        findByID: async (args: unknown) => {
          assert.equal((args as { collection?: string }).collection, 'media')
          assert.equal((args as { id?: number }).id, 24)
          assert.equal((args as { overrideAccess?: boolean }).overrideAccess, false)

          return {
            publicAccess: true,
            purpose: 'asset',
          }
        },
      },
    },
  } as never)

  assert.deepEqual(result, {
    _status: 'published',
    coverImage: 24,
    isVisible: true,
  })
})

test('validatePostCoverImage rejects private media on published visible posts', async () => {
  await assert.rejects(
    () =>
      validatePostCoverImage({
        data: {
          _status: 'published',
          coverImage: 25,
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
