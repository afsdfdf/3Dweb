import assert from 'node:assert/strict'
import test from 'node:test'

import { resolveModelFormatAssets } from '../src/lib/aiTaskFlow.ts'

const createRequestMock = (options?: {
  createShouldFail?: boolean
}) => {
  const createdMedia: Array<Record<string, unknown>> = []

  return {
    createdMedia,
    req: {
      payload: {
        create: async ({ collection, data, filePath }: { collection: string; data: Record<string, unknown>; filePath?: string }) => {
          assert.equal(collection, 'media')
          assert.equal(typeof filePath, 'string')

          if (options?.createShouldFail) {
            throw new Error('media create failed')
          }

          const media = {
            id: createdMedia.length + 1,
            ...data,
            filePath,
          }
          createdMedia.push(media)
          return media
        },
        findGlobal: async ({ slug }: { slug: string }) => {
          if (slug === 'storage-settings') {
            return {
              baseURL: 'https://cdn.example-assets.com',
              bucket: 'demo-bucket',
              enabled: true,
              prefix: 'media',
              region: 'us-east-1',
              signedDownloads: true,
            }
          }

          if (slug === 'security-settings') {
            return {
              allowedRemoteAssetHosts: [{ host: 'cdn.example-assets.com' }],
            }
          }

          return null
        },
        logger: {
          warn: () => undefined,
        },
      },
    } as never,
  }
}

test('resolveModelFormatAssets ingests allowed remote assets into local media', async () => {
  const previousFetch = globalThis.fetch
  const { createdMedia, req } = createRequestMock()

  globalThis.fetch = async () =>
    new Response(new Uint8Array([1, 2, 3, 4]), {
      headers: {
        'content-type': 'model/gltf-binary',
      },
      status: 200,
    })

  try {
    const formats = await resolveModelFormatAssets({
      generationPricingDownloadCredits: 5,
      payloadData: {
        modelUrls: {
          glb: 'https://cdn.example-assets.com/models/demo.glb',
        },
      },
      req,
      taskCode: 'TASK-123',
      taskId: 10,
      userId: 7,
    })

    assert.equal(formats.length, 1)
    assert.equal(formats[0]?.format, 'glb')
    assert.equal(formats[0]?.file, 1)
    assert.equal(createdMedia.length, 1)
  } finally {
    globalThis.fetch = previousFetch
  }
})

test('resolveModelFormatAssets falls back explicitly when media ingestion fails', async () => {
  const previousFetch = globalThis.fetch
  const { createdMedia, req } = createRequestMock({ createShouldFail: true })

  globalThis.fetch = async () =>
    new Response(new Uint8Array([1, 2, 3, 4]), {
      headers: {
        'content-type': 'model/gltf-binary',
      },
      status: 200,
    })

  try {
    const formats = await resolveModelFormatAssets({
      generationPricingDownloadCredits: 5,
      payloadData: {
        modelUrls: {
          glb: 'https://cdn.example-assets.com/models/demo.glb',
        },
      },
      req,
      taskCode: 'TASK-456',
      taskId: 11,
      userId: 7,
    })

    assert.equal(formats.length, 1)
    assert.equal(formats[0]?.format, 'glb')
    assert.equal(formats[0]?.file, null)
    assert.equal(createdMedia.length, 0)
  } finally {
    globalThis.fetch = previousFetch
  }
})
