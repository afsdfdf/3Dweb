import test from 'node:test'
import assert from 'node:assert/strict'

import { createMeshyMultiImageTask, getMeshySettings } from '../src/lib/meshyGateway.ts'

test('getMeshySettings keeps Meshy API key in env while reading non-sensitive admin settings', async () => {
  const previousKey = process.env.MESHY_API_KEY
  process.env.MESHY_API_KEY = 'env-key'
  const calls: Array<Record<string, unknown>> = []

  try {
    const settings = await getMeshySettings({
      payload: {
        findGlobal: async (args: Record<string, unknown>) => {
          calls.push(args)
          return {
          meshy: {
            apiKey: 'stored-key',
            baseURL: 'https://api.meshy.ai',
            imageTo3DAiModel: 'meshy-6',
            shouldTexture: false,
          },
          }
        },
      },
    } as never)

    assert.equal(settings.apiKey, 'env-key')
    assert.equal(settings.imageTo3DAiModel, 'meshy-6')
    assert.equal(settings.shouldTexture, false)
    assert.equal(calls[0]?.overrideAccess, true)
  } finally {
    process.env.MESHY_API_KEY = previousKey
  }
})

test('getMeshySettings falls back to env Meshy key when no stored key exists', async () => {
  const previousKey = process.env.MESHY_API_KEY
  process.env.MESHY_API_KEY = 'env-key'

  try {
    const settings = await getMeshySettings({
      payload: {
        findGlobal: async () => ({
          meshy: {
            baseURL: 'https://api.meshy.ai',
          },
        }),
      },
    } as never)

    assert.equal(settings.apiKey, 'env-key')
  } finally {
    process.env.MESHY_API_KEY = previousKey
  }
})

test('getMeshySettings can use Payload admin Meshy key override', async () => {
  const previousKey = process.env.MESHY_API_KEY
  process.env.MESHY_API_KEY = 'env-key'

  try {
    const settings = await getMeshySettings({
      payload: {
        findGlobal: async () => ({
          meshy: {
            apiKey: 'payload-key',
            apiKeyMode: 'payload',
            baseURL: 'https://api.meshy.ai',
          },
        }),
      },
    } as never)

    assert.equal(settings.apiKey, 'payload-key')
    assert.equal(settings.apiKeyMode, 'payload')
  } finally {
    process.env.MESHY_API_KEY = previousKey
  }
})

test('createMeshyMultiImageTask sends official multi-image request body', async () => {
  const previousFetch = globalThis.fetch
  const requests: Array<{ body: any; url: string }> = []

  globalThis.fetch = (async (url: string, init?: RequestInit) => {
    requests.push({
      body: init?.body ? JSON.parse(String(init.body)) : null,
      url,
    })

    return new Response(JSON.stringify({ result: 'multi-task-1' }), {
      headers: { 'content-type': 'application/json' },
      status: 200,
    })
  }) as typeof fetch

  try {
    const task = await createMeshyMultiImageTask({
      imageURLs: ['https://assets.example/a.png', 'https://assets.example/b.png'],
      prompt: 'carved stone texture',
      settings: {
        apiKey: 'key',
        apiKeyMode: 'payload',
        baseURL: 'https://api.meshy.ai',
        enablePBR: true,
        hdTexture: false,
        imageEnhancement: true,
        imageTo3DAiModel: 'latest',
        modelType: 'standard',
        moderation: false,
        multiImageEnabled: true,
        removeLighting: true,
        shouldTexture: true,
        targetFormats: ['glb'],
        targetPolycount: 30000,
        textTo3DAiModel: 'latest',
        topology: 'triangle',
      },
      targetFormats: ['glb', 'obj'],
    })

    assert.equal(task.id, 'multi-task-1')
    assert.equal(requests[0].url, 'https://api.meshy.ai/openapi/v1/multi-image-to-3d')
    assert.deepEqual(requests[0].body.image_urls, ['https://assets.example/a.png', 'https://assets.example/b.png'])
    assert.equal(requests[0].body.ai_model, 'latest')
    assert.equal(requests[0].body.should_texture, true)
    assert.equal(requests[0].body.texture_prompt, 'carved stone texture')
    assert.deepEqual(requests[0].body.target_formats, ['glb', 'obj'])
  } finally {
    globalThis.fetch = previousFetch
  }
})
