import assert from 'node:assert/strict'
import test from 'node:test'

import {
  getAccountDashboard,
  updateAccountModelVisibility,
} from '../src/lib/accountService.ts'

test('account dashboard local API reads include current user access context', async () => {
  const currentUser = {
    id: 42,
    role: 'customer',
  }
  const checkedCollections = new Set<string>()

  const assertCurrentUserAccess = (options: Record<string, unknown>) => {
    assert.equal(options.overrideAccess, false)
    assert.equal(options.user, currentUser)
  }

  const req = {
    payload: {
      find: async (options: Record<string, unknown>) => {
        assertCurrentUserAccess(options)
        checkedCollections.add(String(options.collection))

        return {
          docs: [],
          totalDocs: 0,
        }
      },
      findByID: async (options: Record<string, unknown>) => {
        assert.equal(options.collection, 'users')
        assertCurrentUserAccess(options)

        return {
          avatar: null,
          avatarFrame: 'none',
          bio: null,
          creditsBalance: 0,
          displayName: null,
          email: 'customer@example.com',
          followersCount: 0,
          followingCount: 0,
          fullName: null,
          id: currentUser.id,
          phone: null,
          profileBackground: null,
          profileBannerFocalX: 50,
          profileBannerFocalY: 50,
          profileVisibility: 'private',
          profileViewCount: 0,
          role: 'customer',
        }
      },
    },
    user: currentUser,
  } as never

  const dashboard = await getAccountDashboard(req)

  assert.equal(dashboard.profile.id, currentUser.id)
  assert.deepEqual(
    [...checkedCollections].sort(),
    [
      'billing-subscriptions',
      'credit-transactions',
      'credits',
      'generation-tasks',
      'models',
      'print-orders',
    ],
  )
})

test('account model visibility update is scoped to the current user', async () => {
  const currentUser = {
    id: 42,
    role: 'customer',
  }
  let updateOptions: Record<string, unknown> | null = null

  const req = {
    payload: {
      update: async (options: Record<string, unknown>) => {
        updateOptions = options

        return {
          id: options.id,
          status: 'ready',
          title: 'Owned model',
          visibility: 'public',
        }
      },
    },
    user: currentUser,
  } as never

  const result = await updateAccountModelVisibility({
    modelId: '55',
    req,
    visibility: 'public',
  })

  assert.equal(result.id, '55')
  assert.equal(result.visibility, 'public')
  assert.equal(updateOptions?.collection, 'models')
  assert.equal(updateOptions?.id, '55')
  assert.deepEqual(updateOptions?.data, { visibility: 'public' })
  assert.equal(updateOptions?.overrideAccess, false)
  assert.equal(updateOptions?.user, currentUser)
  assert.equal(updateOptions?.req, req)
})

test('account model visibility update rejects non-public-private values', async () => {
  const req = {
    payload: {
      update: async () => {
        throw new Error('update should not run')
      },
    },
    user: { id: 42, role: 'customer' },
  } as never

  await assert.rejects(
    updateAccountModelVisibility({
      modelId: '55',
      req,
      visibility: 'team',
    }),
    /public or private/i,
  )
})
