import assert from 'node:assert/strict'
import test from 'node:test'

import {
  __setAdminCreditsTestHooks,
  adjustAdminCredits,
  exportCreditTransactions,
  getAdminCreditWorkspace,
  markCreditTransactionException,
} from '../src/lib/adminCredits.ts'

const createCreditRequest = (role: 'admin' | 'customer' | 'operator') => {
  const state = {
    updates: [] as Array<{ collection: string; data: Record<string, unknown>; id: number }>,
  }

  const credit = {
    balance: 18,
    id: 41,
    lifetimePurchased: 30,
    lifetimeSpent: 12,
    reservedBalance: 3,
    status: 'active',
    user: { email: 'credit-user@example.com', id: 9 },
  }

  const payload = {
    find: async ({ collection }: { collection: string }) => {
      if (collection === 'credit-transactions') {
        return {
          docs: [
            {
              amount: -2,
              balanceAfter: 16,
              createdAt: '2026-04-18T00:00:00.000Z',
              id: 501,
              idempotencyKey: 'download:1',
              notes: 'download charge',
              referenceCode: 'TX-501',
              type: 'download_spend',
            },
          ],
        }
      }

      throw new Error(`Unsupported collection: ${collection}`)
    },
    findByID: async ({ collection }: { collection: string }) => {
      if (collection === 'credits') {
        return { ...credit }
      }

      throw new Error(`Unsupported collection: ${collection}`)
    },
    logger: {
      error: () => undefined,
      info: () => undefined,
      warn: () => undefined,
    },
    update: async ({ collection, data, id }: { collection: string; data: Record<string, unknown>; id: number }) => {
      state.updates.push({ collection, data, id })
      return {
        id,
        ...data,
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

test('getAdminCreditWorkspace returns credit account and recent transactions', async () => {
  const { req } = createCreditRequest('operator')

  const workspace = await getAdminCreditWorkspace({
    creditId: 41,
    req,
  })

  assert.equal(workspace.summary.balance, 18)
  assert.equal(workspace.summary.reservedBalance, 3)
  assert.equal(workspace.sections.transactions.length, 1)
  assert.equal((workspace.sections.user as any)?.id, 9)
})

test('operator cannot manually adjust credits', async () => {
  const { req } = createCreditRequest('operator')

  await assert.rejects(
    () =>
      adjustAdminCredits({
        amount: 5,
        creditId: 41,
        reason: 'manual bonus',
        req,
      }),
    /Forbidden/,
  )
})

test('admin can manually adjust credits', async () => {
  const { req } = createCreditRequest('admin')
  let adjustCalls = 0

  __setAdminCreditsTestHooks({
    manualAdjustCredits: async () => {
      adjustCalls += 1
      return {
        account: { balance: 23 },
        applied: true,
      }
    },
  })

  try {
    const result = await adjustAdminCredits({
      amount: 5,
      creditId: 41,
      reason: 'manual bonus',
      req,
    })

    assert.equal(adjustCalls, 1)
    assert.equal(result.applied, true)
  } finally {
    __setAdminCreditsTestHooks(null)
  }
})

test('staff can mark credit transaction as exception', async () => {
  const { req, state } = createCreditRequest('operator')

  const transaction = await markCreditTransactionException({
    reason: 'duplicate idempotency suspected',
    req,
    transactionId: 501,
  })

  assert.equal((transaction as any).exceptionFlag, true)
  assert.equal(state.updates[0]?.collection, 'credit-transactions')
  assert.equal(state.updates[0]?.data.exceptionReason, 'duplicate idempotency suspected')
})

test('staff can export credit transactions as CSV', async () => {
  const { req } = createCreditRequest('operator')

  const csv = await exportCreditTransactions({
    creditId: 41,
    req,
  })

  assert.match(csv, /^referenceCode,type,amount,balanceAfter,idempotencyKey,createdAt,notes/m)
  assert.match(csv, /TX-501,download_spend,-2,16,download:1/)
})
