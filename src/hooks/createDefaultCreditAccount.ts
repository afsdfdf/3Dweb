import type { CollectionAfterChangeHook } from 'payload'

const DEMO_WELCOME_CREDITS = 100

const createReferenceCode = (prefix: string) => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
}

export const createDefaultCreditAccount: CollectionAfterChangeHook = async ({ doc, operation, req }) => {
  if (operation !== 'create') {
    return doc
  }

  const existing = await req.payload.find({
    collection: 'credits',
    depth: 0,
    limit: 1,
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
        billingNotes: '本地演示环境：注册时自动赠送体验积分。',
        lifetimePurchased: DEMO_WELCOME_CREDITS,
        lifetimeSpent: 0,
        reservedBalance: 0,
        status: 'active',
        user: doc.id,
      },
      req,
    })
  }

  await req.payload.create({
    collection: 'credit-transactions',
    data: {
      amount: DEMO_WELCOME_CREDITS,
      balanceAfter: DEMO_WELCOME_CREDITS,
      creditAccount: creditAccount.id,
      currency: 'credits',
      metadata: {
        source: 'user-signup',
      },
      notes: '新用户注册赠送演示积分',
      referenceCode: createReferenceCode('INIT'),
      type: 'manual_adjustment',
      user: doc.id,
    },
    req,
  })

  await req.payload.update({
    collection: 'users',
    id: doc.id,
    data: {
      creditsBalance: DEMO_WELCOME_CREDITS,
      lastActiveAt: new Date().toISOString(),
    },
    req,
  })

  return doc
}
