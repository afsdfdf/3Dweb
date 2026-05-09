import type { CollectionAfterChangeHook } from 'payload'

const getRelationId = (value: unknown) => {
  if (typeof value === 'number' || typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }

  if (value && typeof value === 'object' && 'id' in value) {
    const parsed = Number((value as { id?: unknown }).id)
    return Number.isFinite(parsed) ? parsed : null
  }

  return null
}

export const syncCreditBalanceMirror: CollectionAfterChangeHook = async ({ doc, req }) => {
  const userId = getRelationId(doc.user)
  if (!userId) return doc

  const balance = Number(doc.balance ?? 0)
  if (!Number.isFinite(balance)) return doc

  await req.payload.update({
    collection: 'users',
    data: {
      creditsBalance: balance,
    },
    id: userId,
    overrideAccess: true,
    req,
  })

  return doc
}
