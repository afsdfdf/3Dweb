import type { PayloadRequest } from 'payload'

import { writeAuditLog } from '@/lib/auditLog'
import { withLedgerTransaction, type LedgerExecutor } from '@/lib/ledgerStore'

const INTERNAL_ACCESS = true

export class InsufficientCreditsError extends Error {
  available: number
  required: number

  constructor(args: { available: number; required: number; message?: string }) {
    super(args.message || `Insufficient credits: available ${args.available}, required ${args.required}.`)
    this.name = 'InsufficientCreditsError'
    this.available = args.available
    this.required = args.required
  }
}

const createReferenceCode = (prefix: string) => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
}

const normalizeUserId = (userId: number | string) => {
  return typeof userId === 'number' ? userId : Number(userId)
}

const sanitizeKeyPart = (value: number | string) => String(value).trim().toLowerCase()

type CreditAccountRow = {
  balance: number
  id: number
  lifetimePurchased: number
  lifetimeSpent: number
  reservedBalance: number
}

type CreditAccountSnapshot = CreditAccountRow

export type LedgerMutationResult = {
  account: unknown
  applied: boolean
  idempotencyKey?: string
}

type MutationOptions = {
  amount: number
  idempotencyKey?: string
  metadata?: Record<string, unknown>
  notes: string
  referencePrefix: string
  req: PayloadRequest
  sourceOrderId?: number | null
  sourceTaskId?: number | null
  transactionType:
    | 'download_spend'
    | 'manual_adjustment'
    | 'purchase'
    | 'refund'
    | 'subscription_grant'
    | 'task_hold'
    | 'task_spend'
  userId: number
  mutate: (current: CreditAccountRow) => CreditAccountRow
}

const toAuditEventType = (transactionType: MutationOptions['transactionType']) => {
  switch (transactionType) {
    case 'subscription_grant':
      return 'credits.subscription_grant'
    case 'task_hold':
      return 'credits.task_hold'
    case 'task_spend':
      return 'credits.task_spend'
    case 'refund':
      return 'credits.refund'
    case 'download_spend':
      return 'credits.download_spend'
    case 'manual_adjustment':
      return 'credits.manual_adjustment'
    case 'purchase':
      return 'credits.purchase'
    default:
      return 'credits.unknown'
  }
}

const nowISO = () => new Date().toISOString()

const isUniqueConstraintError = (error: unknown) => {
  if (!error || typeof error !== 'object') {
    return false
  }

  const candidate = error as { code?: string; message?: string }
  return (
    candidate.code === '23505' ||
    String(candidate.message || '').toLowerCase().includes('unique') ||
    String(candidate.message || '').toLowerCase().includes('duplicate')
  )
}

async function findCreditAccount(args: { req: PayloadRequest; userId: number }) {
  const { req, userId } = args

  const existing = await req.payload.find({
    collection: 'credits',
    depth: 0,
    limit: 1,
    overrideAccess: INTERNAL_ACCESS,
    pagination: false,
    req,
    where: {
      user: {
        equals: userId,
      },
    },
  })

  return existing.docs[0] ?? null
}

async function ensureCreditAccount(args: { req: PayloadRequest; userId: number | string }) {
  const { req, userId } = args
  const normalizedUserId = normalizeUserId(userId)

  const existing = await findCreditAccount({ req, userId: normalizedUserId })
  if (existing) {
    return existing
  }

  try {
    return await req.payload.create({
      collection: 'credits',
      data: {
        accountLabel: '主积分账户',
        balance: 0,
        billingNotes: '系统自动创建的默认积分账户。',
        lifetimePurchased: 0,
        lifetimeSpent: 0,
        reservedBalance: 0,
        status: 'active',
        user: normalizedUserId,
      },
      overrideAccess: INTERNAL_ACCESS,
      req,
    })
  } catch {
    const createdElsewhere = await findCreditAccount({ req, userId: normalizedUserId })
    if (createdElsewhere) {
      return createdElsewhere
    }

    throw new Error('Failed to ensure a unique credit account for the user.')
  }
}

async function findTransactionByIdempotencyKey(args: { idempotencyKey?: string; req: PayloadRequest }) {
  const { idempotencyKey, req } = args

  if (!idempotencyKey) return null

  const existing = await req.payload.find({
    collection: 'credit-transactions',
    depth: 0,
    limit: 1,
    overrideAccess: INTERNAL_ACCESS,
    pagination: false,
    req,
    where: {
      idempotencyKey: {
        equals: idempotencyKey,
      },
    },
  })

  return existing.docs[0] ?? null
}

async function getAtomicCreditAccount(args: { executor: LedgerExecutor; userId: number }) {
  const { executor, userId } = args
  const selectSql =
    executor.dialect === 'postgres'
      ? `
          SELECT id, balance, reserved_balance, lifetime_purchased, lifetime_spent
          FROM credits
          WHERE user_id = ?
          LIMIT 1
          FOR UPDATE
        `
      : `
          SELECT id, balance, reserved_balance, lifetime_purchased, lifetime_spent
          FROM credits
          WHERE user_id = ?
          LIMIT 1
        `

  const result = await executor.execute(selectSql, [userId])

  const row = result.rows?.[0]
  if (row) {
    return {
      balance: Number((row as any).balance || 0),
      id: Number((row as any).id),
      lifetimePurchased: Number((row as any).lifetime_purchased || 0),
      lifetimeSpent: Number((row as any).lifetime_spent || 0),
      reservedBalance: Number((row as any).reserved_balance || 0),
    } satisfies CreditAccountRow
  }

  const timestamp = nowISO()
  if (executor.dialect === 'postgres') {
    await executor.execute(
      `
        INSERT INTO credits
        (account_label, user_id, balance, reserved_balance, lifetime_purchased, lifetime_spent, status, billing_notes, updated_at, created_at)
        VALUES ('主积分账户', ?, 0, 0, 0, 0, 'active', '系统自动创建的默认积分账户。', ?, ?)
        ON CONFLICT (user_id) DO NOTHING
      `,
      [userId, timestamp, timestamp],
    )
  } else {
    await executor.execute(
      `
        INSERT INTO credits
        (account_label, user_id, balance, reserved_balance, lifetime_purchased, lifetime_spent, status, billing_notes, updated_at, created_at)
        VALUES ('主积分账户', ?, 0, 0, 0, 0, 'active', '系统自动创建的默认积分账户。', ?, ?)
      `,
      [userId, timestamp, timestamp],
    )
  }

  const inserted = await executor.execute(selectSql, [userId])

  const created = inserted.rows?.[0]
  return {
    balance: Number((created as any).balance || 0),
    id: Number((created as any).id),
    lifetimePurchased: Number((created as any).lifetime_purchased || 0),
    lifetimeSpent: Number((created as any).lifetime_spent || 0),
    reservedBalance: Number((created as any).reserved_balance || 0),
  } satisfies CreditAccountRow
}

async function runAtomicLedgerMutation(options: MutationOptions): Promise<LedgerMutationResult> {
  const {
    amount,
    idempotencyKey,
    metadata,
    mutate,
    notes,
    referencePrefix,
    req,
    sourceOrderId = null,
    sourceTaskId = null,
    transactionType,
    userId,
  } = options

  const timestamp = nowISO()

  return withLedgerTransaction(req, async (executor) => {
    if (idempotencyKey) {
      const duplicate = await executor.execute(
        `
          SELECT id
          FROM credit_transactions
          WHERE idempotency_key = ?
          LIMIT 1
        `,
        [idempotencyKey],
      )

      if (duplicate.rows?.[0]) {
        const current = await getAtomicCreditAccount({ executor, userId })
        writeAuditLog({
          details: {
            amount,
            idempotencyKey,
            notes,
            sourceOrderId,
            sourceTaskId,
          },
          eventType: toAuditEventType(transactionType),
          orderId: sourceOrderId,
          req,
          status: 'idempotent',
          taskId: sourceTaskId,
          userId,
        })
        return {
          account: current satisfies CreditAccountSnapshot,
          applied: false,
          idempotencyKey,
        }
      }
    }

    const current = await getAtomicCreditAccount({ executor, userId })
    const next = mutate(current)

    try {
      await executor.execute(
        `
          INSERT INTO credit_transactions
          (reference_code, idempotency_key, user_id, credit_account_id, type, amount, currency, balance_after, source_task_id, source_order_id, notes, metadata, updated_at, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          createReferenceCode(referencePrefix),
          idempotencyKey || null,
          userId,
          current.id,
          transactionType,
          amount,
          'credits',
          next.balance,
          sourceTaskId,
          sourceOrderId,
          notes,
          metadata ? JSON.stringify(metadata) : null,
          timestamp,
          timestamp,
        ],
      )
    } catch (error) {
      if (idempotencyKey && isUniqueConstraintError(error)) {
        const latest = await getAtomicCreditAccount({ executor, userId })
        writeAuditLog({
          details: {
            amount,
            idempotencyKey,
            notes,
            sourceOrderId,
            sourceTaskId,
          },
          eventType: toAuditEventType(transactionType),
          orderId: sourceOrderId,
          req,
          status: 'idempotent',
          taskId: sourceTaskId,
          userId,
        })
        return {
          account: latest satisfies CreditAccountSnapshot,
          applied: false,
          idempotencyKey,
        }
      }

      throw error
    }

    await executor.execute(
      `
        UPDATE credits
        SET
          balance = ?,
          reserved_balance = ?,
          lifetime_purchased = ?,
          lifetime_spent = ?,
          billing_notes = ?,
          updated_at = ?
        WHERE id = ?
      `,
      [next.balance, next.reservedBalance, next.lifetimePurchased, next.lifetimeSpent, notes, timestamp, current.id],
    )

    await executor.execute(
      `
        UPDATE users
        SET
          credits_balance = ?,
          last_active_at = ?,
          updated_at = ?
        WHERE id = ?
      `,
      [next.balance, timestamp, timestamp, userId],
    )

    writeAuditLog({
      details: {
        amount,
        balanceAfter: next.balance,
        idempotencyKey,
        notes,
        reservedBalanceAfter: next.reservedBalance,
        sourceOrderId,
        sourceTaskId,
      },
      eventType: toAuditEventType(transactionType),
      orderId: sourceOrderId,
      req,
      status: 'completed',
      taskId: sourceTaskId,
      userId,
    })

    return {
      account: {
        balance: next.balance,
        id: current.id,
        lifetimePurchased: next.lifetimePurchased,
        lifetimeSpent: next.lifetimeSpent,
        reservedBalance: next.reservedBalance,
      } satisfies CreditAccountSnapshot,
      applied: true,
      idempotencyKey,
    }
  })
}

function assertReservedBalanceAvailable(current: CreditAccountRow, amount: number, message: string) {
  if (current.reservedBalance < amount) {
    throw new Error(message)
  }
}

export { ensureCreditAccount }

export async function grantCredits(args: {
  amount: number
  idempotencyKey?: string
  metadata?: Record<string, unknown>
  notes: string
  referencePrefix?: string
  req: PayloadRequest
  userId: number | string
}) {
  const { amount, idempotencyKey, metadata, notes, referencePrefix = 'SUB', req, userId } = args
  const normalizedUserId = normalizeUserId(userId)

  if (Number(amount || 0) <= 0) {
    return {
      account: await ensureCreditAccount({ req, userId: normalizedUserId }),
      applied: false,
      idempotencyKey,
    } satisfies LedgerMutationResult
  }

  return runAtomicLedgerMutation({
    amount: Number(amount || 0),
    idempotencyKey,
    metadata,
    mutate: (current) => ({
      ...current,
      balance: current.balance + Number(amount || 0),
      lifetimePurchased: current.lifetimePurchased + Number(amount || 0),
    }),
    notes,
    referencePrefix,
    req,
    transactionType: 'subscription_grant',
    userId: normalizedUserId,
  })
}

export async function adjustCreditsManually(args: {
  amountDelta: number
  idempotencyKey?: string
  metadata?: Record<string, unknown>
  notes: string
  req: PayloadRequest
  userId: number | string
}) {
  const { amountDelta, idempotencyKey, metadata, notes, req, userId } = args
  const normalizedUserId = normalizeUserId(userId)
  const normalizedDelta = Number(amountDelta || 0)

  if (!Number.isFinite(normalizedDelta) || normalizedDelta === 0) {
    return {
      account: await ensureCreditAccount({ req, userId: normalizedUserId }),
      applied: false,
      idempotencyKey,
    } satisfies LedgerMutationResult
  }

  return runAtomicLedgerMutation({
    amount: normalizedDelta,
    idempotencyKey,
    metadata,
    mutate: (current) => {
      const nextBalance = current.balance + normalizedDelta
      if (nextBalance < 0) {
        throw new InsufficientCreditsError({
          available: current.balance,
          required: Math.abs(normalizedDelta),
          message: `Manual adjustment would make balance negative. Current balance is ${current.balance}.`,
        })
      }

      return {
        ...current,
        balance: nextBalance,
      }
    },
    notes,
    referencePrefix: 'MANUAL',
    req,
    transactionType: 'manual_adjustment',
    userId: normalizedUserId,
  })
}

export async function reserveTaskCredits(args: {
  amount: number
  notes: string
  req: PayloadRequest
  taskId: number
  userId: number | string
}) {
  const { amount, notes, req, taskId, userId } = args
  const normalizedUserId = normalizeUserId(userId)
  const normalizedAmount = Math.max(0, Number(amount || 0))
  const idempotencyKey = `task-hold:${taskId}`

  if (normalizedAmount <= 0) {
    return {
      account: await ensureCreditAccount({ req, userId: normalizedUserId }),
      applied: false,
      idempotencyKey,
    } satisfies LedgerMutationResult
  }

  return runAtomicLedgerMutation({
    amount: -normalizedAmount,
    idempotencyKey,
    mutate: (current) => {
      if (current.balance < normalizedAmount) {
        throw new InsufficientCreditsError({
          available: current.balance,
          required: normalizedAmount,
          message: `积分不足，当前可用 ${current.balance}，本次需要 ${normalizedAmount}。`,
        })
      }

      return {
        ...current,
        balance: current.balance - normalizedAmount,
        reservedBalance: current.reservedBalance + normalizedAmount,
      }
    },
    notes,
    referencePrefix: 'TASKHOLD',
    req,
    sourceTaskId: taskId,
    transactionType: 'task_hold',
    userId: normalizedUserId,
  })
}

export async function settleReservedTaskCredits(args: {
  amount: number
  notes: string
  req: PayloadRequest
  taskId: number
  userId: number | string
}) {
  const { amount, notes, req, taskId, userId } = args
  const normalizedUserId = normalizeUserId(userId)
  const normalizedAmount = Math.max(0, Number(amount || 0))
  const idempotencyKey = `task-spend:${taskId}`

  if (normalizedAmount <= 0) {
    return {
      account: await ensureCreditAccount({ req, userId: normalizedUserId }),
      applied: false,
      idempotencyKey,
    } satisfies LedgerMutationResult
  }

  return runAtomicLedgerMutation({
    amount: 0,
    idempotencyKey,
    mutate: (current) => ({
      ...current,
      lifetimeSpent: current.lifetimeSpent + normalizedAmount,
      reservedBalance: (() => {
        assertReservedBalanceAvailable(
          current,
          normalizedAmount,
          `Reserved balance is insufficient to settle task ${taskId}. Current reserved balance is ${current.reservedBalance}, settlement requires ${normalizedAmount}.`,
        )
        return current.reservedBalance - normalizedAmount
      })(),
    }),
    notes,
    referencePrefix: 'TASKSPEND',
    req,
    sourceTaskId: taskId,
    transactionType: 'task_spend',
    userId: normalizedUserId,
  })
}

export async function spendTaskCredits(args: {
  amount: number
  notes: string
  req: PayloadRequest
  taskId: number
  userId: number | string
}) {
  const { amount, notes, req, taskId, userId } = args
  const normalizedUserId = normalizeUserId(userId)
  const normalizedAmount = Math.max(0, Number(amount || 0))
  const idempotencyKey = `task-spend:${taskId}`

  if (normalizedAmount <= 0) {
    return {
      account: await ensureCreditAccount({ req, userId: normalizedUserId }),
      applied: false,
      idempotencyKey,
    } satisfies LedgerMutationResult
  }

  return runAtomicLedgerMutation({
    amount: -normalizedAmount,
    idempotencyKey,
    mutate: (current) => {
      if (current.balance < normalizedAmount) {
        throw new InsufficientCreditsError({
          available: current.balance,
          required: normalizedAmount,
          message: `积分不足，当前可用 ${current.balance}，本次需要 ${normalizedAmount}。`,
        })
      }

      return {
        ...current,
        balance: current.balance - normalizedAmount,
        lifetimeSpent: current.lifetimeSpent + normalizedAmount,
      }
    },
    notes,
    referencePrefix: 'TASKSPEND',
    req,
    sourceTaskId: taskId,
    transactionType: 'task_spend',
    userId: normalizedUserId,
  })
}

const getDownloadSpendIdempotencyKey = (args: { format: string; modelId: number; userId: number | string }) => {
  return `download:${sanitizeKeyPart(args.userId)}:${args.modelId}:${sanitizeKeyPart(args.format)}`
}

export async function spendDownloadCredits(args: {
  amount: number
  format: string
  modelId: number
  notes: string
  req: PayloadRequest
  userId: number | string
}) {
  const { amount, format, modelId, notes, req, userId } = args
  const normalizedUserId = normalizeUserId(userId)
  const normalizedAmount = Math.max(0, Number(amount || 0))
  const normalizedFormat = String(format || '').toLowerCase()
  const idempotencyKey = getDownloadSpendIdempotencyKey({
    format: normalizedFormat,
    modelId,
    userId: normalizedUserId,
  })

  if (normalizedAmount <= 0 || !normalizedFormat) {
    return {
      account: await ensureCreditAccount({ req, userId: normalizedUserId }),
      applied: false,
      idempotencyKey,
    } satisfies LedgerMutationResult
  }

  return runAtomicLedgerMutation({
    amount: -normalizedAmount,
    idempotencyKey,
    metadata: {
      format: normalizedFormat,
      modelId,
      source: 'model-download',
    },
    mutate: (current) => {
      if (current.balance < normalizedAmount) {
        throw new InsufficientCreditsError({
          available: current.balance,
          required: normalizedAmount,
          message: `积分不足，当前可用 ${current.balance}，下载需要 ${normalizedAmount}。`,
        })
      }

      return {
        ...current,
        balance: current.balance - normalizedAmount,
        lifetimeSpent: current.lifetimeSpent + normalizedAmount,
      }
    },
    notes,
    referencePrefix: 'DOWNLOAD',
    req,
    transactionType: 'download_spend',
    userId: normalizedUserId,
  })
}

export async function refundDownloadCredits(args: {
  amount: number
  format: string
  modelId: number
  notes: string
  req: PayloadRequest
  userId: number | string
}) {
  const { amount, format, modelId, notes, req, userId } = args
  const normalizedUserId = normalizeUserId(userId)
  const normalizedAmount = Math.max(0, Number(amount || 0))
  const normalizedFormat = String(format || '').toLowerCase()
  const idempotencyKey = `download-refund:${sanitizeKeyPart(normalizedUserId)}:${modelId}:${sanitizeKeyPart(normalizedFormat)}`

  if (normalizedAmount <= 0 || !normalizedFormat) {
    return {
      account: await ensureCreditAccount({ req, userId: normalizedUserId }),
      applied: false,
      idempotencyKey,
    } satisfies LedgerMutationResult
  }

  const spendKey = getDownloadSpendIdempotencyKey({
    format: normalizedFormat,
    modelId,
    userId: normalizedUserId,
  })
  const charged = await findTransactionByIdempotencyKey({ idempotencyKey: spendKey, req })

  if (!charged) {
    return {
      account: await ensureCreditAccount({ req, userId: normalizedUserId }),
      applied: false,
      idempotencyKey,
    } satisfies LedgerMutationResult
  }

  return runAtomicLedgerMutation({
    amount: normalizedAmount,
    idempotencyKey,
    metadata: {
      format: normalizedFormat,
      modelId,
      source: 'model-download-refund',
    },
    mutate: (current) => ({
      ...current,
      balance: current.balance + normalizedAmount,
      lifetimeSpent: Math.max(0, current.lifetimeSpent - normalizedAmount),
    }),
    notes,
    referencePrefix: 'DOWNLOADREFUND',
    req,
    transactionType: 'refund',
    userId: normalizedUserId,
  })
}

export async function refundTaskCredits(args: {
  amount: number
  notes: string
  req: PayloadRequest
  taskId: number
  userId: number | string
}) {
  const { amount, notes, req, taskId, userId } = args
  const normalizedUserId = normalizeUserId(userId)
  const normalizedAmount = Math.max(0, Number(amount || 0))
  const idempotencyKey = `task-refund:${taskId}`

  if (normalizedAmount <= 0) {
    return {
      account: await ensureCreditAccount({ req, userId: normalizedUserId }),
      applied: false,
      idempotencyKey,
    } satisfies LedgerMutationResult
  }

  return runAtomicLedgerMutation({
    amount: normalizedAmount,
    idempotencyKey,
    mutate: (current) => {
      assertReservedBalanceAvailable(
        current,
        normalizedAmount,
        `Reserved balance is insufficient to refund task ${taskId}. Current reserved balance is ${current.reservedBalance}, refund requires ${normalizedAmount}.`,
      )

      return {
        ...current,
        balance: current.balance + normalizedAmount,
        reservedBalance: current.reservedBalance - normalizedAmount,
      }
    },
    notes,
    referencePrefix: 'REFUND',
    req,
    sourceTaskId: taskId,
    transactionType: 'refund',
    userId: normalizedUserId,
  })
}
