import type { PayloadRequest } from 'payload'

import { getCanonicalAppURL } from '@/lib/getCanonicalAppURL'
import { getMediaAccessURL } from '@/lib/mediaAccessURL'
import { createSupabaseStorageSignedUrl } from '@/lib/supabase/storage'

export type ImageGenerationProvider = 'gemini-official' | 'gemini-third-party' | 'openai-compatible'

type GeminiInlineImage = {
  data: string
  mimeType: string
}

type SourceImageData = GeminiInlineImage & {
  buffer: Buffer
}

type GeminiImageSettings = {
  apiKey: string
  baseURL: string
  model: string
  provider: Exclude<ImageGenerationProvider, 'openai-compatible'>
  timeoutSeconds: number
}

type OpenAICompatibleImageSettings = {
  apiKey: string
  baseURL: string
  model: string
  provider: 'openai-compatible'
  size: string
  timeoutSeconds: number
}

type GenerateProviderImageArgs = {
  inputMode: 'image' | 'text'
  prompt: string
  req: PayloadRequest
  sourceImage?: number
  sourceImageAsset?: Record<string, unknown>
  provider?: ImageGenerationProvider
}

type ImageProviderSettings = GeminiImageSettings | OpenAICompatibleImageSettings

const DEFAULT_OFFICIAL_BASE_URL = 'https://generativelanguage.googleapis.com'
const DEFAULT_OFFICIAL_MODEL = 'gemini-2.5-flash-image-preview'
const DEFAULT_OPENAI_COMPATIBLE_BASE_URL = 'https://api.openai.com/v1'
const DEFAULT_OPENAI_COMPATIBLE_MODEL = 'gpt-image-1'
const DEFAULT_OPENAI_COMPATIBLE_SIZE = '1024x1024'

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

const normalizeBaseURL = (value: string) => value.trim().replace(/\/+$/, '')

const readString = (value: unknown) => {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : ''
}

const readFirstString = (values: unknown[]) => {
  for (const value of values) {
    const text = readString(value)
    if (text) return text
  }

  return ''
}

const readConfiguredString = (args: {
  defaultValue?: string
  envValues?: unknown[]
  storedValue: unknown
}) => {
  const defaultValue = args.defaultValue || ''
  const storedValue = readString(args.storedValue)
  const envValue = readFirstString(args.envValues || [])

  if (storedValue && storedValue !== defaultValue) return storedValue
  return envValue || storedValue || defaultValue
}

const readSourceImageAssetUrl = (value: unknown) => {
  if (!isRecord(value)) return ''
  return readString(value.publicUrl)
}

const readSourceImageAssetStorage = (value: unknown) => {
  if (!isRecord(value)) return null

  const bucket = readString(value.bucket)
  const path = readString(value.path)
  if (!bucket || !path) return null

  return { bucket, path }
}

const readSourceImageAssetMediaId = (value: unknown) => {
  if (!isRecord(value)) return 0
  const id = typeof value.mediaId === 'number' ? value.mediaId : Number(value.mediaId)
  return Number.isFinite(id) && id > 0 ? id : 0
}

async function parseGeminiError(response: Response) {
  try {
    const payload = (await response.json()) as Record<string, unknown>
    const error = isRecord(payload.error) ? payload.error : null
    const message = readString(error?.message) || readString(payload.message)
    return message || JSON.stringify(payload)
  } catch {
    return await response.text()
  }
}

async function parseOpenAICompatibleError(response: Response) {
  try {
    const payload = (await response.json()) as Record<string, unknown>
    const error = isRecord(payload.error) ? payload.error : null
    const message = readString(error?.message) || readString(payload.message)
    return message || JSON.stringify(payload)
  } catch {
    return await response.text()
  }
}

function isTimeoutError(error: unknown) {
  if (!(error instanceof Error)) return false

  return (
    error.name === 'TimeoutError' ||
    error.name === 'AbortError' ||
    /aborted due to timeout|operation was aborted|timeout/i.test(error.message)
  )
}

async function fetchWithProviderTimeout(args: {
  input: string
  init: RequestInit
  provider: ImageGenerationProvider
  timeoutSeconds: number
}) {
  try {
    return await fetch(args.input, args.init)
  } catch (error) {
    if (isTimeoutError(error)) {
      throw new Error(
        `The ${args.provider} image provider timed out after ${args.timeoutSeconds} seconds. Increase Image generation > Provider timeout seconds or use a faster provider/model.`,
      )
    }

    throw error
  }
}

const readImageGenerationDefaultProvider = (value: unknown): ImageGenerationProvider => {
  if (value === 'gemini-third-party' || value === 'openai-compatible') {
    return value
  }

  return 'gemini-official'
}

const readPreferredProvider = (value: unknown): ImageGenerationProvider | undefined => {
  if (value === 'gemini-official' || value === 'gemini-third-party' || value === 'openai-compatible') {
    return value
  }

  return undefined
}

export async function resolveImageGenerationProvider(args: {
  preferredProvider?: ImageGenerationProvider
  req: PayloadRequest
}): Promise<ImageGenerationProvider> {
  if (args.preferredProvider) {
    return args.preferredProvider
  }

  const config = await args.req.payload
    .findGlobal({
      slug: 'ai-provider-settings',
      overrideAccess: true,
    })
    .catch(() => null)

  const imageGeneration = isRecord(config?.imageGeneration) ? config.imageGeneration : {}
  return readImageGenerationDefaultProvider(imageGeneration.defaultProvider)
}

async function readImageSettings(args: {
  preferredProvider?: ImageGenerationProvider
  req: PayloadRequest
}): Promise<ImageProviderSettings> {
  const config = await args.req.payload
    .findGlobal({
      slug: 'ai-provider-settings',
      overrideAccess: true,
    })
    .catch(() => null)

  const imageGeneration = isRecord(config?.imageGeneration) ? config.imageGeneration : {}
  const defaultProvider = readImageGenerationDefaultProvider(imageGeneration.defaultProvider)
  const provider = readPreferredProvider(args.preferredProvider) || defaultProvider
  const timeoutSeconds = Math.max(5, Number(imageGeneration.timeoutSeconds || 60))
  const official = isRecord(imageGeneration.official) ? imageGeneration.official : {}
  const thirdParty = isRecord(imageGeneration.thirdParty) ? imageGeneration.thirdParty : {}
  const openAICompatible = isRecord(imageGeneration.openAICompatible) ? imageGeneration.openAICompatible : {}

  if (provider === 'gemini-third-party') {
    return {
      apiKey: readString(thirdParty.apiKey) || readString(process.env.GEMINI_IMAGE_THIRD_PARTY_API_KEY),
      baseURL: normalizeBaseURL(
        readConfiguredString({
          envValues: [process.env.GEMINI_IMAGE_THIRD_PARTY_BASE_URL],
          storedValue: thirdParty.baseURL,
        }),
      ),
      model: readConfiguredString({
        envValues: [process.env.GEMINI_IMAGE_THIRD_PARTY_MODEL],
        storedValue: thirdParty.model,
      }),
      provider,
      timeoutSeconds,
    }
  }

  if (provider === 'openai-compatible') {
    return {
      apiKey:
        readString(openAICompatible.apiKey) ||
        readString(process.env.OPENAI_IMAGE_COMPATIBLE_API_KEY) ||
        readString(process.env.OPENAI_API_KEY),
      baseURL: normalizeBaseURL(
        readConfiguredString({
          defaultValue: DEFAULT_OPENAI_COMPATIBLE_BASE_URL,
          envValues: [process.env.OPENAI_IMAGE_COMPATIBLE_BASE_URL, process.env.OPENAI_BASE_URL],
          storedValue: openAICompatible.baseURL,
        }),
      ),
      model: readConfiguredString({
        defaultValue: DEFAULT_OPENAI_COMPATIBLE_MODEL,
        envValues: [process.env.OPENAI_IMAGE_COMPATIBLE_MODEL, process.env.OPENAI_IMAGE_MODEL],
        storedValue: openAICompatible.model,
      }),
      provider,
      size: readConfiguredString({
        defaultValue: DEFAULT_OPENAI_COMPATIBLE_SIZE,
        envValues: [process.env.OPENAI_IMAGE_COMPATIBLE_SIZE],
        storedValue: openAICompatible.size,
      }),
      timeoutSeconds,
    }
  }

  return {
    apiKey: readString(official.apiKey) || readString(process.env.GEMINI_IMAGE_API_KEY),
    baseURL: normalizeBaseURL(
      readConfiguredString({
        defaultValue: DEFAULT_OFFICIAL_BASE_URL,
        envValues: [process.env.GEMINI_IMAGE_API_BASE_URL],
        storedValue: official.baseURL,
      }),
    ),
    model: readConfiguredString({
      defaultValue: DEFAULT_OFFICIAL_MODEL,
      envValues: [process.env.GEMINI_IMAGE_MODEL],
      storedValue: official.model,
    }),
    provider,
    timeoutSeconds,
  }
}

async function resolveSourceImageDownloadURL(args: {
  req: PayloadRequest
  sourceImage?: number
  sourceImageAsset?: Record<string, unknown>
}) {
  const storage = readSourceImageAssetStorage(args.sourceImageAsset)
  if (storage) {
    try {
      return await createSupabaseStorageSignedUrl({
        bucket: storage.bucket,
        expiresIn: 3600,
        path: storage.path,
      })
    } catch (error) {
      args.req.payload.logger.warn({
        error: error instanceof Error ? error.message : String(error),
        msg: 'Image generation source image signed URL creation failed; falling back to public URL.',
      })
    }
  }

  const sourceImageAssetUrl = readSourceImageAssetUrl(args.sourceImageAsset)

  if (sourceImageAssetUrl) {
    return sourceImageAssetUrl
  }

  const sourceImage = args.sourceImage || readSourceImageAssetMediaId(args.sourceImageAsset)

  if (!sourceImage) {
    throw new Error('Image-to-image generation requires a source image.')
  }

  const media = await args.req.payload.findByID({
    collection: 'media',
    depth: 0,
    id: sourceImage,
    overrideAccess: false,
    req: args.req,
  })

  const mediaURL = readString(media.url)
  if (!mediaURL) {
    throw new Error('The selected source image does not have an accessible URL.')
  }

  const absoluteURL = mediaURL.startsWith('http') ? mediaURL : `${getCanonicalAppURL()}${mediaURL}`
  const accessURL = await getMediaAccessURL({
    payload: args.req.payload,
    ttlSeconds: 3600,
    url: absoluteURL,
  })

  return accessURL || absoluteURL
}

async function readSourceImageInlineData(args: {
  req: PayloadRequest
  sourceImage?: number
  sourceImageAsset?: Record<string, unknown>
}): Promise<SourceImageData> {
  const downloadURL = await resolveSourceImageDownloadURL(args)
  const response = await fetch(downloadURL)

  if (!response.ok) {
    throw new Error(`Source image fetch failed with ${response.status}.`)
  }

  const mimeType = readString(response.headers.get('content-type')) || 'image/png'
  const arrayBuffer = await response.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  if (buffer.byteLength === 0) {
    throw new Error('Source image fetch returned an empty file.')
  }

  return {
    buffer,
    data: buffer.toString('base64'),
    mimeType,
  } satisfies SourceImageData
}

function extractInlineImage(payload: Record<string, unknown>): GeminiInlineImage {
  const candidates = Array.isArray(payload.candidates) ? payload.candidates : []

  for (const candidate of candidates) {
    if (!isRecord(candidate)) continue
    const content = isRecord(candidate.content) ? candidate.content : null
    const parts = Array.isArray(content?.parts) ? content.parts : []

    for (const part of parts) {
      if (!isRecord(part)) continue
      const inlineData = isRecord(part.inlineData) ? part.inlineData : null
      const data = readString(inlineData?.data)
      const mimeType = readString(inlineData?.mimeType) || 'image/png'

      if (data) {
        return { data, mimeType }
      }
    }
  }

  throw new Error('Gemini did not return an image payload.')
}

async function extractOpenAICompatibleImage(payload: Record<string, unknown>) {
  const data = Array.isArray(payload.data) ? payload.data : []
  const image = data.find(isRecord)

  if (!image) {
    throw new Error('OpenAI-compatible provider did not return an image payload.')
  }

  const b64Json = readString(image.b64_json)
  const mimeType = readString(image.mime_type) || readString(image.mimeType) || 'image/png'

  if (b64Json) {
    return { data: b64Json, mimeType } satisfies GeminiInlineImage
  }

  const url = readString(image.url)
  if (!url) {
    throw new Error('OpenAI-compatible provider response did not include b64_json or url.')
  }

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`OpenAI-compatible image URL fetch failed with ${response.status}.`)
  }

  const responseMimeType = readString(response.headers.get('content-type')) || mimeType
  const arrayBuffer = await response.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  if (buffer.byteLength === 0) {
    throw new Error('OpenAI-compatible image URL returned an empty image.')
  }

  return {
    data: buffer.toString('base64'),
    mimeType: responseMimeType,
  } satisfies GeminiInlineImage
}

function getSourceImageFilename(mimeType: string) {
  const normalized = mimeType.toLowerCase()
  if (normalized === 'image/jpeg') return 'source.jpg'
  if (normalized === 'image/webp') return 'source.webp'
  return 'source.png'
}

async function generateOpenAICompatibleImage(args: GenerateProviderImageArgs & {
  settings: OpenAICompatibleImageSettings
}) {
  const { settings } = args
  const prompt = args.prompt.trim()
  const headers = {
    Authorization: `Bearer ${settings.apiKey}`,
  }

  const path = args.inputMode === 'image' ? '/images/edits' : '/images/generations'
  const timeoutSignal = AbortSignal.timeout(settings.timeoutSeconds * 1000)
  let response: Response

  if (args.inputMode === 'image') {
    const sourceImage = await readSourceImageInlineData({
      req: args.req,
      sourceImage: args.sourceImage,
      sourceImageAsset: args.sourceImageAsset,
    })
    const formData = new FormData()
    const sourceFile = new Blob([new Uint8Array(sourceImage.buffer)], { type: sourceImage.mimeType })

    formData.set('model', settings.model)
    formData.set('prompt', prompt)
    formData.set('image', sourceFile, getSourceImageFilename(sourceImage.mimeType))
    if (settings.size) formData.set('size', settings.size)
    formData.set('n', '1')

    response = await fetchWithProviderTimeout({
      input: `${settings.baseURL}${path}`,
      init: {
        body: formData,
        headers,
        method: 'POST',
        signal: timeoutSignal,
      },
      provider: settings.provider,
      timeoutSeconds: settings.timeoutSeconds,
    })
  } else {
    response = await fetchWithProviderTimeout({
      input: `${settings.baseURL}${path}`,
      init: {
        body: JSON.stringify({
          model: settings.model,
          n: 1,
          prompt,
          ...(settings.size ? { size: settings.size } : {}),
        }),
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        method: 'POST',
        signal: timeoutSignal,
      },
      provider: settings.provider,
      timeoutSeconds: settings.timeoutSeconds,
    })
  }

  if (!response.ok) {
    const detail = await parseOpenAICompatibleError(response)
    throw new Error(`OpenAI-compatible image generation failed: ${detail}`)
  }

  const payload = (await response.json()) as Record<string, unknown>
  const image = await extractOpenAICompatibleImage(payload)

  return {
    image,
    provider: settings.provider,
    providerModel: settings.model,
  }
}

export async function generateProviderImage(args: GenerateProviderImageArgs) {
  const settings = await readImageSettings({
    preferredProvider: args.provider,
    req: args.req,
  })

  if (!settings.apiKey) {
    throw new Error(`The ${settings.provider} API key is not configured.`)
  }

  if (!settings.baseURL) {
    throw new Error(`The ${settings.provider} base URL is not configured.`)
  }

  if (!settings.model) {
    throw new Error(`The ${settings.provider} model is not configured.`)
  }

  if (settings.provider === 'openai-compatible') {
    return generateOpenAICompatibleImage({
      ...args,
      settings,
    })
  }

  const parts: Array<Record<string, unknown>> = [{ text: args.prompt.trim() }]

  if (args.inputMode === 'image') {
    const inlineImage = await readSourceImageInlineData({
      req: args.req,
      sourceImage: args.sourceImage,
      sourceImageAsset: args.sourceImageAsset,
    })

    parts.unshift({
      inlineData: {
        data: inlineImage.data,
        mimeType: inlineImage.mimeType,
      },
    })
  }

  const response = await fetchWithProviderTimeout({
    input: `${settings.baseURL}/v1beta/models/${encodeURIComponent(settings.model)}:generateContent`,
    init: {
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: {
          responseModalities: ['IMAGE'],
        },
      }),
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': settings.apiKey,
      },
      method: 'POST',
      signal: AbortSignal.timeout(settings.timeoutSeconds * 1000),
    },
    provider: settings.provider,
    timeoutSeconds: settings.timeoutSeconds,
  })

  if (!response.ok) {
    const detail = await parseGeminiError(response)
    throw new Error(`Gemini image generation failed: ${detail}`)
  }

  const payload = (await response.json()) as Record<string, unknown>
  const image = extractInlineImage(payload)

  return {
    image,
    provider: settings.provider,
    providerModel: settings.model,
  }
}
