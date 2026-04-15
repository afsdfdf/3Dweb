import type { PayloadRequest } from 'payload'

export type MeshyImageTask = {
  id: string
  model_urls?: Record<string, string | null | undefined>
  progress?: number | null
  status?: string | null
  task_error?: { message?: string | null } | null
  thumbnail_url?: string | null
  texture_urls?: Record<string, string | null | undefined>
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

const normalizeBaseURL = (value: string) => {
  return value.replace(/\/+$/, '')
}

const getAppOrigin = (req: PayloadRequest) => {
  const origin = req.headers?.get?.('origin')
  if (origin) return origin

  const forwardedHost = req.headers?.get?.('x-forwarded-host')
  const host = forwardedHost || req.headers?.get?.('host')
  const proto = req.headers?.get?.('x-forwarded-proto') || 'http'

  if (host) {
    return `${proto}://${host}`
  }

  return process.env.NEXT_PUBLIC_APP_URL || 'http://127.0.0.1:3000'
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

  const response = await fetch(`${normalizeBaseURL(settings.baseURL)}${path}`, {
    body: body ? JSON.stringify(body) : undefined,
    headers: {
      Authorization: `Bearer ${settings.apiKey}`,
      'Content-Type': 'application/json',
    },
    method,
  })

  if (!response.ok) {
    const detail = await parseErrorMessage(response)
    throw new Error(`Meshy API error (${response.status}): ${detail}`)
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

  return {
    apiKey: typeof meshy.apiKey === 'string' ? meshy.apiKey.trim() : DEFAULT_MESHY_SETTINGS.apiKey,
    baseURL: typeof meshy.baseURL === 'string' && meshy.baseURL.trim() ? meshy.baseURL.trim() : DEFAULT_MESHY_SETTINGS.baseURL,
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
  mediaId: number
  req: PayloadRequest
}) {
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

  return mediaURL.startsWith('http') ? mediaURL : `${getAppOrigin(args.req)}${mediaURL}`
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
}) {
  const { previewTaskId, prompt, settings } = args

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
}) {
  const { imageURL, prompt, settings } = args

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
