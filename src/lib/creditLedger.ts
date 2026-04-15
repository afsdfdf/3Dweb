import type { PayloadRequest } from 'payload'

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

const nowISO = () => new Date().toISOString()

async function getClient(req: PayloadRequest) {
  return req.payload.db.drizzle.$client
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

  return req.payload.create({
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

async function getAtomicCreditAccount(args: { client: any; userId: number }) {
  const { client, userId } = args
  const result = await client.execute({
    args: [userId],
    sql: `
      SELECT id, balance, reserved_balance, lifetime_purchased, lifetime_spent
      FROM credits
      WHERE user_id = ?
      LIMIT 1
    `,
  })

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
  await client.execute({
    args: [userId, timestamp, timestamp],
    sql: `
      INSERT INTO credits
      (account_label, user_id, balance, reserved_balance, lifetime_purchased, lifetime_spent, status, billing_notes, updated_at, created_at)
      VALUES ('主积分账户', ?, 0, 0, 0, 0, 'active', '系统自动创建的默认积分账户。', ?, ?)
    `,
  })

  const inserted = await client.execute({
    args: [userId],
    sql: `
      SELECT id, balance, reserved_balance, lifetime_purchased, lifetime_spent
      FROM credits
      WHERE user_id = ?
      LIMIT 1
    `,
  })

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

  const existing = await findTransactionByIdempotencyKey({ idempotencyKey, req })
  if (existing) {
    return {
      account: await ensureCreditAccount({ req, userId }),
      applied: false,
      idempotencyKey,
    }
  }

  const client = await getClient(req)
  const timestamp = nowISO()

  await client.execute('BEGIN IMMEDIATE')
  try {
    if (idempotencyKey) {
      const duplicate = await client.execute({
        args: [idempotencyKey],
        sql: `
          SELECT id
          FROM credit_transactions
          WHERE idempotency_key = ?
          LIMIT 1
        `,
      })

      if (duplicate.rows?.[0]) {
        await client.execute('COMMIT')
        return {
          account: await ensureCreditAccount({ req, userId }),
          applied: false,
          idempotencyKey,
        }
      }
    }

    const current = await getAtomicCreditAccount({ client, userId })
    const next = mutate(current)

    await client.execute({
      args: [next.balance, next.reservedBalance, next.lifetimePurchased, next.lifetimeSpent, notes, timestamp, current.id],
      sql: `
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
    })

    await client.execute({
      args: [
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
      sql: `
        INSERT INTO credit_transactions
        (reference_code, idempotency_key, user_id, credit_account_id, type, amount, currency, balance_after, source_task_id, source_order_id, notes, metadata, updated_at, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
    })

    await client.execute({
      args: [next.balance, timestamp, timestamp, userId],
      sql: `
        UPDATE users
        SET
          credits_balance = ?,
          last_active_at = ?,
          updated_at = ?
        WHERE id = ?
      `,
    })

    await client.execute('COMMIT')
    return {
      account: await ensureCreditAccount({ req, userId }),
      applied: true,
      idempotencyKey,
    }
  } catch (error) {
    try {
      await client.execute('ROLLBACK')
    } catch {}
    throw error
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
      reservedBalance: Math.max(0, current.reservedBalance - normalizedAmount),
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
    mutate: (current) => ({
      ...current,
      balance: current.balance + normalizedAmount,
      reservedBalance: Math.max(0, current.reservedBalance - normalizedAmount),
    }),
    notes,
    referencePrefix: 'REFUND',
    req,
    sourceTaskId: taskId,
    transactionType: 'refund',
    userId: normalizedUserId,
  })
}
