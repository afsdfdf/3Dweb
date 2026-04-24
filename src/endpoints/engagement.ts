import type { PayloadRequest } from 'payload'

import { recordEngagementView } from '@/lib/engagementService'
import { ensurePayloadRequestUser } from '@/lib/payloadAuthFallback'
import { rejectDisallowedMutationOrigin } from '@/lib/requestSecurity'

export const recordEngagementViewEndpoint = {
  path: '/engagement/view',
  method: 'post' as const,
  handler: async (req: PayloadRequest) => {
    const blocked = await rejectDisallowedMutationOrigin(req)
    if (blocked) return blocked

    await ensurePayloadRequestUser(req)

    try {
      const body = req.json ? await req.json() : {}
      const targetType = body.targetType === 'creator-profile' ? 'creator-profile' : body.targetType === 'model' ? 'model' : null
      const targetId = Number(body.targetId)

      if (!targetType || !Number.isFinite(targetId) || targetId <= 0) {
        return Response.json({ message: 'Invalid engagement target.' }, { status: 400 })
      }

      const result = await recordEngagementView({
        req,
        targetId,
        targetType,
      })

      return Response.json(result)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to record view.'
      return Response.json({ message }, { status: 400 })
    }
  },
}
