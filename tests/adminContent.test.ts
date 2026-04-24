import assert from 'node:assert/strict'
import test from 'node:test'

import { addModelsToBundle, exportAdminContentCollection, removeModelsFromBundle } from '../src/lib/adminContent.ts'

const createContentRequest = (role: 'admin' | 'customer' | 'operator') => {
  const state = {
    updates: [] as Array<{ collection: string; data: Record<string, unknown>; id: number }>,
  }

  const bundle = {
    id: 51,
    models: [101, 102],
    title: 'Featured Bundle',
  }

  const payload = {
    find: async ({ collection }: { collection: string }) => {
      if (collection === 'homepage-items') {
        return {
          docs: [{ _status: 'published', createdBy: { email: 'editor@example.com' }, isVisible: true, sortOrder: 1, title: 'Hero', updatedAt: '2026-04-18', contentType: 'custom' }],
        }
      }

      if (collection === 'posts') {
        return {
          docs: [{ _status: 'draft', category: 'article', createdBy: { email: 'writer@example.com' }, isVisible: true, sortOrder: 2, title: 'Post A', updatedAt: '2026-04-18' }],
        }
      }

      if (collection === 'announcements') {
        return {
          docs: [{ _status: 'published', createdBy: { email: 'ops@example.com' }, isVisible: true, sortOrder: 3, title: 'Announcement A', updatedAt: '2026-04-18' }],
        }
      }

      if (collection === 'model-bundles') {
        return {
          docs: [{ _status: 'published', createdBy: { email: 'ops@example.com' }, isVisible: true, sortOrder: 4, title: 'Bundle A', updatedAt: '2026-04-18' }],
        }
      }

      throw new Error(`Unsupported collection: ${collection}`)
    },
    findByID: async ({ collection }: { collection: string }) => {
      assert.equal(collection, 'model-bundles')
      return { ...bundle }
    },
    logger: {
      error: () => undefined,
      info: () => undefined,
      warn: () => undefined,
    },
    update: async ({ collection, data, id }: { collection: string; data: Record<string, unknown>; id: number }) => {
      state.updates.push({ collection, data, id })
      return {
        ...bundle,
        ...data,
        id,
      }
    },
  }

  return {
    req: {
      payload,
      user: {
        id: 1,
        role,
      },
    } as never,
    state,
  }
}

test('staff can export content collections as CSV', async () => {
  const { req } = createContentRequest('operator')

  const csv = await exportAdminContentCollection({
    collection: 'posts',
    req,
  })

  assert.match(csv, /^title,type,status,isVisible,sortOrder,createdBy,updatedAt/m)
  assert.match(csv, /Post A,article,draft/)
})

test('customer cannot export content or edit bundle membership', async () => {
  const { req } = createContentRequest('customer')

  await assert.rejects(() => exportAdminContentCollection({ collection: 'posts', req }), /Forbidden/)
  await assert.rejects(() => addModelsToBundle({ bundleId: 51, modelIds: [103], req }), /Forbidden/)
  await assert.rejects(() => removeModelsFromBundle({ bundleId: 51, modelIds: [101], req }), /Forbidden/)
})

test('staff can batch add models to bundle', async () => {
  const { req, state } = createContentRequest('operator')

  const updated = await addModelsToBundle({
    bundleId: 51,
    modelIds: [102, 103, 104],
    req,
  })

  assert.deepEqual(updated.models, [101, 102, 103, 104])
  assert.equal(state.updates[0]?.collection, 'model-bundles')
})

test('staff can batch remove models from bundle', async () => {
  const { req, state } = createContentRequest('operator')

  const updated = await removeModelsFromBundle({
    bundleId: 51,
    modelIds: [101],
    req,
  })

  assert.deepEqual(updated.models, [102])
  assert.equal(state.updates[0]?.collection, 'model-bundles')
})
