import type { CollectionAfterChangeHook } from 'payload'

import { ensureCreditAccount, grantCredits } from '@/lib/creditLedger'

const DEMO_WELCOME_CREDITS = Math.max(0, Number(process.env.DEMO_WELCOME_CREDITS ?? 0))

const createSignupIdempotencyKey = (userId: number | string) => `signup-welcome:${userId}:${DEMO_WELCOME_CREDITS}`

export const createDefaultCreditAccount: CollectionAfterChangeHook = async ({ doc, operation, req }) => {
  if (operation !== 'create') {
    return doc
  }

  await ensureCreditAccount({
    req,
    userId: doc.id,
  })

  if (DEMO_WELCOME_CREDITS > 0) {
    await grantCredits({
      amount: DEMO_WELCOME_CREDITS,
      idempotencyKey: createSignupIdempotencyKey(doc.id),
      metadata: {
        source: 'user-signup',
      },
      notes: '新用户注册赠送演示积分。',
      referencePrefix: 'INIT',
      req,
      userId: doc.id,
    })
  }

  return doc
}
