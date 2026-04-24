import type { PayloadRequest } from 'payload'

import { getCanonicalAppURL } from '@/lib/getCanonicalAppURL'
import { getMediaAccessURL } from '@/lib/s3SignedURL'

type ImageGenerationProvider = 'gemini-official' | 'gemini-third-party'

type GeminiInlineImage = {
  data: string
  mimeType: string
}

type GeminiImageSettings = {
  apiKey: string
  baseURL: string
  model: string
  provider: ImageGenerationProvider
  timeoutSeconds: number
}

type GenerateGeminiImageArgs = {
  inputMode: 'image' | 'text'
  prompt: string
  req: PayloadRequest
  sourceImage?: number
  sourceImageAsset?: Record<string, unknown>
  provider?: ImageGenerationProvider
}

const DEFAULT_OFFICIAL_BASE_URL = 'https://generativelanguage.googleapis.com'
const DEFAULT_OFFICIAL_MODEL = 'gemini-2.5-flash-image-preview'

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

const normalizeBaseURL = (value: string) => value.trim().replace(/\/+$/, '')

const readString = (value: unknown) => {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : ''
}

const readSourceImageAssetUrl = (value: unknown) => {
  if (!isRecord(value)) return ''
  return readString(value.publicUrl)
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

async function readGeminiSettings(args: {
  preferredProvider?: ImageGenerationProvider
  req: PayloadRequest
}): Promise<GeminiImageSettings> {
  const config = await args.req.payload
    .findGlobal({
      slug: 'ai-provider-settings',
      overrideAccess: true,
    })
    .catch(() => null)

  const imageGeneration = isRecord(config?.imageGeneration) ? config.imageGeneration : {}
  const defaultProvider =
    imageGeneration.defaultProvider === 'gemini-third-party' ? 'gemini-third-party' : 'gemini-official'
  const provider = args.preferredProvider || defaultProvider
  const timeoutSeconds = Math.max(5, Number(imageGeneration.timeoutSeconds || 60))
  const official = isRecord(imageGeneration.official) ? imageGeneration.official : {}
  const thirdParty = isRecord(imageGeneration.thirdParty) ? imageGeneration.thirdParty : {}

  if (provider === 'gemini-third-party') {
    return {
      apiKey: readString(process.env.GEMINI_IMAGE_THIRD_PARTY_API_KEY) || readString(thirdParty.apiKey),
      baseURL: normalizeBaseURL(readString(process.env.GEMINI_IMAGE_THIRD_PARTY_BASE_URL) || readString(thirdParty.baseURL)),
      model: readString(process.env.GEMINI_IMAGE_THIRD_PARTY_MODEL) || readString(thirdParty.model),
      provider,
      timeoutSeconds,
    }
  }

  return {
    apiKey: readString(process.env.GEMINI_IMAGE_API_KEY) || readString(official.apiKey),
    baseURL: normalizeBaseURL(readString(process.env.GEMINI_IMAGE_API_BASE_URL) || readString(official.baseURL) || DEFAULT_OFFICIAL_BASE_URL),
    model: readString(process.env.GEMINI_IMAGE_MODEL) || readString(official.model) || DEFAULT_OFFICIAL_MODEL,
    provider,
    timeoutSeconds,
  }
}

async function resolveSourceImageDownloadURL(args: {
  req: PayloadRequest
  sourceImage?: number
  sourceImageAsset?: Record<string, unknown>
}) {
  const sourceImageAssetUrl = readSourceImageAssetUrl(args.sourceImageAsset)

  if (sourceImageAssetUrl) {
    return sourceImageAssetUrl
  }

  if (!args.sourceImage) {
    throw new Error('Image-to-image generation requires a source image.')
  }

  const media = await args.req.payload.findByID({
    collection: 'media',
    depth: 0,
    id: args.sourceImage,
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
}) {
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
    data: buffer.toString('base64'),
    mimeType,
  } satisfies GeminiInlineImage
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

export async function generateGeminiImage(args: GenerateGeminiImageArgs) {
  const settings = await readGeminiSettings({
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

  const response = await fetch(
    `${settings.baseURL}/v1beta/models/${encodeURIComponent(settings.model)}:generateContent`,
    {
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
  )

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
