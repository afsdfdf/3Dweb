import test from 'node:test'
import assert from 'node:assert/strict'

import { getMeshySettings } from '../src/lib/meshyGateway.ts'

test('getMeshySettings keeps Meshy API key in env while reading non-sensitive admin settings', async () => {
  const previousKey = process.env.MESHY_API_KEY
  process.env.MESHY_API_KEY = 'env-key'

  try {
    const settings = await getMeshySettings({
      payload: {
        findGlobal: async () => ({
          meshy: {
            apiKey: 'stored-key',
            baseURL: 'https://api.meshy.ai',
            imageTo3DAiModel: 'meshy-6',
            shouldTexture: false,
          },
        }),
      },
    } as never)

    assert.equal(settings.apiKey, 'env-key')
    assert.equal(settings.imageTo3DAiModel, 'meshy-6')
    assert.equal(settings.shouldTexture, false)
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
