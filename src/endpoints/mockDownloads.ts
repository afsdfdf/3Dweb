import type { PayloadRequest } from 'payload'

import { spendDownloadCredits } from '@/lib/creditLedger'
import { getMediaAccessURL } from '@/lib/s3SignedURL'

const unauthorized = () => Response.json({ message: 'Please sign in first' }, { status: 401 })

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
    return
  }

  await spendDownloadCredits({
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

    try {
      const model = await req.payload.findByID({
        collection: 'models',
        depth: 2,
        id: Number(modelId),
        overrideAccess: allowAnonymousPreview,
        req,
        ...(req.user ? { user: req.user } : {}),
      })

      if (allowAnonymousPreview && String(model.visibility || 'private') !== 'public') {
        return Response.json({ message: 'Model not found or preview is not allowed' }, { status: 404 })
      }

      const formats = Array.isArray(model.formats) ? model.formats : []
      const selectedFormat = formats.find((item) => String(item.format || '').toLowerCase() === format)

      if (!selectedFormat) {
        return Response.json({ message: 'The selected format is not available for this model' }, { status: 400 })
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
        const accessURL = await getMediaAccessURL({
          payload: req.payload,
          ttlSeconds: inline || preview ? 3600 : 600,
          url: remoteURL,
        })

        const upstream = await fetch(accessURL || remoteURL)
        if (!upstream.ok) {
          return Response.json({ message: 'Failed to fetch the model asset' }, { status: 502 })
        }

        const body = await upstream.arrayBuffer()
        const mimeType =
          fileRelation && typeof fileRelation === 'object' && 'mimeType' in fileRelation && typeof fileRelation.mimeType === 'string'
            ? fileRelation.mimeType
            : 'application/octet-stream'

        if (!inline && !preview) {
          await chargeDownloadIfNeeded({
            downloadCredits,
            format,
            modelId: Number(model.id),
            modelTitle: typeof model.title === 'string' ? model.title : null,
            req,
          })
        }

        return new Response(body, {
          headers: {
            'Content-Disposition': `${inline || preview ? 'inline' : 'attachment'}; filename="${model.title || `model-${model.id}`}.${format}"`,
            'Content-Type': mimeType,
          },
          status: 200,
        })
      }

      if (!inline && !preview) {
        await chargeDownloadIfNeeded({
          downloadCredits,
          format,
          modelId: Number(model.id),
          modelTitle: typeof model.title === 'string' ? model.title : null,
          req,
        })
      }
    } catch {
      return Response.json({ message: 'Model not found or download is not allowed' }, { status: 404 })
    }

    const content = `# Mock 3D File\nmodel=${modelId}\nformat=${format}\ngenerated_at=${new Date().toISOString()}\n`
    return new Response(content, {
      headers: {
        'Content-Disposition': `${inline || preview ? 'inline' : 'attachment'}; filename="mock-model-${modelId}.${format}"`,
        'Content-Type': 'application/octet-stream',
      },
      status: 200,
    })
  },
  method: 'get' as const,
  path: '/platform/mock/models/:modelId/download',
}
