import type { CollectionAfterChangeHook } from 'payload'

const DEMO_WELCOME_CREDITS = Math.max(0, Number(process.env.DEMO_WELCOME_CREDITS ?? 0))
const INTERNAL_ACCESS = true

const createReferenceCode = (prefix: string) => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
}

const createSignupIdempotencyKey = (userId: number | string) => `signup-welcome:${userId}:${DEMO_WELCOME_CREDITS}`

export const createDefaultCreditAccount: CollectionAfterChangeHook = async ({ doc, operation, req }) => {
  if (operation !== 'create') {
    return doc
  }

  const existing = await req.payload.find({
    collection: 'credits',
    depth: 0,
    limit: 1,
    overrideAccess: INTERNAL_ACCESS,
    pagination: false,
    req,
    where: {
      user: {
        equals: doc.id,
      },
    },
  })

  let creditAccount = existing.docs[0]

  if (!creditAccount) {
    creditAccount = await req.payload.create({
      collection: 'credits',
      data: {
        accountLabel: '主积分账户',
        balance: DEMO_WELCOME_CREDITS,
        billingNotes:
          DEMO_WELCOME_CREDITS > 0 ? '演示环境：注册时自动赠送体验积分。' : '系统自动创建默认积分账户。',
        lifetimePurchased: DEMO_WELCOME_CREDITS,
        lifetimeSpent: 0,
        reservedBalance: 0,
        status: 'active',
        user: doc.id,
      },
      overrideAccess: INTERNAL_ACCESS,
      req,
    })
  }

  if (DEMO_WELCOME_CREDITS > 0) {
    const idempotencyKey = createSignupIdempotencyKey(doc.id)
    const existingGrant = await req.payload.find({
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

    if (!existingGrant.docs[0]) {
      await req.payload.create({
        collection: 'credit-transactions',
        data: {
          amount: DEMO_WELCOME_CREDITS,
          balanceAfter: DEMO_WELCOME_CREDITS,
          creditAccount: creditAccount.id,
          currency: 'credits',
          idempotencyKey,
          metadata: {
            source: 'user-signup',
          },
          notes: '新用户注册赠送演示积分',
          referenceCode: createReferenceCode('INIT'),
          type: 'manual_adjustment',
          user: doc.id,
        },
        overrideAccess: INTERNAL_ACCESS,
        req,
      })
    }
  }

  await req.payload.update({
    collection: 'users',
    id: doc.id,
    data: {
      creditsBalance: DEMO_WELCOME_CREDITS,
      lastActiveAt: new Date().toISOString(),
    },
    overrideAccess: INTERNAL_ACCESS,
    req,
  })

  return doc
}
