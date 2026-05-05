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
  assert.ok(meshyNames.includes('pricing'))
  assert.ok(meshyNames.includes('targetFormats'))
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
