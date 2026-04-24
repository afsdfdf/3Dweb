import assert from 'node:assert/strict'
import test from 'node:test'

import {
  createUserResetPasswordLink,
  disableUserAccount,
  getAdminUserWorkspace,
  restoreUserAccount,
  switchUserRole,
} from '../src/lib/adminUsers.ts'

const createRequest = (role: 'admin' | 'customer' | 'operator') => {
  const state = {
    updates: [] as Array<{ collection: string; data: Record<string, unknown>; id: number }>,
  }

  const baseUser = {
    accountStatus: 'active',
    creditsBalance: 18,
    email: 'user@example.com',
    id: 9,
    lastActiveAt: '2026-04-18T00:00:00.000Z',
    role: 'customer',
  }

  const payload = {
    find: async ({ collection }: { collection: string }) => {
      switch (collection) {
        case 'credits':
          return { docs: [{ balance: 18, id: 1, reservedBalance: 3, user: 9 }] }
        case 'credit-transactions':
          return { docs: [{ id: 101, type: 'task_hold', user: 9 }] }
        case 'billing-subscriptions':
          return { docs: [{ id: 201, status: 'active', user: 9 }] }
        case 'generation-tasks':
          return { docs: [{ id: 301, taskCode: 'TASK-301', user: 9 }, { id: 302, taskCode: 'TASK-302', user: 9 }] }
        case 'models':
          return { docs: [{ id: 401, owner: 9, title: 'Model A' }] }
        case 'print-orders':
          return { docs: [{ amount: 25, id: 501, user: 9 }] }
        case 'shopify-payments':
          return { docs: [{ amount: 20, id: 601, status: 'paid', user: 9 }, { amount: 5, id: 602, status: 'pending', user: 9 }] }
        default:
          throw new Error(`Unsupported collection: ${collection}`)
      }
    },
    findByID: async ({ collection, id }: { collection: string; id: number }) => {
      assert.equal(collection, 'users')
      assert.equal(id, 9)
      return { ...baseUser }
    },
    logger: {
      error: () => undefined,
      info: () => undefined,
      warn: () => undefined,
    },
    update: async ({ collection, data, id }: { collection: string; data: Record<string, unknown>; id: number }) => {
      state.updates.push({ collection, data, id })
      return {
        ...baseUser,
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

test('getAdminUserWorkspace aggregates user management detail modules for staff', async () => {
  const { req } = createRequest('operator')

  const workspace = await getAdminUserWorkspace({
    req,
    userId: 9,
  })

  assert.equal(workspace.summary.currentCredits, 18)
  assert.equal(workspace.summary.hasActiveSubscription, true)
  assert.equal(workspace.summary.subscriptionStatus, 'active')
  assert.equal(workspace.summary.totalGenerationCount, 2)
  assert.equal(workspace.summary.totalPaidAmount, 20)
  assert.equal(workspace.sections.tasks.length, 2)
  assert.equal(workspace.sections.payments.length, 2)
})

test('disable and restore user account are admin-only actions', async () => {
  const { req } = createRequest('operator')

  await assert.rejects(
    () =>
      disableUserAccount({
        reason: 'risk',
        req,
        userId: 9,
      }),
    /Forbidden/,
  )

  await assert.rejects(
    () =>
      restoreUserAccount({
        req,
        userId: 9,
      }),
    /Forbidden/,
  )
})

test('admin can disable and restore user account', async () => {
  const { req, state } = createRequest('admin')

  const disabled = await disableUserAccount({
    reason: 'risk-control',
    req,
    userId: 9,
  })
  const restored = await restoreUserAccount({
    req,
    userId: 9,
  })

  assert.equal(disabled.accountStatus, 'disabled')
  assert.equal(restored.accountStatus, 'active')
  assert.equal(state.updates[0]?.collection, 'users')
  assert.equal(state.updates[1]?.collection, 'users')
})

test('admin can switch user role', async () => {
  const { req, state } = createRequest('admin')

  const updated = await switchUserRole({
    nextRole: 'operator',
    req,
    userId: 9,
  })

  assert.equal(updated.role, 'operator')
  assert.equal(state.updates[0]?.data.role, 'operator')
})

test('admin can generate reset password link', async () => {
  const previousCanonical = process.env.CANONICAL_APP_URL
  process.env.CANONICAL_APP_URL = 'https://app.example.com'

  try {
    const { req, state } = createRequest('admin')
    const result = await createUserResetPasswordLink({
      req,
      userId: 9,
    })

    assert.match(result.resetLink, /^https:\/\/app\.example\.com\/reset-password\?token=/)
    assert.equal(typeof state.updates[0]?.data.resetPasswordToken, 'string')
    assert.equal(typeof state.updates[0]?.data.resetPasswordExpiration, 'string')
  } finally {
    process.env.CANONICAL_APP_URL = previousCanonical
  }
})
