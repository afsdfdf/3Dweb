import type { PayloadRequest } from 'payload'

import { getModelDetailSideModelsPage } from '@/app/(frontend)/model-detail/_lib/modelDetailData'
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

export const listModelRelatedEndpoint = {
  path: '/platform/models/:modelId/related',
  method: 'get' as const,
  handler: async (req: PayloadRequest) => {
    try {
      await ensurePayloadRequestUser(req)

      const modelId = Number(String(req.routeParams?.modelId || '0'))
      if (!Number.isFinite(modelId) || modelId <= 0) {
        return Response.json({ message: 'Invalid model ID.' }, { status: 400 })
      }

      const page = String(req.query?.page ?? '1')
      const limit = String(req.query?.limit ?? '12')
      const result = await getModelDetailSideModelsPage({
        currentUser: (req.user || null) as unknown as Parameters<
          typeof getModelDetailSideModelsPage
        >[0]['currentUser'],
        id: modelId,
        limit,
        page,
      })

      if (!result) {
        return Response.json({ message: 'Model not found.' }, { status: 404 })
      }

      return Response.json(result, {
        headers: {
          'Cache-Control': req.user ? 'private, max-age=30' : 'public, max-age=60',
        },
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load related models.'
      return Response.json({ message }, { status: 400 })
    }
  },
}
