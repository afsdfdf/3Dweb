import type { PayloadRequest } from 'payload'

import { getCanonicalAppURL } from '@/lib/getCanonicalAppURL'
import { getMediaAccessURL } from '@/lib/s3SignedURL'

export type MeshyImageTask = {
  id: string
  model_urls?: Record<string, string | null | undefined>
  progress?: number | null
  status?: string | null
  task_error?: { message?: string | null } | null
  thumbnail_url?: string | null
  texture_urls?: unknown
}

export type MeshyTextTask = MeshyImageTask & {
  prompt?: string | null
}

export type MeshySettings = {
  apiKey: string
  baseURL: string
  enablePBR: boolean
  imageEnhancement: boolean
  imageTo3DAiModel: string
  moderation: boolean
  removeLighting: boolean
  shouldTexture: boolean
  textTo3DAiModel: string
}

const DEFAULT_MESHY_SETTINGS: MeshySettings = {
  apiKey: '',
  baseURL: 'https://api.meshy.ai',
  enablePBR: false,
  imageEnhancement: true,
  imageTo3DAiModel: 'latest',
  moderation: false,
  removeLighting: true,
  shouldTexture: true,
  textTo3DAiModel: 'latest',
}

export class MeshyAPIError extends Error {
  detail: string
  status: number

  constructor(args: { detail: string; status: number }) {
    super(`Meshy API error (${args.status}): ${args.detail}`)
    this.name = 'MeshyAPIError'
    this.detail = args.detail
    this.status = args.status
  }
}

export function isMeshyConcurrencyError(error: unknown): error is MeshyAPIError {
  return (
    error instanceof MeshyAPIError &&
    error.status === 429 &&
    /NoMoreConcurrentTasks|concurrent|rate|limit/i.test(error.detail)
  )
}

const normalizeBaseURL = (value: string) => {
  return value.replace(/\/+$/, '')
}

const normalizeConfiguredBaseURL = (value: string) => {
  const normalized = normalizeBaseURL(value.trim())

  return normalized.replace(/\/openapi\/v[12]$/i, '')
}

const toRecord = (value: unknown): Record<string, unknown> => {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {}
}

const parseErrorMessage = async (response: Response) => {
  try {
    const json = (await response.json()) as Record<string, unknown>
    const detail = typeof json.message === 'string' ? json.message : typeof json.error === 'string' ? json.error : ''
    if (detail) return detail
    return JSON.stringify(json)
  } catch {
    return await response.text()
  }
}

async function requestMeshy<T>(args: {
  body?: Record<string, unknown>
  method?: 'GET' | 'POST'
  path: string
  settings: MeshySettings
}) {
  const { body, method = 'GET', path, settings } = args
  const timeoutMs = Math.max(1000, Number(process.env.PROVIDER_REQUEST_TIMEOUT_MS || 30000))

  const response = await fetch(`${normalizeBaseURL(settings.baseURL)}${path}`, {
    body: body ? JSON.stringify(body) : undefined,
    headers: {
      Authorization: `Bearer ${settings.apiKey}`,
      'Content-Type': 'application/json',
    },
    method,
    signal: AbortSignal.timeout(timeoutMs),
  })

  if (!response.ok) {
    const detail = await parseErrorMessage(response)
    throw new MeshyAPIError({ detail, status: response.status })
  }

  return (await response.json()) as T
}

const normalizeCreatedTask = <T extends Record<string, unknown>>(response: T) => {
  if (typeof response.id === 'string' && response.id) {
    return response
  }

  if (typeof response.result === 'string' && response.result) {
    return {
      ...response,
      id: response.result,
    }
  }

  throw new Error('Meshy did not return a task ID.')
}

export async function getMeshySettings(req: PayloadRequest): Promise<MeshySettings> {
  const config = await req.payload
    .findGlobal({
      slug: 'ai-provider-settings',
    })
    .catch(() => null)

  const meshy = toRecord(config?.meshy)
  const apiKey = (process.env.MESHY_API_KEY || '').trim()
  const envBaseURL = (process.env.MESHY_API_BASE_URL || '').trim()
  const globalBaseURL = typeof meshy.baseURL === 'string' && meshy.baseURL.trim() ? meshy.baseURL.trim() : ''

  return {
    apiKey,
    baseURL: normalizeConfiguredBaseURL(envBaseURL || globalBaseURL || DEFAULT_MESHY_SETTINGS.baseURL),
    enablePBR: typeof meshy.enablePBR === 'boolean' ? meshy.enablePBR : DEFAULT_MESHY_SETTINGS.enablePBR,
    imageEnhancement:
      typeof meshy.imageEnhancement === 'boolean' ? meshy.imageEnhancement : DEFAULT_MESHY_SETTINGS.imageEnhancement,
    imageTo3DAiModel:
      typeof meshy.imageTo3DAiModel === 'string' && meshy.imageTo3DAiModel.trim()
        ? meshy.imageTo3DAiModel
        : DEFAULT_MESHY_SETTINGS.imageTo3DAiModel,
    moderation: typeof meshy.moderation === 'boolean' ? meshy.moderation : DEFAULT_MESHY_SETTINGS.moderation,
    removeLighting: typeof meshy.removeLighting === 'boolean' ? meshy.removeLighting : DEFAULT_MESHY_SETTINGS.removeLighting,
    shouldTexture: typeof meshy.shouldTexture === 'boolean' ? meshy.shouldTexture : DEFAULT_MESHY_SETTINGS.shouldTexture,
    textTo3DAiModel:
      typeof meshy.textTo3DAiModel === 'string' && meshy.textTo3DAiModel.trim()
        ? meshy.textTo3DAiModel
        : DEFAULT_MESHY_SETTINGS.textTo3DAiModel,
  }
}

export function isMeshyConfigured(settings: MeshySettings) {
  return Boolean(settings.apiKey)
}

export async function resolveMeshyImageURL(args: {
  sourceImageAsset?: { publicUrl?: string | null } | null
  mediaId?: number
  req: PayloadRequest
}) {
  if (args.sourceImageAsset?.publicUrl && typeof args.sourceImageAsset.publicUrl === 'string') {
    return args.sourceImageAsset.publicUrl
  }

  if (!args.mediaId) {
    throw new Error('The selected source image does not have a public URL for Meshy.')
  }

  const media = await args.req.payload.findByID({
    collection: 'media',
    depth: 0,
    id: args.mediaId,
    overrideAccess: false,
    req: args.req,
  })

  const mediaURL = typeof media.url === 'string' ? media.url : ''
  if (!mediaURL) {
    throw new Error('The selected source image does not have a public URL for Meshy.')
  }

  const absoluteURL = mediaURL.startsWith('http') ? mediaURL : `${getCanonicalAppURL()}${mediaURL}`
  const accessURL = await getMediaAccessURL({
    payload: args.req.payload,
    ttlSeconds: 3600,
    url: absoluteURL,
  })

  return accessURL || absoluteURL
}

export async function createMeshyTextPreviewTask(args: {
  prompt: string
  settings: MeshySettings
  style?: string
}) {
  const { prompt, settings, style } = args

  const body: Record<string, unknown> = {
    ai_model: settings.textTo3DAiModel,
    mode: 'preview',
    moderation: settings.moderation,
    prompt,
  }

  if (style === 'realistic') {
    body.art_style = 'realistic'
  }

  const created = await requestMeshy<MeshyTextTask & { result?: string }>({
    body,
    method: 'POST',
    path: '/openapi/v2/text-to-3d',
    settings,
  })

  return normalizeCreatedTask(created) as MeshyTextTask
}

export async function createMeshyTextRefineTask(args: {
  previewTaskId: string
  prompt?: string
  settings: MeshySettings
  targetFormats?: string[]
}) {
  const { previewTaskId, prompt, settings, targetFormats } = args

  const body: Record<string, unknown> = {
    ai_model: settings.textTo3DAiModel,
    enable_pbr: settings.enablePBR,
    mode: 'refine',
    moderation: settings.moderation,
    preview_task_id: previewTaskId,
  }

  if (prompt && prompt.trim()) {
    body.texture_prompt = prompt.trim()
  }

  if (targetFormats?.length) {
    body.target_formats = targetFormats
  }

  const created = await requestMeshy<MeshyTextTask & { result?: string }>({
    body,
    method: 'POST',
    path: '/openapi/v2/text-to-3d',
    settings,
  })

  return normalizeCreatedTask(created) as MeshyTextTask
}

export async function retrieveMeshyTextTask(args: {
  settings: MeshySettings
  taskId: string
}) {
  return requestMeshy<MeshyTextTask>({
    path: `/openapi/v2/text-to-3d/${args.taskId}`,
    settings: args.settings,
  })
}

export async function createMeshyImageTask(args: {
  imageURL: string
  prompt?: string
  settings: MeshySettings
  targetFormats?: string[]
}) {
  const { imageURL, prompt, settings, targetFormats } = args

  const body: Record<string, unknown> = {
    ai_model: settings.imageTo3DAiModel,
    enable_pbr: settings.enablePBR,
    image_enhancement: settings.imageEnhancement,
    image_url: imageURL,
    moderation: settings.moderation,
    remove_background: true,
    should_texture: settings.shouldTexture,
  }

  body.remove_lighting = settings.removeLighting

  if (prompt && prompt.trim()) {
    body.texture_prompt = prompt.trim()
  }

  if (targetFormats?.length) {
    body.target_formats = targetFormats
  }

  const created = await requestMeshy<MeshyImageTask & { result?: string }>({
    body,
    method: 'POST',
    path: '/openapi/v1/image-to-3d',
    settings,
  })

  return normalizeCreatedTask(created) as MeshyImageTask
}

export async function retrieveMeshyImageTask(args: {
  settings: MeshySettings
  taskId: string
}) {
  return requestMeshy<MeshyImageTask>({
    path: `/openapi/v1/image-to-3d/${args.taskId}`,
    settings: args.settings,
  })
}

export function mapMeshyStatus(status?: string | null) {
  switch (String(status || '').toUpperCase()) {
    case 'PENDING':
      return { progress: 10, status: 'queued' as const }
    case 'IN_PROGRESS':
      return { progress: 60, status: 'processing' as const }
    case 'SUCCEEDED':
      return { progress: 100, status: 'succeeded' as const }
    case 'FAILED':
    case 'CANCELED':
      return { progress: 100, status: 'failed' as const }
    default:
      return { progress: 25, status: 'processing' as const }
  }
}

export function getMeshyFailureReason(task: MeshyImageTask | MeshyTextTask) {
  return task.task_error?.message || `Meshy task ${task.id} failed.`
}
