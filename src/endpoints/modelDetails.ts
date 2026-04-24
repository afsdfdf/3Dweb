import type { PayloadRequest } from 'payload'

import { getModelDetail } from '@/lib/modelDetailService'
import { ensurePayloadRequestUser } from '@/lib/payloadAuthFallback'

export const getModelDetailEndpoint = {
  path: '/social/models/:modelId/detail',
  method: 'get' as const,
  handler: async (req: PayloadRequest) => {
    try {
      await ensurePayloadRequestUser(req)

      const modelId = Number(String(req.routeParams?.modelId || '0'))
      if (!Number.isFinite(modelId) || modelId <= 0) {
        return Response.json({ message: 'Invalid model ID.' }, { status: 400 })
      }

      const detail = await getModelDetail({
        modelId,
        req,
      })

      return Response.json(detail)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load model detail.'
      return Response.json({ message }, { status: 400 })
    }
  },
}
