import assert from 'node:assert/strict'
import test from 'node:test'

import { EngagementViews } from '../src/collections/EngagementViews.ts'
import { ModelComments } from '../src/collections/ModelComments.ts'
import { ModelFavorites } from '../src/collections/ModelFavorites.ts'
import { ModelLikes } from '../src/collections/ModelLikes.ts'
import { UserFollows } from '../src/collections/UserFollows.ts'
import { assignCurrentUser } from '../src/hooks/assignCurrentUser.ts'
import { forceCurrentUserField } from '../src/hooks/forceCurrentUserField.ts'

const customerReq = {
  user: {
    id: 7,
    role: 'customer',
  },
}

const staffReq = {
  user: {
    id: 1,
    role: 'operator',
  },
}

test('forceCurrentUserField overwrites spoofed customer identity on create', () => {
  const hook = forceCurrentUserField('user')
  const result = hook({
    data: {
      model: 12,
      user: 99,
    },
    operation: 'create',
    req: customerReq,
  } as never) as Record<string, unknown>

  assert.equal(result.user, 7)
  assert.equal(result.model, 12)
})

test('forceCurrentUserField clears anonymous viewer identity when configured', () => {
  const hook = forceCurrentUserField('viewer', { clearWhenAnonymous: true })
  const result = hook({
    data: {
      targetModel: 12,
      viewer: 99,
      viewerKeyHash: 'anonymous:hash',
    },
    operation: 'create',
    req: {},
  } as never) as Record<string, unknown>

  assert.equal(result.viewer, null)
  assert.equal(result.viewerKeyHash, 'anonymous:hash')
})

test('forceCurrentUserField keeps staff-managed identity edits available', () => {
  const hook = forceCurrentUserField('user')
  const result = hook({
    data: {
      model: 12,
      user: 99,
    },
    operation: 'create',
    req: staffReq,
  } as never) as Record<string, unknown>

  assert.equal(result.user, 99)
})

test('assignCurrentUser always overwrites spoofed create identity', async () => {
  const hook = assignCurrentUser('user')
  const result = (await hook({
    data: {
      label: 'Home',
      user: 99,
    },
    operation: 'create',
    req: customerReq,
  } as never)) as Record<string, unknown>

  assert.equal(result.user, 7)
})

test('social collections force current user fields before change', () => {
  const cases = [
    { collection: ModelLikes, fieldName: 'user' },
    { collection: ModelFavorites, fieldName: 'user' },
    { collection: UserFollows, fieldName: 'follower' },
    { collection: ModelComments, fieldName: 'author' },
    { collection: EngagementViews, fieldName: 'viewer' },
  ]

  for (const item of cases) {
    const hook = item.collection.hooks?.beforeChange?.[0]
    assert.equal(typeof hook, 'function')

    const result = hook?.({
      data: {
        [item.fieldName]: 99,
      },
      operation: 'create',
      req: customerReq,
    } as never) as Record<string, unknown>

    assert.equal(result[item.fieldName], 7)
  }
})

test('UserFollows no longer allows customer update reassignment', () => {
  const customerArgs = {
    req: customerReq,
  } as never
  const staffArgs = {
    req: staffReq,
  } as never

  assert.equal(Boolean(UserFollows.access?.create?.(customerArgs)), true)
  assert.equal(Boolean(UserFollows.access?.update?.(customerArgs)), false)
  assert.equal(Boolean(UserFollows.access?.update?.(staffArgs)), true)
})
