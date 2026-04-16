import { headers } from 'next/headers'
import { getCachedPayload } from '@/lib/getCachedPayload'
import { TASK_DETAIL_QUERY_DEPTH } from '@/lib/queryDefaults'

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
    depth: TASK_DETAIL_QUERY_DEPTH,
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
