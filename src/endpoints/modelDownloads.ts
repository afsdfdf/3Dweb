import type { PayloadRequest } from 'payload'

import { InsufficientCreditsError, refundDownloadCredits, spendDownloadCredits } from '@/lib/creditLedger'
import { queryPostgres } from '@/lib/postgres'
import { isAllowedRemoteAssetURL } from '@/lib/remoteAssetSecurity'
import { getMediaAccessURL } from '@/lib/mediaAccessURL'

type ModelDownloadEndpointTestHooks = {
  getMediaAccessURL?: typeof getMediaAccessURL
  isAllowedRemoteAssetURL?: typeof isAllowedRemoteAssetURL
  resolvePublicModelFormatAsset?: typeof resolvePublicModelFormatAsset
  refundDownloadCredits?: typeof refundDownloadCredits
  resolveModelFormatAsset?: typeof resolveModelFormatAsset
  spendDownloadCredits?: typeof spendDownloadCredits
}

let modelDownloadEndpointTestHooks: ModelDownloadEndpointTestHooks | null = null

export function __setModelDownloadEndpointTestHooks(hooks: ModelDownloadEndpointTestHooks | null) {
  modelDownloadEndpointTestHooks = hooks
}

const unauthorized = () => Response.json({ message: 'Please sign in first.' }, { status: 401 })

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

type ResolvedModelFormatAsset = {
  filename: null | string
  mimeType: null | string
  url: null | string
}

type DownloadAccessPolicy = {
  chargeDownloadCredits: boolean
  downloadCredits: number
}

const defaultDownloadAccessPolicy: DownloadAccessPolicy = {
  chargeDownloadCredits: false,
  downloadCredits: 0,
}

function readPositiveNumber(value: unknown) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric) || numeric <= 0) return 0
  return numeric
}

async function getDownloadAccessPolicy(req: PayloadRequest): Promise<DownloadAccessPolicy> {
  try {
    const settings = await req.payload.findGlobal({
      depth: 0,
      overrideAccess: true,
      req,
      slug: 'site-settings',
    })
    const policy = isRecord(settings?.modelAccessPolicy) ? settings.modelAccessPolicy : null

    return {
      chargeDownloadCredits: policy?.chargeDownloadCredits === true,
      downloadCredits: readPositiveNumber(policy?.downloadCredits),
    }
  } catch {
    return defaultDownloadAccessPolicy
  }
}

async function resolveModelFormatAsset(modelId: number, format: string): Promise<ResolvedModelFormatAsset | null> {
  const result = await queryPostgres<ResolvedModelFormatAsset>(
    `
      select
        media.filename as "filename",
        media.mime_type as "mimeType",
        media.url
      from models_formats mf
      left join media on media.id = mf.file_id
      where mf._parent_id = $1
        and lower(mf.format::text) = $2
      order by mf._order asc
      limit 1
    `,
    [modelId, format],
  )

  return result.rows[0] ?? null
}

async function resolvePublicModelFormatAsset(modelId: number, format: string): Promise<ResolvedModelFormatAsset | null> {
  const result = await queryPostgres<ResolvedModelFormatAsset>(
    `
      select
        media.filename as "filename",
        media.mime_type as "mimeType",
        media.url
      from models
      inner join models_formats mf on mf._parent_id = models.id
      left join media on media.id = mf.file_id
      where models.id = $1
        and models.visibility = 'public'
        and lower(mf.format::text) = $2
      order by mf._order asc
      limit 1
    `,
    [modelId, format],
  )

  return result.rows[0] ?? null
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

  return (modelDownloadEndpointTestHooks?.spendDownloadCredits || spendDownloadCredits)({
    amount: downloadCredits,
    format,
    modelId,
    notes: `${modelTitle || `Model #${modelId}`} ${format.toUpperCase()} download charge`,
    req,
    userId: Number(req.user.id),
  })
}

export const modelDownloadEndpoint = {
  handler: async (req: PayloadRequest) => {
    const modelId = String(req.routeParams?.modelId ?? '')
    const modelIdNumber = Number(modelId)
    const format = String(req.query?.format ?? 'glb').toLowerCase()
    const inline = String(req.query?.inline ?? '') === '1'
    const downloadPolicy = await getDownloadAccessPolicy(req)

    if (!Number.isFinite(modelIdNumber) || modelIdNumber <= 0) {
      return Response.json({ message: 'Invalid model ID.' }, { status: 400 })
    }

    if (!req.user) {
      if (!inline && !downloadPolicy.chargeDownloadCredits) {
        const publicFormatAsset = await (
          modelDownloadEndpointTestHooks?.resolvePublicModelFormatAsset || resolvePublicModelFormatAsset
        )(modelIdNumber, format)
        const publicURL = publicFormatAsset?.url

        if (!publicFormatAsset) return unauthorized()

        if (!publicURL) {
          return Response.json({ message: 'No downloadable model asset is available for this format.' }, { status: 404 })
        }

        const allowedSource = await (modelDownloadEndpointTestHooks?.isAllowedRemoteAssetURL || isAllowedRemoteAssetURL)({
          payload: req.payload,
          url: publicURL,
        })

        if (!allowedSource) {
          req.payload.logger.warn({
            modelId: modelIdNumber,
            msg: 'Blocked public model asset download because host is not on the allowlist.',
            remoteURL: publicURL,
          })

          return Response.json({ message: 'The model asset source is not allowed for download.' }, { status: 403 })
        }

        const accessURL = await (modelDownloadEndpointTestHooks?.getMediaAccessURL || getMediaAccessURL)({
          payload: req.payload,
          ttlSeconds: 600,
          url: publicURL,
        })
        if (!accessURL) {
          return Response.json({ message: 'The model asset URL is invalid or incomplete.' }, { status: 502 })
        }

        const allowedFetchTarget = await (modelDownloadEndpointTestHooks?.isAllowedRemoteAssetURL || isAllowedRemoteAssetURL)({
          payload: req.payload,
          url: accessURL,
        })

        if (!allowedFetchTarget) {
          return Response.json({ message: 'The model asset source is not allowed for download.' }, { status: 403 })
        }

        return Response.redirect(accessURL, 307)
      }

      return unauthorized()
    }

    let model: any = null
    try {
      model = await req.payload.findByID({
        collection: 'models',
        depth: 2,
        id: Number(modelId),
        overrideAccess: false,
        req,
        user: req.user,
      })
    } catch {
      return Response.json({ message: 'Model not found or you do not have access to this resource.' }, { status: 404 })
    }

    const formats = Array.isArray(model.formats) ? model.formats : []
    const selectedFormat = formats.find((item: any) => String(item.format || '').toLowerCase() === format)

    if (!selectedFormat) {
      return Response.json({ message: 'The selected format is not available for this model.' }, { status: 400 })
    }

    const selectedFormatDownloadCredits = readPositiveNumber(selectedFormat.downloadCredits)
    const downloadCredits = downloadPolicy.chargeDownloadCredits
      ? selectedFormatDownloadCredits || downloadPolicy.downloadCredits
      : 0
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
    const resolvedFormatAsset =
      remoteFromMedia || remoteFromTask
        ? null
        : await (modelDownloadEndpointTestHooks?.resolveModelFormatAsset || resolveModelFormatAsset)(Number(model.id), format)
    const remoteURL = remoteFromMedia || remoteFromTask || resolvedFormatAsset?.url

    if (!remoteURL) {
      return Response.json({ message: 'No downloadable model asset is available for this format.' }, { status: 404 })
    }

    if (remoteURL) {
      const allowedSource = await (modelDownloadEndpointTestHooks?.isAllowedRemoteAssetURL || isAllowedRemoteAssetURL)({
        payload: req.payload,
        url: remoteURL,
      })

      if (!allowedSource) {
        req.payload.logger.warn({
          modelId: model.id,
          msg: 'Blocked remote model asset fetch because host is not on the allowlist.',
          remoteURL,
        })

        return Response.json({ message: 'The model asset source is not allowed for download.' }, { status: 403 })
      }
    }

    const shouldCharge = downloadPolicy.chargeDownloadCredits
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
      const accessURL = await (modelDownloadEndpointTestHooks?.getMediaAccessURL || getMediaAccessURL)({
        payload: req.payload,
        ttlSeconds: inline ? 3600 : 600,
        url: remoteURL,
      })
      if (!accessURL) {
        throw new Error('ASSET_URL_INVALID')
      }

      const fetchURL = accessURL

      const allowedFetchTarget = await (modelDownloadEndpointTestHooks?.isAllowedRemoteAssetURL || isAllowedRemoteAssetURL)({
        payload: req.payload,
        url: fetchURL,
      })

      if (!allowedFetchTarget) {
        throw new Error('ASSET_HOST_NOT_ALLOWED')
      }

      if (!inline) {
        return Response.redirect(fetchURL, 307)
      }

      const upstream = await fetch(fetchURL)
      if (!upstream.ok) {
        throw new Error(`ASSET_FETCH_FAILED:${upstream.status}`)
      }

      const mimeType =
        resolvedFormatAsset?.mimeType ||
        (fileRelation && typeof fileRelation === 'object' && 'mimeType' in fileRelation && typeof fileRelation.mimeType === 'string'
          ? fileRelation.mimeType
          : 'application/octet-stream')

      const safeName = String(resolvedFormatAsset?.filename || model.title || `model-${model.id}`).replace(/["\r\n\\]/g, '')
      return new Response(upstream.body, {
        headers: {
          'Content-Disposition': `inline; filename="${safeName}"`,
          'Content-Type': mimeType,
        },
        status: 200,
      })
    } catch (error) {
      if (shouldCharge && chargeResult?.applied && req.user && downloadCredits > 0) {
        await (modelDownloadEndpointTestHooks?.refundDownloadCredits || refundDownloadCredits)({
          amount: downloadCredits,
          format,
          modelId: Number(model.id),
          notes: `${model.title || `Model #${model.id}`} ${format.toUpperCase()} download failed, credits refunded.`,
          req,
          userId: Number(req.user.id),
        }).catch(() => null)
      }

      if (error instanceof Error && error.message.startsWith('ASSET_FETCH_FAILED:')) {
        return Response.json({ message: 'The model asset is temporarily unavailable. Charges were not applied or were refunded automatically.' }, { status: 502 })
      }

      if (error instanceof Error && error.message === 'ASSET_HOST_NOT_ALLOWED') {
        return Response.json({ message: 'The model asset source is not allowed. Charges were not applied or were refunded automatically.' }, { status: 403 })
      }

      if (error instanceof Error && error.message === 'ASSET_URL_INVALID') {
        return Response.json({ message: 'The model asset URL is invalid or incomplete. Charges were not applied or were refunded automatically.' }, { status: 502 })
      }

      return Response.json({ message: 'Model download failed. Please try again later.' }, { status: 500 })
    }
  },
  method: 'get' as const,
  path: '/platform/models/:modelId/download',
}
