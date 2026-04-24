import assert from 'node:assert/strict'
import test from 'node:test'

import { Models } from '../src/collections/Models.ts'
import { modelViewerEndpoint, __setModelViewerEndpointTestHooks } from '../src/endpoints/modelViewer.ts'
import { _resetKVStore } from '../src/lib/kvStore.ts'

const createLogger = () => ({
  error: () => undefined,
  info: () => undefined,
  warn: () => undefined,
})

test('public model viewer endpoint is rate limited for anonymous preview traffic', async () => {
  const previousLimit = process.env.MODEL_PREVIEW_RATE_LIMIT_MAX
  const previousWindow = process.env.MODEL_PREVIEW_RATE_LIMIT_WINDOW_MS

  process.env.MODEL_PREVIEW_RATE_LIMIT_MAX = '1'
  process.env.MODEL_PREVIEW_RATE_LIMIT_WINDOW_MS = '60000'
  _resetKVStore()

  __setModelViewerEndpointTestHooks({
    fetch: async () =>
      new Response(new Uint8Array([1, 2, 3]), {
        status: 200,
      }),
    getMediaAccessURL: async () => 'https://assets.example.com/model.glb',
    isAllowedRemoteAssetURL: async () => true,
  })

  const payload = {
    findByID: async ({ overrideAccess }: { overrideAccess?: boolean }) => {
      if (overrideAccess) {
        return {
          formats: [
            {
              file: {
                mimeType: 'model/gltf-binary',
                url: 'https://assets.example.com/model.glb',
              },
              format: 'glb',
            },
          ],
          id: 5,
          visibility: 'public',
        }
      }

      return {
        formats: [
          {
            format: 'glb',
          },
        ],
        id: 5,
        visibility: 'public',
      }
    },
    logger: createLogger(),
  }

  try {
    const first = await modelViewerEndpoint.handler({
      headers: new Headers({
        'user-agent': 'viewer-test/1.0',
      }),
      payload,
      query: {
        format: 'glb',
      },
      routeParams: {
        modelId: '5',
      },
    } as never)

    const second = await modelViewerEndpoint.handler({
      headers: new Headers({
        'user-agent': 'viewer-test/1.0',
      }),
      payload,
      query: {
        format: 'glb',
      },
      routeParams: {
        modelId: '5',
      },
    } as never)

    assert.equal(first.status, 200)
    assert.equal(second.status, 429)
  } finally {
    __setModelViewerEndpointTestHooks(null)
    _resetKVStore()

    if (previousLimit === undefined) {
      delete process.env.MODEL_PREVIEW_RATE_LIMIT_MAX
    } else {
      process.env.MODEL_PREVIEW_RATE_LIMIT_MAX = previousLimit
    }

    if (previousWindow === undefined) {
      delete process.env.MODEL_PREVIEW_RATE_LIMIT_WINDOW_MS
    } else {
      process.env.MODEL_PREVIEW_RATE_LIMIT_WINDOW_MS = previousWindow
    }
  }
})

test('public model docs do not expose sensitive file and viewer URL fields to anonymous readers', () => {
  const formatsField = Models.fields.find((field) => 'name' in field && field.name === 'formats')
  assert.ok(formatsField && 'fields' in formatsField)

  const fileField = formatsField.fields.find((field) => 'name' in field && field.name === 'file')
  const viewerUrlField = Models.fields.find((field) => 'name' in field && field.name === 'viewerUrl')

  assert.ok(fileField && 'access' in fileField && fileField.access?.read)
  assert.ok(viewerUrlField && 'access' in viewerUrlField && viewerUrlField.access?.read)

  const anonymousArgs = {
    doc: {
      owner: 9,
    },
    req: {
      user: null,
    },
  } as never

  assert.equal(fileField.access?.read?.(anonymousArgs), false)
  assert.equal(viewerUrlField.access?.read?.(anonymousArgs), false)
})
