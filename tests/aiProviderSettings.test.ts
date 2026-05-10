import assert from 'node:assert/strict'
import test from 'node:test'

import { AIProviderSettings } from '../src/globals/AIProviderSettings.ts'
import { generateProviderImage } from '../src/lib/geminiImageGateway.ts'

type TestField = {
  fields?: TestField[]
  name?: string
  options?: Array<{ value?: string }>
}

const findField = (fields: TestField[], name: string) => {
  const field = fields.find((item) => item.name === name)
  assert.ok(field, `${name} field should exist`)
  return field
}

const restoreEnv = (key: string, value: string | undefined) => {
  if (value === undefined) {
    delete process.env[key]
    return
  }

  process.env[key] = value
}

const makeOpenAICompatibleReq = () =>
  ({
    payload: {
      findGlobal: async () => ({
        imageGeneration: {
          defaultProvider: 'openai-compatible',
          openAICompatible: {
            apiKey: 'admin-key',
            baseURL: 'https://admin.example/v1',
            model: 'admin-image-model',
            size: '512x512',
          },
          timeoutSeconds: 30,
        },
      }),
    },
  }) as never

test('AI Provider Settings exposes provider, polling, credit, and image generation settings', () => {
  const fields = AIProviderSettings.fields as TestField[]
  const fieldNames = fields.map((field) => field.name).filter(Boolean)

  assert.ok(fieldNames.includes('defaultProvider'))
  assert.ok(fieldNames.includes('mockMode'))
  assert.ok(fieldNames.includes('polling'))
  assert.ok(fieldNames.includes('creditRules'))
  assert.ok(fieldNames.includes('meshy'))
  assert.ok(fieldNames.includes('providers'))
  assert.ok(fieldNames.includes('imageGeneration'))
})

test('AI Provider Settings keeps dedicated Meshy and image-generation groups', () => {
  const fields = AIProviderSettings.fields as TestField[]
  const meshyField = findField(fields, 'meshy')
  const imageGenerationField = findField(fields, 'imageGeneration')
  const meshyFields = meshyField.fields || []
  const imageGenerationFields = imageGenerationField.fields || []
  const meshyNames = meshyFields.map((field) => field.name).filter(Boolean)
  const imageGenerationNames = imageGenerationFields.map((field) => field.name).filter(Boolean)
  const defaultProviderField = findField(imageGenerationFields, 'defaultProvider')
  const defaultProviderOptions = (defaultProviderField.options || []).map((option) => option.value)

  assert.ok(meshyNames.includes('textTo3DAiModel'))
  assert.ok(meshyNames.includes('imageTo3DAiModel'))
  assert.ok(meshyNames.includes('apiKeyMode'))
  assert.ok(meshyNames.includes('apiKey'))
  assert.ok(meshyNames.includes('multiImageEnabled'))
  assert.ok(meshyNames.includes('maxConcurrentTasks'))
  assert.ok(meshyNames.includes('pricing'))
  assert.ok(meshyNames.includes('targetFormats'))
  assert.ok(imageGenerationNames.includes('maxConcurrentTasks'))
  assert.ok(imageGenerationNames.includes('official'))
  assert.ok(imageGenerationNames.includes('thirdParty'))
  assert.ok(imageGenerationNames.includes('openAICompatible'))
  assert.ok(imageGenerationNames.includes('defaultPrompt'))
  assert.ok(defaultProviderOptions.includes('openai-compatible'))
})

test('OpenAI-compatible image generation uses saved admin override values when provided', async () => {
  const originalFetch = globalThis.fetch
  const originalEnv = {
    baseURL: process.env.OPENAI_IMAGE_COMPATIBLE_BASE_URL,
    compatibleKey: process.env.OPENAI_IMAGE_COMPATIBLE_API_KEY,
    compatibleModel: process.env.OPENAI_IMAGE_COMPATIBLE_MODEL,
    compatibleSize: process.env.OPENAI_IMAGE_COMPATIBLE_SIZE,
    genericKey: process.env.OPENAI_API_KEY,
  }
  let capturedInput = ''
  let capturedInit: RequestInit | undefined

  process.env.OPENAI_API_KEY = 'env-generic-key'
  process.env.OPENAI_IMAGE_COMPATIBLE_API_KEY = 'env-compatible-key'
  process.env.OPENAI_IMAGE_COMPATIBLE_BASE_URL = 'https://env.example/v1'
  process.env.OPENAI_IMAGE_COMPATIBLE_MODEL = 'env-image-model'
  process.env.OPENAI_IMAGE_COMPATIBLE_SIZE = '2048x2048'

  globalThis.fetch = (async (input, init) => {
    capturedInput = String(input)
    capturedInit = init

    return new Response(
      JSON.stringify({
        data: [
          {
            b64_json: Buffer.from('image-bytes').toString('base64'),
            mime_type: 'image/png',
          },
        ],
      }),
      {
        headers: {
          'content-type': 'application/json',
        },
        status: 200,
      },
    )
  }) as typeof fetch

  try {
    await generateProviderImage({
      inputMode: 'text',
      prompt: 'Arcane tavern symbol',
      provider: 'openai-compatible',
      req: {
        payload: {
          findGlobal: async () => ({
            imageGeneration: {
              defaultProvider: 'openai-compatible',
              openAICompatible: {
                apiKey: 'admin-key',
                baseURL: 'https://admin.example/v1',
                model: 'admin-image-model',
                size: '512x512',
              },
              timeoutSeconds: 30,
            },
          }),
        },
      } as never,
    })

    const headers = capturedInit?.headers as Record<string, string> | undefined
    const requestBody = JSON.parse(typeof capturedInit?.body === 'string' ? capturedInit.body : '{}') as Record<
      string,
      unknown
    >

    assert.equal(capturedInput, 'https://admin.example/v1/images/generations')
    assert.equal(headers?.Authorization, 'Bearer admin-key')
    assert.equal(requestBody.model, 'admin-image-model')
    assert.equal(requestBody.size, '512x512')
  } finally {
    globalThis.fetch = originalFetch
    restoreEnv('OPENAI_API_KEY', originalEnv.genericKey)
    restoreEnv('OPENAI_IMAGE_COMPATIBLE_API_KEY', originalEnv.compatibleKey)
    restoreEnv('OPENAI_IMAGE_COMPATIBLE_BASE_URL', originalEnv.baseURL)
    restoreEnv('OPENAI_IMAGE_COMPATIBLE_MODEL', originalEnv.compatibleModel)
    restoreEnv('OPENAI_IMAGE_COMPATIBLE_SIZE', originalEnv.compatibleSize)
  }
})

test('OpenAI-compatible image generation accepts Responses image_generation_call JSON payloads', async () => {
  const originalFetch = globalThis.fetch
  const imageBase64 = Buffer.alloc(96, 7).toString('base64')
  let capturedInput = ''

  globalThis.fetch = (async (input) => {
    capturedInput = String(input)

    return new Response(
      JSON.stringify({
        output: [
          {
            output_format: 'png',
            result: imageBase64,
            type: 'image_generation_call',
          },
        ],
      }),
      {
        headers: {
          'content-type': 'application/json',
        },
        status: 200,
      },
    )
  }) as typeof fetch

  try {
    const result = await generateProviderImage({
      inputMode: 'text',
      prompt: 'Arcane tavern symbol',
      provider: 'openai-compatible',
      req: makeOpenAICompatibleReq(),
    })

    assert.equal(capturedInput, 'https://admin.example/v1/images/generations')
    assert.equal(result.image.data, imageBase64)
    assert.equal(result.image.mimeType, 'image/png')
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('OpenAI-compatible image generation accepts Responses SSE image_generation_call payloads', async () => {
  const originalFetch = globalThis.fetch
  const imageBase64 = Buffer.alloc(96, 9).toString('base64')

  globalThis.fetch = (async () => {
    const event = {
      item: {
        output_format: 'webp',
        result: imageBase64,
        type: 'image_generation_call',
      },
      type: 'response.output_item.done',
    }

    return new Response(`event: response.output_item.done\ndata: ${JSON.stringify(event)}\n\n`, {
      headers: {
        'content-type': 'text/event-stream',
      },
      status: 200,
    })
  }) as typeof fetch

  try {
    const result = await generateProviderImage({
      inputMode: 'text',
      prompt: 'Arcane tavern symbol',
      provider: 'openai-compatible',
      req: makeOpenAICompatibleReq(),
    })

    assert.equal(result.image.data, imageBase64)
    assert.equal(result.image.mimeType, 'image/webp')
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('OpenAI-compatible image generation redacts base64 image payloads from provider errors', async () => {
  const originalFetch = globalThis.fetch
  const leakedBase64 = Buffer.alloc(256, 11).toString('base64')

  globalThis.fetch = (async () => {
    return new Response(
      `invalid SSE data JSON: "{\\"type\\":\\"response.output_item.done\\",\\"item\\":{\\"type\\":\\"not_image\\",\\"result\\":\\"${leakedBase64}\\"}}"`,
      {
        headers: {
          'content-type': 'text/plain',
        },
        status: 500,
      },
    )
  }) as typeof fetch

  try {
    await assert.rejects(
      () =>
        generateProviderImage({
          inputMode: 'text',
          prompt: 'Arcane tavern symbol',
          provider: 'openai-compatible',
          req: makeOpenAICompatibleReq(),
        }),
      (error) => {
        assert.ok(error instanceof Error)
        assert.match(error.message, /OpenAI-compatible image generation failed/)
        assert.match(error.message, /\[redacted-base64-image\]/)
        assert.equal(error.message.includes(leakedBase64), false)
        assert.ok(error.message.length < 1400)
        return true
      },
    )
  } finally {
    globalThis.fetch = originalFetch
  }
})
