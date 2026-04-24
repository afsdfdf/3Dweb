import type { PayloadRequest } from 'payload'

import { rejectRateLimitedEndpoint } from '@/lib/endpointRateLimit'
import { getCanonicalAppURL } from '@/lib/getCanonicalAppURL'
import { getModelGLBSourceURL } from '@/lib/modelAssetURL'
import { isAllowedRemoteAssetURL } from '@/lib/remoteAssetSecurity'
import { getMediaAccessURL } from '@/lib/s3SignedURL'

const defaultMimeTypeByFormat: Record<string, string> = {
  glb: 'model/gltf-binary',
}

const buildUpstreamHeaders = (req: PayloadRequest, value: string) => {
  if (!value.startsWith('/')) {
    return undefined
  }

  const headers = new Headers()
  const cookie = req.headers.get('cookie')
  const authorization = req.headers.get('authorization')

  if (cookie) {
    headers.set('cookie', cookie)
  }

  if (authorization) {
    headers.set('authorization', authorization)
  }

  return headers
}

const resolveFetchURL = (value: string) => {
  if (value.startsWith('/')) {
    return new URL(value, getCanonicalAppURL()).toString()
  }

  return value
}

const getMimeType = (fileRelation: unknown, format: string) => {
  if (fileRelation && typeof fileRelation === 'object' && 'mimeType' in fileRelation && typeof fileRelation.mimeType === 'string') {
    return fileRelation.mimeType
  }

  return defaultMimeTypeByFormat[format] || 'application/octet-stream'
}

type ModelViewerEndpointTestHooks = {
  fetch?: typeof fetch
  getMediaAccessURL?: typeof getMediaAccessURL
  isAllowedRemoteAssetURL?: typeof isAllowedRemoteAssetURL
}

let modelViewerEndpointTestHooks: ModelViewerEndpointTestHooks | null = null

export function __setModelViewerEndpointTestHooks(hooks: ModelViewerEndpointTestHooks | null) {
  modelViewerEndpointTestHooks = hooks
}

export const modelViewerEndpoint = {
  handler: async (req: PayloadRequest) => {
    const modelId = Number(String(req.routeParams?.modelId ?? '0'))
    const format = String(req.query?.format ?? 'glb').toLowerCase()

    if (!Number.isFinite(modelId) || modelId <= 0) {
      return Response.json({ message: 'Invalid model id.' }, { status: 400 })
    }

    const rateLimited = await rejectRateLimitedEndpoint({
      req,
      scope: 'model-preview',
    })

    if (rateLimited) {
      return rateLimited
    }

    let accessCheckedModel: any = null
    try {
      accessCheckedModel = await req.payload.findByID({
        collection: 'models',
        depth: 2,
        id: modelId,
        overrideAccess: false,
        req,
        ...(req.user ? { user: req.user } : {}),
      })
    } catch {
      return Response.json({ message: 'Model not found or you do not have access to this resource.' }, { status: 404 })
    }

    if (format !== 'glb') {
      return Response.json({ message: 'Only GLB viewer assets are supported.' }, { status: 400 })
    }

    let model = accessCheckedModel

    try {
      model = await req.payload.findByID({
        collection: 'models',
        depth: 2,
        id: modelId,
        overrideAccess: true,
        req,
      })
    } catch {
      model = accessCheckedModel
    }

    const sourceURL = getModelGLBSourceURL({ model }) || getModelGLBSourceURL({ model: accessCheckedModel })
    if (!sourceURL) {
      return Response.json({ message: 'No renderable GLB asset is available for this model.' }, { status: 404 })
    }

    const allowedSource = await (modelViewerEndpointTestHooks?.isAllowedRemoteAssetURL || isAllowedRemoteAssetURL)({
      payload: req.payload,
      url: sourceURL,
    })

    if (!allowedSource) {
      req.payload.logger.warn({
        modelId: model.id,
        msg: 'Blocked model viewer fetch because host is not on the allowlist.',
        sourceURL,
      })

      return Response.json({ message: 'The model asset source is not allowed for viewing.' }, { status: 403 })
    }

    const accessURL =
      (await (modelViewerEndpointTestHooks?.getMediaAccessURL || getMediaAccessURL)({
        payload: req.payload,
        ttlSeconds: 3600,
        url: sourceURL,
      })) || sourceURL

    const fetchURL = resolveFetchURL(accessURL)
    const allowedFetchTarget = await (modelViewerEndpointTestHooks?.isAllowedRemoteAssetURL || isAllowedRemoteAssetURL)({
      payload: req.payload,
      url: fetchURL,
    })

    if (!allowedFetchTarget) {
      return Response.json({ message: 'The model asset source is not allowed for viewing.' }, { status: 403 })
    }

    const upstream = await (modelViewerEndpointTestHooks?.fetch || fetch)(fetchURL, {
      headers: buildUpstreamHeaders(req, accessURL),
    })
    if (!upstream.ok || !upstream.body) {
      return Response.json({ message: 'The model asset is temporarily unavailable.' }, { status: 502 })
    }

    const formats = Array.isArray(model.formats) ? model.formats : []
    const selectedFormat = formats.find((item: any) => String(item?.format || '').toLowerCase() === format) || null
    const mimeType = getMimeType(selectedFormat && typeof selectedFormat === 'object' ? selectedFormat.file : null, format)

    return new Response(upstream.body, {
      headers: {
        'Cache-Control': 'private, max-age=300',
        'Content-Type': mimeType,
      },
      status: 200,
    })
  },
  method: 'get' as const,
  path: '/platform/models/:modelId/viewer',
}
