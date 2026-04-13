import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getCachedPayload } from '@/lib/getCachedPayload'

async function getPayloadWithUser() {
  const payload = await getCachedPayload()
  const authResult = await payload.auth({
    headers: await headers(),
  })

  return {
    payload,
    user: authResult.user,
  }
}

export async function getCurrentUser() {
  const { user } = await getPayloadWithUser()
  return user ?? null
}

export async function requireUser() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  return user
}

export async function getCurrentUserTasks() {
  const { payload, user } = await getPayloadWithUser()
  if (!user) return { docs: [] }

  return payload.find({
    collection: 'generation-tasks',
    depth: 1,
    limit: 20,
    overrideAccess: false,
    sort: '-updatedAt',
    user,
  })
}

export async function getCurrentUserModels() {
  const { payload, user } = await getPayloadWithUser()
  if (!user) return { docs: [] }

  return payload.find({
    collection: 'models',
    depth: 1,
    limit: 20,
    overrideAccess: false,
    sort: '-updatedAt',
    user,
  })
}

export async function getCurrentUserOrders() {
  const { payload, user } = await getPayloadWithUser()
  if (!user) return { docs: [] }

  return payload.find({
    collection: 'print-orders',
    depth: 1,
    limit: 20,
    overrideAccess: false,
    sort: '-updatedAt',
    user,
  })
}

export async function getCurrentUserOrderById(id: string | number) {
  const { payload, user } = await getPayloadWithUser()
  if (!user) return null

  try {
    return await payload.findByID({
      collection: 'print-orders',
      depth: 2,
      id,
      overrideAccess: false,
      user,
    })
  } catch {
    return null
  }
}

export async function getCurrentUserCreditAccount() {
  const { payload, user } = await getPayloadWithUser()
  if (!user) return null

  const json = await payload.find({
    collection: 'credits',
    depth: 0,
    limit: 1,
    overrideAccess: false,
    sort: '-updatedAt',
    user,
  })

  return json.docs?.[0] ?? null
}

export async function getCurrentUserCreditTransactions() {
  const { payload, user } = await getPayloadWithUser()
  if (!user) return { docs: [] }

  return payload.find({
    collection: 'credit-transactions',
    depth: 1,
    limit: 20,
    overrideAccess: false,
    sort: '-createdAt',
    user,
  })
}
