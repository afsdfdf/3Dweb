import type { PayloadRequest } from 'payload'

import { getCanonicalAppURL } from '@/lib/getCanonicalAppURL'
import { getMediaAccessURL } from '@/lib/mediaAccessURL'
import { createSupabaseStorageSignedUrl } from '@/lib/supabase/storage'

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

export type MeshyMultiImageTask = MeshyImageTask

export type MeshySettings = {
  apiKey: string
  apiKeyMode: 'environment' | 'payload'
  baseURL: string
  enablePBR: boolean
  hdTexture: boolean
  imageEnhancement: boolean
  imageTo3DAiModel: string
  maxConcurrentTasks: number
  modelType: 'lowpoly' | 'standard'
  moderation: boolean
  multiImageEnabled: boolean
  removeLighting: boolean
  shouldTexture: boolean
  targetFormats: string[]
  targetPolycount: number
  textTo3DAiModel: string
  topology: 'quad' | 'triangle'
}

const DEFAULT_MESHY_SETTINGS: MeshySettings = {
  apiKey: '',
  apiKeyMode: 'environment',
  baseURL: 'https://api.meshy.ai',
  enablePBR: false,
  hdTexture: false,
  imageEnhancement: true,
  imageTo3DAiModel: 'latest',
  maxConcurrentTasks: 20,
  modelType: 'standard',
  moderation: false,
  multiImageEnabled: true,
  removeLighting: true,
  shouldTexture: true,
  targetFormats: ['glb'],
  targetPolycount: 30000,
  textTo3DAiModel: 'latest',
  topology: 'triangle',
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

const readString = (value: unknown) => {
  return typeof value === 'string' && value.trim() ? value.trim() : ''
}

const readBoolean = (value: unknown, fallback: boolean) => {
  return typeof value === 'boolean' ? value : fallback
}

const readPositiveInteger = (value: unknown, fallback: number) => {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) && numberValue > 0 ? Math.max(1, Math.floor(numberValue)) : fallback
}

const readEnvPositiveInteger = (value: unknown, fallback: number) => {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) && numberValue > 0 ? Math.max(1, Math.floor(numberValue)) : fallback
}

const readMeshyModelType = (value: unknown): MeshySettings['modelType'] => {
  return value === 'lowpoly' ? 'lowpoly' : 'standard'
}

const readMeshyTopology = (value: unknown): MeshySettings['topology'] => {
  return value === 'quad' ? 'quad' : 'triangle'
}

const readTargetFormats = (value: unknown) => {
  const supported = new Set(['3mf', 'fbx', 'glb', 'obj', 'stl', 'usdz'])
  const candidates = Array.isArray(value) ? value : []
  const formats = candidates
    .map((item) => (typeof item === 'string' ? item.toLowerCase().trim() : ''))
    .filter((item) => supported.has(item))

  return formats.length > 0 ? Array.from(new Set(formats)) : DEFAULT_MESHY_SETTINGS.targetFormats
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
      overrideAccess: true,
      slug: 'ai-provider-settings',
    })
    .catch(() => null)

  const meshy = toRecord(config?.meshy)
  const apiKey = (process.env.MESHY_API_KEY || '').trim()
  const storedApiKey = readString(meshy.apiKey)
  const apiKeyMode = meshy.apiKeyMode === 'payload' ? 'payload' : 'environment'
  const envBaseURL = (process.env.MESHY_API_BASE_URL || '').trim()
  const globalBaseURL = typeof meshy.baseURL === 'string' && meshy.baseURL.trim() ? meshy.baseURL.trim() : ''

  return {
    apiKey: apiKeyMode === 'payload' ? storedApiKey || apiKey : apiKey || storedApiKey,
    apiKeyMode,
    baseURL: normalizeConfiguredBaseURL(envBaseURL || globalBaseURL || DEFAULT_MESHY_SETTINGS.baseURL),
    enablePBR: readBoolean(meshy.enablePBR, DEFAULT_MESHY_SETTINGS.enablePBR),
    hdTexture: readBoolean(meshy.hdTexture, DEFAULT_MESHY_SETTINGS.hdTexture),
    imageEnhancement:
      readBoolean(meshy.imageEnhancement, DEFAULT_MESHY_SETTINGS.imageEnhancement),
    imageTo3DAiModel:
      typeof meshy.imageTo3DAiModel === 'string' && meshy.imageTo3DAiModel.trim()
        ? meshy.imageTo3DAiModel
        : DEFAULT_MESHY_SETTINGS.imageTo3DAiModel,
    maxConcurrentTasks: readPositiveInteger(
      meshy.maxConcurrentTasks,
      readEnvPositiveInteger(process.env.MESHY_MAX_CONCURRENT_TASKS, DEFAULT_MESHY_SETTINGS.maxConcurrentTasks),
    ),
    modelType: readMeshyModelType(meshy.modelType),
    moderation: readBoolean(meshy.moderation, DEFAULT_MESHY_SETTINGS.moderation),
    multiImageEnabled: readBoolean(meshy.multiImageEnabled, DEFAULT_MESHY_SETTINGS.multiImageEnabled),
    removeLighting: readBoolean(meshy.removeLighting, DEFAULT_MESHY_SETTINGS.removeLighting),
    shouldTexture: readBoolean(meshy.shouldTexture, DEFAULT_MESHY_SETTINGS.shouldTexture),
    targetFormats: readTargetFormats(meshy.targetFormats),
    targetPolycount: Math.max(0, Number(meshy.targetPolycount || DEFAULT_MESHY_SETTINGS.targetPolycount)),
    textTo3DAiModel:
      typeof meshy.textTo3DAiModel === 'string' && meshy.textTo3DAiModel.trim()
        ? meshy.textTo3DAiModel
        : DEFAULT_MESHY_SETTINGS.textTo3DAiModel,
    topology: readMeshyTopology(meshy.topology),
  }
}

export function isMeshyConfigured(settings: MeshySettings) {
  return Boolean(settings.apiKey)
}

export async function resolveMeshyImageURL(args: {
  sourceImageAsset?: { bucket?: string | null; path?: string | null; publicUrl?: string | null } | null
  mediaId?: number
  req: PayloadRequest
}) {
  if (args.sourceImageAsset?.bucket && args.sourceImageAsset.path) {
    try {
      return await createSupabaseStorageSignedUrl({
        bucket: args.sourceImageAsset.bucket,
        expiresIn: 3600,
        path: args.sourceImageAsset.path,
      })
    } catch (error) {
      args.req.payload.logger.warn({
        error: error instanceof Error ? error.message : String(error),
        msg: 'Meshy source image signed URL creation failed; falling back to public URL.',
      })
    }
  }

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
  targetFormats?: string[]
}) {
  const { prompt, settings, style, targetFormats } = args

  const body: Record<string, unknown> = {
    ai_model: settings.textTo3DAiModel,
    mode: 'preview',
    model_type: settings.modelType,
    moderation: settings.moderation,
    prompt,
    target_polycount: settings.targetPolycount,
    topology: settings.topology,
  }

  if (style === 'realistic') {
    body.art_style = 'realistic'
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

  if (settings.hdTexture) {
    body.hd_texture = true
  }

  body.remove_lighting = settings.removeLighting

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
    model_type: settings.modelType,
    moderation: settings.moderation,
    remove_background: true,
    should_texture: settings.shouldTexture,
    target_polycount: settings.targetPolycount,
    topology: settings.topology,
  }

  body.remove_lighting = settings.removeLighting

  if (settings.hdTexture) {
    body.hd_texture = true
  }

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

export async function createMeshyMultiImageTask(args: {
  imageURLs: string[]
  prompt?: string
  settings: MeshySettings
  targetFormats?: string[]
}) {
  const { imageURLs, prompt, settings, targetFormats } = args
  const body: Record<string, unknown> = {
    ai_model: settings.imageTo3DAiModel,
    enable_pbr: settings.enablePBR,
    image_urls: imageURLs,
    model_type: settings.modelType,
    moderation: settings.moderation,
    should_texture: settings.shouldTexture,
    target_polycount: settings.targetPolycount,
    topology: settings.topology,
  }

  if (prompt && prompt.trim()) {
    body.texture_prompt = prompt.trim()
  }

  if (settings.hdTexture) {
    body.hd_texture = true
  }

  if (targetFormats?.length) {
    body.target_formats = targetFormats
  }

  const created = await requestMeshy<MeshyMultiImageTask & { result?: string }>({
    body,
    method: 'POST',
    path: '/openapi/v1/multi-image-to-3d',
    settings,
  })

  return normalizeCreatedTask(created) as MeshyMultiImageTask
}

export async function retrieveMeshyMultiImageTask(args: {
  settings: MeshySettings
  taskId: string
}) {
  return requestMeshy<MeshyMultiImageTask>({
    path: `/openapi/v1/multi-image-to-3d/${args.taskId}`,
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
