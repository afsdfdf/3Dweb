import type { PayloadRequest } from 'payload'

import { InsufficientCreditsError, refundDownloadCredits, spendDownloadCredits } from '@/lib/creditLedger'
import { isAllowedRemoteAssetURL } from '@/lib/remoteAssetSecurity'
import { getMediaAccessURL } from '@/lib/s3SignedURL'

const unauthorized = () => Response.json({ message: '请先登录' }, { status: 401 })

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

async function chargeDownloadIfNeeded(args: {
  downloadCredits: number
  format: string
  modelId: number
  modelTitle?: string | null
  req: PayloadRequest
}) {
  const { downloadCredits, format, modelId, modelTitle, req } = args

  if (!req.user || downloadCredits <= 0) {
    return { applied: false }
  }

  return spendDownloadCredits({
    amount: downloadCredits,
    format,
    modelId,
    notes: `${modelTitle || `Model #${modelId}`} ${format.toUpperCase()} download charge`,
    req,
    userId: Number(req.user.id),
  })
}

export const mockModelDownloadEndpoint = {
  handler: async (req: PayloadRequest) => {
    const modelId = String(req.routeParams?.modelId ?? '')
    const format = String(req.query?.format ?? 'glb').toLowerCase()
    const inline = String(req.query?.inline ?? '') === '1'
    const preview = String(req.query?.preview ?? '') === '1'
    const allowAnonymousPreview = inline && preview

    if (!req.user && !allowAnonymousPreview) return unauthorized()

    let model: any = null
    try {
      model = await req.payload.findByID({
        collection: 'models',
        depth: 2,
        id: Number(modelId),
        overrideAccess: allowAnonymousPreview,
        req,
        ...(req.user ? { user: req.user } : {}),
      })
    } catch {
      return Response.json({ message: '模型不存在或你无权下载该资源' }, { status: 404 })
    }

    if (allowAnonymousPreview && String(model.visibility || 'private') !== 'public') {
      return Response.json({ message: '该模型未开放预览' }, { status: 404 })
    }

    const formats = Array.isArray(model.formats) ? model.formats : []
    const selectedFormat = formats.find((item: any) => String(item.format || '').toLowerCase() === format)

    if (!selectedFormat) {
      return Response.json({ message: '当前模型不提供所选格式' }, { status: 400 })
    }

    const downloadCredits = Math.max(0, Number(selectedFormat.downloadCredits || 0))
    const fileRelation = selectedFormat.file
    const remoteFromMedia =
      fileRelation && typeof fileRelation === 'object' && 'url' in fileRelation && typeof fileRelation.url === 'string'
        ? fileRelation.url
        : ''

    const sourceTask =
      model.sourceTask && typeof model.sourceTask === 'object' && !Array.isArray(model.sourceTask) ? model.sourceTask : null
    const callbackPayload = sourceTask && isRecord(sourceTask.callbackPayload) ? sourceTask.callbackPayload : null
    const modelURLs = callbackPayload && isRecord(callbackPayload.modelUrls) ? callbackPayload.modelUrls : null
    const remoteFromTask = modelURLs && typeof modelURLs[format] === 'string' ? String(modelURLs[format]) : ''
    const remoteURL = remoteFromMedia || remoteFromTask

    if (remoteURL) {
      const allowedSource = await isAllowedRemoteAssetURL({
        payload: req.payload,
        url: remoteURL,
      })

      if (!allowedSource) {
        req.payload.logger.warn({
          modelId: model.id,
          msg: 'Blocked remote model asset fetch because host is not on the allowlist.',
          remoteURL,
        })

        return Response.json({ message: '模型资源来源未被允许，下载已被拒绝' }, { status: 403 })
      }
    }

    const shouldCharge = !inline && !preview
    let chargeResult: { applied?: boolean } | null = null

    if (shouldCharge) {
      try {
        chargeResult = await chargeDownloadIfNeeded({
          downloadCredits,
          format,
          modelId: Number(model.id),
          modelTitle: typeof model.title === 'string' ? model.title : null,
          req,
        })
      } catch (error) {
        if (error instanceof InsufficientCreditsError) {
          return Response.json(
            {
              code: 'INSUFFICIENT_CREDITS',
              message: error.message,
            },
            { status: 402 },
          )
        }

        throw error
      }
    }

    try {
      if (remoteURL) {
        const accessURL = await getMediaAccessURL({
          payload: req.payload,
          ttlSeconds: inline || preview ? 3600 : 600,
          url: remoteURL,
        })
        const fetchURL = accessURL || remoteURL

        const allowedFetchTarget = await isAllowedRemoteAssetURL({
          payload: req.payload,
          url: fetchURL,
        })

        if (!allowedFetchTarget) {
          throw new Error('ASSET_HOST_NOT_ALLOWED')
        }

        if (!inline && !preview) {
          return Response.redirect(fetchURL, 307)
        }

        const upstream = await fetch(fetchURL)
        if (!upstream.ok) {
          throw new Error(`ASSET_FETCH_FAILED:${upstream.status}`)
        }

        const mimeType =
          fileRelation && typeof fileRelation === 'object' && 'mimeType' in fileRelation && typeof fileRelation.mimeType === 'string'
            ? fileRelation.mimeType
            : 'application/octet-stream'

        return new Response(upstream.body, {
          headers: {
            'Content-Disposition': `inline; filename="${model.title || `model-${model.id}`}.${format}"`,
            'Content-Type': mimeType,
          },
          status: 200,
        })
      }

      const content = `# Mock 3D File\nmodel=${modelId}\nformat=${format}\ngenerated_at=${new Date().toISOString()}\n`
      return new Response(content, {
        headers: {
          'Content-Disposition': `${inline || preview ? 'inline' : 'attachment'}; filename="mock-model-${modelId}.${format}"`,
          'Content-Type': 'application/octet-stream',
        },
        status: 200,
      })
    } catch (error) {
      if (shouldCharge && chargeResult?.applied && req.user && downloadCredits > 0) {
        await refundDownloadCredits({
          amount: downloadCredits,
          format,
          modelId: Number(model.id),
          notes: `${model.title || `Model #${model.id}`} ${format.toUpperCase()} download failed, credits refunded.`,
          req,
          userId: Number(req.user.id),
        }).catch(() => null)
      }

      if (error instanceof Error && error.message.startsWith('ASSET_FETCH_FAILED:')) {
        return Response.json({ message: '模型资源暂时不可用，未完成下载扣费或已自动退款' }, { status: 502 })
      }

      if (error instanceof Error && error.message === 'ASSET_HOST_NOT_ALLOWED') {
        return Response.json({ message: '模型资源来源未被允许，未完成下载扣费或已自动退款' }, { status: 403 })
      }

      return Response.json({ message: '模型下载失败，请稍后重试' }, { status: 500 })
    }
  },
  method: 'get' as const,
  path: '/platform/mock/models/:modelId/download',
}
