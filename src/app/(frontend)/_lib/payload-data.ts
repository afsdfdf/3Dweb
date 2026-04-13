import { headers } from 'next/headers'
import { getCachedPayload } from '@/lib/getCachedPayload'

export async function getTaskByCode(taskCode: string) {
  const payload = await getCachedPayload()
  const authResult = await payload.auth({
    headers: await headers(),
  })

  if (!authResult.user) {
    return null
  }

  const json = await payload.find({
    collection: 'generation-tasks',
    depth: 2,
    limit: 1,
    overrideAccess: false,
    user: authResult.user,
    where: {
      taskCode: {
        equals: taskCode,
      },
    },
  })

  return json.docs?.[0] ?? null
}
