import type { PayloadRequest } from 'payload'

const INTERNAL_ACCESS = true

const createReferenceCode = (prefix: string) => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
}

const normalizeUserId = (userId: number | string) => {
  return typeof userId === 'number' ? userId : Number(userId)
}

const sanitizeKeyPart = (value: number | string) => String(value).trim().toLowerCase()

async function syncUserCreditBalance(args: {
  balance: number
  req: PayloadRequest
  userId: number
}) {
  const { balance, req, userId } = args

  await req.payload.update({
    collection: 'users',
    id: userId,
    data: {
      creditsBalance: balance,
      lastActiveAt: new Date().toISOString(),
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

async function findTaskCreditTransaction(args: {
  req: PayloadRequest
  taskId: number
  type: 'refund' | 'task_hold' | 'task_spend'
}) {
  const { req, taskId, type } = args

  const existing = await req.payload.find({
    collection: 'credit-transactions',
    depth: 0,
    limit: 1,
    overrideAccess: INTERNAL_ACCESS,
    pagination: false,
    req,
    where: {
      and: [
        {
          sourceTask: {
            equals: taskId,
          },
        },
        {
          type: {
            equals: type,
          },
        },
      ],
    },
  })

  return existing.docs[0] ?? null
}

async function findDownloadCreditTransaction(args: {
  format: string
  modelId: number
  req: PayloadRequest
  userId: number
}) {
  const { format, modelId, req, userId } = args

  const existing = await req.payload.find({
    collection: 'credit-transactions',
    depth: 0,
    limit: 1,
    overrideAccess: INTERNAL_ACCESS,
    pagination: false,
    req,
    where: {
      and: [
        {
          user: {
            equals: userId,
          },
        },
        {
          type: {
            equals: 'download_spend',
          },
        },
      ],
    },
  })

  return (
    existing.docs.find((item) => {
      const metadata = item.metadata && typeof item.metadata === 'object' && !Array.isArray(item.metadata) ? item.metadata : {}
      return Number(metadata.modelId || 0) === modelId && String(metadata.format || '') === format
    }) ?? null
  )
}

export async function ensureCreditAccount(args: { req: PayloadRequest; userId: number | string }) {
  const { req, userId } = args
  const normalizedUserId = normalizeUserId(userId)

  const existing = await req.payload.find({
    collection: 'credits',
    depth: 0,
    limit: 1,
    overrideAccess: INTERNAL_ACCESS,
    pagination: false,
    req,
    where: {
      user: {
        equals: normalizedUserId,
      },
    },
  })

  const current = existing.docs[0]
  if (current) {
    return current
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

  const existing = await findTransactionByIdempotencyKey({ idempotencyKey, req })
  if (existing) {
    return ensureCreditAccount({ req, userId: normalizedUserId })
  }

  const creditAccount = await ensureCreditAccount({ req, userId: normalizedUserId })
  const nextBalance = Number(creditAccount.balance || 0) + Number(amount || 0)
  const nextLifetimePurchased = Number(creditAccount.lifetimePurchased || 0) + Number(Math.max(amount, 0))

  const updatedAccount = await req.payload.update({
    collection: 'credits',
    id: creditAccount.id,
    data: {
      balance: nextBalance,
      billingNotes: notes,
      lifetimePurchased: nextLifetimePurchased,
    },
    overrideAccess: INTERNAL_ACCESS,
    req,
  })

  await req.payload.create({
    collection: 'credit-transactions',
    data: {
      amount,
      balanceAfter: nextBalance,
      creditAccount: updatedAccount.id,
      currency: 'credits',
      idempotencyKey,
      metadata,
      notes,
      referenceCode: createReferenceCode(referencePrefix),
      type: 'subscription_grant',
      user: normalizedUserId,
    },
    overrideAccess: INTERNAL_ACCESS,
    req,
  })

  await syncUserCreditBalance({
    balance: nextBalance,
    req,
    userId: normalizedUserId,
  })

  return updatedAccount
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

  if (normalizedAmount <= 0) return null

  const existingByKey = await findTransactionByIdempotencyKey({ idempotencyKey, req })
  if (existingByKey) {
    return ensureCreditAccount({ req, userId: normalizedUserId })
  }

  const existing = await findTaskCreditTransaction({
    req,
    taskId,
    type: 'task_hold',
  })

  if (existing) {
    return ensureCreditAccount({ req, userId: normalizedUserId })
  }

  const creditAccount = await ensureCreditAccount({ req, userId: normalizedUserId })
  const currentBalance = Number(creditAccount.balance || 0)
  const currentReserved = Number(creditAccount.reservedBalance || 0)

  if (currentBalance < normalizedAmount) {
    throw new Error(`积分不足，当前可用 ${currentBalance}，本次需要 ${normalizedAmount}。`)
  }

  const nextBalance = currentBalance - normalizedAmount
  const nextReserved = currentReserved + normalizedAmount

  const updatedAccount = await req.payload.update({
    collection: 'credits',
    id: creditAccount.id,
    data: {
      balance: nextBalance,
      billingNotes: notes,
      reservedBalance: nextReserved,
    },
    overrideAccess: INTERNAL_ACCESS,
    req,
  })

  await req.payload.create({
    collection: 'credit-transactions',
    data: {
      amount: -normalizedAmount,
      balanceAfter: nextBalance,
      creditAccount: updatedAccount.id,
      currency: 'credits',
      idempotencyKey,
      notes,
      referenceCode: createReferenceCode('TASKHOLD'),
      sourceTask: taskId,
      type: 'task_hold',
      user: normalizedUserId,
    },
    overrideAccess: INTERNAL_ACCESS,
    req,
  })

  await syncUserCreditBalance({
    balance: nextBalance,
    req,
    userId: normalizedUserId,
  })

  return updatedAccount
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

  if (normalizedAmount <= 0) return null

  const existingByKey = await findTransactionByIdempotencyKey({ idempotencyKey, req })
  if (existingByKey) {
    return ensureCreditAccount({ req, userId: normalizedUserId })
  }

  const existingSpend = await findTaskCreditTransaction({
    req,
    taskId,
    type: 'task_spend',
  })

  if (existingSpend) {
    return ensureCreditAccount({ req, userId: normalizedUserId })
  }

  const creditAccount = await ensureCreditAccount({ req, userId: normalizedUserId })
  const currentBalance = Number(creditAccount.balance || 0)
  const currentReserved = Number(creditAccount.reservedBalance || 0)
  const currentLifetimeSpent = Number(creditAccount.lifetimeSpent || 0)
  const nextReserved = Math.max(0, currentReserved - normalizedAmount)

  const updatedAccount = await req.payload.update({
    collection: 'credits',
    id: creditAccount.id,
    data: {
      billingNotes: notes,
      lifetimeSpent: currentLifetimeSpent + normalizedAmount,
      reservedBalance: nextReserved,
    },
    overrideAccess: INTERNAL_ACCESS,
    req,
  })

  await req.payload.create({
    collection: 'credit-transactions',
    data: {
      amount: 0,
      balanceAfter: currentBalance,
      creditAccount: updatedAccount.id,
      currency: 'credits',
      idempotencyKey,
      notes,
      referenceCode: createReferenceCode('TASKSPEND'),
      sourceTask: taskId,
      type: 'task_spend',
      user: normalizedUserId,
    },
    overrideAccess: INTERNAL_ACCESS,
    req,
  })

  await syncUserCreditBalance({
    balance: currentBalance,
    req,
    userId: normalizedUserId,
  })

  return updatedAccount
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

  if (normalizedAmount <= 0) return null

  const existingByKey = await findTransactionByIdempotencyKey({ idempotencyKey, req })
  if (existingByKey) {
    return ensureCreditAccount({ req, userId: normalizedUserId })
  }

  const existingSpend = await findTaskCreditTransaction({
    req,
    taskId,
    type: 'task_spend',
  })

  if (existingSpend) {
    return ensureCreditAccount({ req, userId: normalizedUserId })
  }

  const creditAccount = await ensureCreditAccount({ req, userId: normalizedUserId })
  const currentBalance = Number(creditAccount.balance || 0)
  const currentLifetimeSpent = Number(creditAccount.lifetimeSpent || 0)

  if (currentBalance < normalizedAmount) {
    throw new Error(`积分不足，当前可用 ${currentBalance}，本次需要 ${normalizedAmount}。`)
  }

  const nextBalance = currentBalance - normalizedAmount

  const updatedAccount = await req.payload.update({
    collection: 'credits',
    id: creditAccount.id,
    data: {
      balance: nextBalance,
      billingNotes: notes,
      lifetimeSpent: currentLifetimeSpent + normalizedAmount,
    },
    overrideAccess: INTERNAL_ACCESS,
    req,
  })

  await req.payload.create({
    collection: 'credit-transactions',
    data: {
      amount: -normalizedAmount,
      balanceAfter: nextBalance,
      creditAccount: updatedAccount.id,
      currency: 'credits',
      idempotencyKey,
      notes,
      referenceCode: createReferenceCode('TASKSPEND'),
      sourceTask: taskId,
      type: 'task_spend',
      user: normalizedUserId,
    },
    overrideAccess: INTERNAL_ACCESS,
    req,
  })

  await syncUserCreditBalance({
    balance: nextBalance,
    req,
    userId: normalizedUserId,
  })

  return updatedAccount
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
  const idempotencyKey = `download:${sanitizeKeyPart(normalizedUserId)}:${modelId}:${sanitizeKeyPart(normalizedFormat)}`

  if (normalizedAmount <= 0 || !normalizedFormat) return null

  const existingByKey = await findTransactionByIdempotencyKey({ idempotencyKey, req })
  if (existingByKey) {
    return ensureCreditAccount({ req, userId: normalizedUserId })
  }

  const existing = await findDownloadCreditTransaction({
    format: normalizedFormat,
    modelId,
    req,
    userId: normalizedUserId,
  })

  if (existing) {
    return ensureCreditAccount({ req, userId: normalizedUserId })
  }

  const creditAccount = await ensureCreditAccount({ req, userId: normalizedUserId })
  const currentBalance = Number(creditAccount.balance || 0)
  const currentLifetimeSpent = Number(creditAccount.lifetimeSpent || 0)

  if (currentBalance < normalizedAmount) {
    throw new Error(`积分不足，当前可用 ${currentBalance}，下载需要 ${normalizedAmount}。`)
  }

  const nextBalance = currentBalance - normalizedAmount

  const updatedAccount = await req.payload.update({
    collection: 'credits',
    id: creditAccount.id,
    data: {
      balance: nextBalance,
      billingNotes: notes,
      lifetimeSpent: currentLifetimeSpent + normalizedAmount,
    },
    overrideAccess: INTERNAL_ACCESS,
    req,
  })

  await req.payload.create({
    collection: 'credit-transactions',
    data: {
      amount: -normalizedAmount,
      balanceAfter: nextBalance,
      creditAccount: updatedAccount.id,
      currency: 'credits',
      idempotencyKey,
      metadata: {
        format: normalizedFormat,
        modelId,
        source: 'model-download',
      },
      notes,
      referenceCode: createReferenceCode('DOWNLOAD'),
      type: 'download_spend',
      user: normalizedUserId,
    },
    overrideAccess: INTERNAL_ACCESS,
    req,
  })

  await syncUserCreditBalance({
    balance: nextBalance,
    req,
    userId: normalizedUserId,
  })

  return updatedAccount
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

  if (normalizedAmount <= 0) return null

  const existingByKey = await findTransactionByIdempotencyKey({ idempotencyKey, req })
  if (existingByKey) {
    return ensureCreditAccount({ req, userId: normalizedUserId })
  }

  const existingRefund = await findTaskCreditTransaction({
    req,
    taskId,
    type: 'refund',
  })

  if (existingRefund) {
    return ensureCreditAccount({ req, userId: normalizedUserId })
  }

  const creditAccount = await ensureCreditAccount({ req, userId: normalizedUserId })
  const currentBalance = Number(creditAccount.balance || 0)
  const currentReserved = Number(creditAccount.reservedBalance || 0)
  const nextBalance = currentBalance + normalizedAmount
  const nextReserved = Math.max(0, currentReserved - normalizedAmount)

  const updatedAccount = await req.payload.update({
    collection: 'credits',
    id: creditAccount.id,
    data: {
      balance: nextBalance,
      billingNotes: notes,
      reservedBalance: nextReserved,
    },
    overrideAccess: INTERNAL_ACCESS,
    req,
  })

  await req.payload.create({
    collection: 'credit-transactions',
    data: {
      amount: normalizedAmount,
      balanceAfter: nextBalance,
      creditAccount: updatedAccount.id,
      currency: 'credits',
      idempotencyKey,
      notes,
      referenceCode: createReferenceCode('REFUND'),
      sourceTask: taskId,
      type: 'refund',
      user: normalizedUserId,
    },
    overrideAccess: INTERNAL_ACCESS,
    req,
  })

  await syncUserCreditBalance({
    balance: nextBalance,
    req,
    userId: normalizedUserId,
  })

  return updatedAccount
}
