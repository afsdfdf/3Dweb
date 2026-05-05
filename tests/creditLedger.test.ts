import test from 'node:test'
import assert from 'node:assert/strict'

import {
  assertTaskCreditsAvailable,
  grantCredits,
  InsufficientCreditsError,
  purchaseCredits,
  refundDownloadCredits,
  refundTaskCredits,
  reserveTaskCredits,
  settleReservedTaskCredits,
  spendDownloadCredits,
} from '../src/lib/creditLedger.ts'

const createMockRequest = () => {
  const state = {
    creditTransactions: [] as any[],
    credits: [] as any[],
    findCalls: [] as Array<{ collection: string; where: Record<string, any> }>,
    users: [{ creditsBalance: 0, id: 1 }],
  }

  const executeLedgerSQL = async (sql: string, args: unknown[] = []) => {
    const normalized = sql.replace(/\s+/g, ' ').trim().toUpperCase()

    if (normalized.startsWith('SELECT ID, BALANCE, RESERVED_BALANCE, LIFETIME_PURCHASED, LIFETIME_SPENT FROM CREDITS')) {
      const credit = state.credits.find((item) => Number(item.user) === Number(args[0]))
      return {
        rows: credit
          ? [
              {
                balance: credit.balance,
                id: credit.id,
                lifetime_purchased: credit.lifetimePurchased,
                lifetime_spent: credit.lifetimeSpent,
                reserved_balance: credit.reservedBalance,
              },
            ]
          : [],
      }
    }

    if (normalized.startsWith('INSERT INTO CREDITS')) {
      const credit = {
        accountLabel: 'Primary credit account',
        balance: 0,
        billingNotes: 'System-created default credit account.',
        id: state.credits.length + 1,
        lifetimePurchased: 0,
        lifetimeSpent: 0,
        reservedBalance: 0,
        status: 'active',
        updatedAt: args[1],
        user: args[0],
      }
      state.credits.push(credit)
      return { rows: [] }
    }

    if (normalized.startsWith('SELECT ID FROM CREDIT_TRANSACTIONS')) {
      const transaction = state.creditTransactions.find((item) => item.idempotencyKey === args[0])
      return {
        rows: transaction ? [{ id: transaction.id }] : [],
      }
    }

    if (normalized.startsWith('UPDATE CREDITS SET')) {
      const credit = state.credits.find((item) => item.id === args[6])
      if (credit) {
        credit.balance = args[0]
        credit.reservedBalance = args[1]
        credit.lifetimePurchased = args[2]
        credit.lifetimeSpent = args[3]
        credit.billingNotes = args[4]
        credit.updatedAt = args[5]
      }
      return { rows: [] }
    }

    if (normalized.startsWith('INSERT INTO CREDIT_TRANSACTIONS')) {
      state.creditTransactions.push({
        amount: args[5],
        balanceAfter: args[7],
        creditAccount: args[3],
        id: state.creditTransactions.length + 1,
        idempotencyKey: args[1],
        metadata: args[11],
        notes: args[10],
        referenceCode: args[0],
        sourceOrderId: args[9],
        sourceTaskId: args[8],
        type: args[4],
        user: args[2],
      })
      return { rows: [] }
    }

    if (normalized === 'BEGIN' || normalized === 'COMMIT' || normalized === 'ROLLBACK') {
      return { rows: [] }
    }

    if (normalized.startsWith('UPDATE USERS SET')) {
      const user = state.users.find((item) => item.id === args[3])
      if (user) {
        user.creditsBalance = Number(args[0])
      }
      return { rows: [] }
    }

    throw new Error(`Unsupported SQL in mock ledger test: ${sql}`)
  }

  const payload = {
    create: async ({ collection, data }: { collection: string; data: Record<string, unknown> }) => {
      if (collection === 'credits') {
        const credit = {
          id: state.credits.length + 1,
          ...data,
        }
        state.credits.push(credit)
        return credit
      }

      if (collection === 'credit-transactions') {
        const transaction = {
          id: state.creditTransactions.length + 1,
          ...data,
        }
        state.creditTransactions.push(transaction)
        return transaction
      }

      throw new Error(`Unsupported create collection: ${collection}`)
    },
    db: {
      drizzle: {
        $client: {
          connect: async () => ({
            query: executeLedgerSQL,
            release() {},
          }),
        },
      },
    },
    find: async ({ collection, where }: { collection: string; where: Record<string, any> }) => {
      state.findCalls.push({ collection, where })

      if (collection === 'credits') {
        const userId = where.user.equals
        return {
          docs: state.credits.filter((item) => Number(item.user) === Number(userId)),
        }
      }

      if (collection === 'credit-transactions') {
        const idempotencyKey = where.idempotencyKey.equals
        return {
          docs: state.creditTransactions.filter((item) => item.idempotencyKey === idempotencyKey),
        }
      }

      throw new Error(`Unsupported find collection: ${collection}`)
    },
    update: async ({ collection, data, id }: { collection: string; data: Record<string, unknown>; id: number }) => {
      if (collection === 'users') {
        const user = state.users.find((item) => item.id === id)
        Object.assign(user || {}, data)
        return user
      }

      throw new Error(`Unsupported update collection: ${collection}`)
    },
  }

  return {
    req: {
      payload,
    } as never,
    state,
  }
}

test('grantCredits applies balance updates once', async () => {
  const { req, state } = createMockRequest()

  const result = await grantCredits({
    amount: 10,
    idempotencyKey: 'grant-1',
    notes: 'grant credits',
    req,
    userId: 1,
  })

  assert.equal(result.applied, true)
  assert.equal(state.credits[0].balance, 10)
  assert.equal(state.users[0].creditsBalance, 10)
  assert.equal(state.findCalls.length, 0)
})

test('purchaseCredits records purchase transactions and updates lifetime purchased once', async () => {
  const { req, state } = createMockRequest()

  const first = await purchaseCredits({
    amount: 25,
    idempotencyKey: 'purchase-1',
    notes: 'credit package purchase',
    req,
    userId: 1,
  })
  const duplicate = await purchaseCredits({
    amount: 25,
    idempotencyKey: 'purchase-1',
    notes: 'credit package purchase duplicate',
    req,
    userId: 1,
  })

  assert.equal(first.applied, true)
  assert.equal(duplicate.applied, false)
  assert.equal(state.credits[0].balance, 25)
  assert.equal(state.credits[0].lifetimePurchased, 25)
  assert.equal(state.creditTransactions[0].type, 'purchase')
  assert.equal(state.users[0].creditsBalance, 25)
})

test('reserveTaskCredits is idempotent per task', async () => {
  const { req, state } = createMockRequest()

  await grantCredits({
    amount: 10,
    idempotencyKey: 'grant-2',
    notes: 'initial credits',
    req,
    userId: 1,
  })

  const first = await reserveTaskCredits({
    amount: 4,
    notes: 'reserve task credits',
    req,
    taskId: 101,
    userId: 1,
  })
  const duplicate = await reserveTaskCredits({
    amount: 4,
    notes: 'reserve task credits duplicate',
    req,
    taskId: 101,
    userId: 1,
  })

  assert.equal(first.applied, true)
  assert.equal(duplicate.applied, false)
  assert.equal(state.credits[0].balance, 6)
  assert.equal(state.credits[0].reservedBalance, 4)
  assert.equal(state.findCalls.length, 0)
})

test('assertTaskCreditsAvailable checks balance without creating a ledger transaction', async () => {
  const { req, state } = createMockRequest()

  await assert.rejects(
    () =>
      assertTaskCreditsAvailable({
        amount: 4,
        req,
        userId: 1,
      }),
    (error: unknown) =>
      error instanceof InsufficientCreditsError && error.available === 0 && error.required === 4,
  )

  assert.equal(state.credits.length, 1)
  assert.equal(state.credits[0].balance, 0)
  assert.equal(state.creditTransactions.length, 0)

  await grantCredits({
    amount: 10,
    idempotencyKey: 'grant-available',
    notes: 'initial credits',
    req,
    userId: 1,
  })

  const result = await assertTaskCreditsAvailable({
    amount: 4,
    req,
    userId: 1,
  })

  assert.equal(result.available, 10)
  assert.equal(result.required, 4)
  assert.equal(state.credits[0].balance, 10)
  assert.equal(state.creditTransactions.length, 1)
})

test('settleReservedTaskCredits and refundTaskCredits update reserved balance safely', async () => {
  const { req, state } = createMockRequest()

  await grantCredits({
    amount: 20,
    idempotencyKey: 'grant-3',
    notes: 'initial credits',
    req,
    userId: 1,
  })

  await reserveTaskCredits({
    amount: 5,
    notes: 'reserve task 201',
    req,
    taskId: 201,
    userId: 1,
  })

  await settleReservedTaskCredits({
    amount: 5,
    notes: 'settle task 201',
    req,
    taskId: 201,
    userId: 1,
  })

  assert.equal(state.credits[0].balance, 15)
  assert.equal(state.credits[0].reservedBalance, 0)
  assert.equal(state.credits[0].lifetimeSpent, 5)

  await reserveTaskCredits({
    amount: 3,
    notes: 'reserve task 202',
    req,
    taskId: 202,
    userId: 1,
  })

  await refundTaskCredits({
    amount: 3,
    notes: 'refund task 202',
    req,
    taskId: 202,
    userId: 1,
  })

  assert.equal(state.credits[0].balance, 15)
  assert.equal(state.credits[0].reservedBalance, 0)
})

test('settleReservedTaskCredits rejects over-settlement when reserved balance is insufficient', async () => {
  const { req } = createMockRequest()

  await grantCredits({
    amount: 10,
    idempotencyKey: 'grant-4',
    notes: 'initial credits',
    req,
    userId: 1,
  })

  await reserveTaskCredits({
    amount: 2,
    notes: 'reserve task 301',
    req,
    taskId: 301,
    userId: 1,
  })

  await assert.rejects(
    () =>
      settleReservedTaskCredits({
        amount: 3,
        notes: 'invalid settle task 301',
        req,
        taskId: 301,
        userId: 1,
      }),
    /Reserved balance is insufficient to settle task 301/,
  )
})

test('spendDownloadCredits throws when available balance is insufficient', async () => {
  const { req } = createMockRequest()

  await assert.rejects(
    () =>
      spendDownloadCredits({
        amount: 5,
        format: 'glb',
        modelId: 42,
        notes: 'download spend',
        req,
        userId: 1,
      }),
    (error: unknown) => error instanceof InsufficientCreditsError,
  )
})

test('refundDownloadCredits refunds only after a matching charged download exists', async () => {
  const { req, state } = createMockRequest()

  await grantCredits({
    amount: 10,
    idempotencyKey: 'grant-5',
    notes: 'initial credits',
    req,
    userId: 1,
  })

  const skippedRefund = await refundDownloadCredits({
    amount: 2,
    format: 'glb',
    modelId: 501,
    notes: 'refund without prior charge',
    req,
    userId: 1,
  })

  assert.equal(skippedRefund.applied, false)
  assert.equal(state.credits[0].balance, 10)

  const charged = await spendDownloadCredits({
    amount: 2,
    format: 'glb',
    modelId: 501,
    notes: 'charge download',
    req,
    userId: 1,
  })

  assert.equal(charged.applied, true)
  assert.equal(state.credits[0].balance, 8)

  const refunded = await refundDownloadCredits({
    amount: 2,
    format: 'glb',
    modelId: 501,
    notes: 'refund charged download',
    req,
    userId: 1,
  })

  assert.equal(refunded.applied, true)
  assert.equal(state.credits[0].balance, 10)
  assert.equal(state.credits[0].lifetimeSpent, 0)
})
