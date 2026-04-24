import assert from 'node:assert/strict'
import test from 'node:test'

import {
  __setAdminSubscriptionsTestHooks,
  checkAdminSubscriptionGrant,
  exportAdminSubscriptionDetail,
  getAdminSubscriptionWorkspace,
  resyncAdminSubscription,
} from '../src/lib/adminSubscriptions.ts'

const createSubscriptionRequest = (role: 'admin' | 'customer' | 'operator') => {
  const state = {
    updates: [] as Array<{ collection: string; data: Record<string, unknown>; id: number }>,
  }

  const subscription = {
    cancelAtPeriodEnd: false,
    currentPeriodEnd: '2026-05-01T00:00:00.000Z',
    id: 51,
    lastCheckoutSessionId: 'cs_sub_123',
    lastGrantedPeriodKey: `sub_123:${Math.floor(new Date('2026-05-01T00:00:00.000Z').getTime() / 1000)}`,
    monthlyCredits: 240,
    planKey: 'starter',
    status: 'active',
    stripeCustomerId: 'cus_123',
    stripeSubscriptionId: 'sub_123',
    user: { email: 'subscriber@example.com', id: 9 },
  }

  const payload = {
    find: async ({ collection }: { collection: string }) => {
      if (collection === 'shopify-payments') {
        return {
          docs: [
            {
              id: 801,
              rawWebhookPayload: {
                customerId: 'cus_123',
              },
            },
          ],
        }
      }

      throw new Error(`Unsupported collection: ${collection}`)
    },
    findByID: async ({ collection }: { collection: string }) => {
      assert.equal(collection, 'billing-subscriptions')
      return { ...subscription }
    },
    logger: {
      error: () => undefined,
      info: () => undefined,
      warn: () => undefined,
    },
    update: async ({ collection, data, id }: { collection: string; data: Record<string, unknown>; id: number }) => {
      state.updates.push({ collection, data, id })
      return {
        ...subscription,
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

test('getAdminSubscriptionWorkspace returns subscription management detail modules', async () => {
  const { req } = createSubscriptionRequest('operator')

  const workspace = await getAdminSubscriptionWorkspace({
    req,
    subscriptionId: 51,
  })

  assert.equal(workspace.summary.planKey, 'starter')
  assert.equal(workspace.summary.currentPeriodGranted, true)
  assert.equal(workspace.sections.payments.length, 1)
  assert.equal((workspace.sections.user as any)?.id, 9)
})

test('customer cannot execute admin subscription actions', async () => {
  const { req } = createSubscriptionRequest('customer')

  await assert.rejects(() => resyncAdminSubscription({ req, subscriptionId: 51 }), /Forbidden/)
  await assert.rejects(() => checkAdminSubscriptionGrant({ req, subscriptionId: 51 }), /Forbidden/)
})

test('staff can re-sync subscription state', async () => {
  const { req, state } = createSubscriptionRequest('operator')
  let syncCalls = 0

  __setAdminSubscriptionsTestHooks({
    syncStripeSubscriptionState: async () => {
      syncCalls += 1
      return {
        billingSubscription: { id: 51 },
        subscriptionStatus: 'active',
      } as never
    },
  })

  try {
    const result = await resyncAdminSubscription({
      req,
      subscriptionId: 51,
    })

    assert.equal(syncCalls, 1)
    assert.equal(result.subscriptionStatus, 'active')
    assert.equal(state.updates[0]?.collection, 'billing-subscriptions')
  } finally {
    __setAdminSubscriptionsTestHooks(null)
  }
})

test('staff can check whether current period credits were granted', async () => {
  const { req } = createSubscriptionRequest('operator')

  const result = await checkAdminSubscriptionGrant({
    req,
    subscriptionId: 51,
  })

  assert.equal(result.currentPeriodGranted, true)
  assert.equal(result.shouldHaveCredits, true)
})

test('staff can export subscription detail as JSON', async () => {
  const { req } = createSubscriptionRequest('operator')

  const payload = await exportAdminSubscriptionDetail({
    req,
    subscriptionId: 51,
  })

  const parsed = JSON.parse(payload)
  assert.equal(parsed.summary.stripeSubscriptionId, 'sub_123')
  assert.equal(parsed.summary.currentPeriodGranted, true)
})
