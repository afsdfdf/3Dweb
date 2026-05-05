import assert from 'node:assert/strict'
import test from 'node:test'

import { aiWebhookEndpoint, meshyWebhookEndpoint, __setAITasksEndpointTestHooks } from '../src/endpoints/aiTasks.ts'
import { submitImageGenerationEndpoint, __setImageGenerationEndpointTestHooks } from '../src/endpoints/imageGeneration.ts'
import { __setModelDownloadEndpointTestHooks, modelDownloadEndpoint } from '../src/endpoints/modelDownloads.ts'
import { __setStripeWebhookTestHooks, stripeWebhookEndpoint } from '../src/endpoints/stripeWebhook.ts'
import { __setSubscriptionFlowTestHooks, syncStripeSubscriptionState } from '../src/lib/subscriptionFlow.ts'

const createLogger = () => ({
  error: () => undefined,
  info: () => undefined,
  warn: () => undefined,
})

test('Stripe webhook completes print-order payment flow', async () => {
  let finalizedSessionId = ''

  __setStripeWebhookTestHooks({
    constructStripeWebhookEvent: () =>
      ({
        data: {
          object: {
            id: 'cs_test_123',
            mode: 'payment',
          },
        },
        type: 'checkout.session.completed',
      }) as never,
    finalizePrintOrderCheckoutSession: async ({ sessionId }) => {
      finalizedSessionId = sessionId
      return {} as never
    },
  })

  try {
    const response = await stripeWebhookEndpoint.handler({
      headers: new Headers({
        'stripe-signature': 'sig_test',
      }),
      payload: {
        logger: createLogger(),
      },
      text: async () => '{"id":"evt_test"}',
    } as never)

    const body = await response.json()

    assert.equal(response.status, 200)
    assert.equal(finalizedSessionId, 'cs_test_123')
    assert.equal(body.received, true)
    assert.equal(body.result.ok, true)
  } finally {
    __setStripeWebhookTestHooks(null)
  }
})

test('subscription credit grant stays idempotent across repeated syncs', async () => {
  let grantCalls = 0
  let billingSubscription: Record<string, unknown> | null = null

  __setSubscriptionFlowTestHooks({
    getSubscriptionPlan: async () =>
      ({
        creditsPerMonth: 240,
        key: 'starter',
        name: 'Starter',
      }) as never,
    grantCredits: async () => {
      grantCalls += 1
      return {
        account: {},
        applied: true,
      }
    },
    retrieveStripeSubscription: async () =>
      ({
        customer: 'cus_test_123',
        id: 'sub_test_123',
        items: {
          data: [
            {
              current_period_end: 2000,
              current_period_start: 1000,
              price: {
                id: 'price_test_123',
                product: {
                  metadata: {
                    planKey: 'starter',
                  },
                },
                recurring: {
                  interval: 'month',
                },
              },
            },
          ],
        },
        metadata: {
          planKey: 'starter',
        },
        status: 'active',
      }) as never,
    sendSubscriptionSuccessEmail: async () => undefined as never,
  })

  const req = {
    payload: {
      create: async ({ collection, data }: { collection: string; data: Record<string, unknown> }) => {
        assert.equal(collection, 'billing-subscriptions')
        billingSubscription = {
          id: 1,
          ...data,
        }
        return billingSubscription
      },
      find: async ({ collection, where }: { collection: string; where: Record<string, any> }) => {
        if (collection === 'billing-subscriptions') {
          if (where?.stripeSubscriptionId?.equals === 'sub_test_123' && billingSubscription) {
            return { docs: [billingSubscription] }
          }

          return { docs: [] }
        }

        if (collection === 'users') {
          return {
            docs: [
              {
                email: 'user@example.com',
                id: 1,
                stripeCustomerId: 'cus_test_123',
              },
            ],
          }
        }

        throw new Error(`Unsupported find collection: ${collection}`)
      },
      findByID: async ({ collection }: { collection: string }) => {
        assert.equal(collection, 'users')
        return {
          email: 'user@example.com',
          id: 1,
          stripeCustomerId: 'cus_test_123',
        }
      },
      logger: createLogger(),
      update: async ({ collection, data }: { collection: string; data: Record<string, unknown> }) => {
        if (collection === 'billing-subscriptions') {
          billingSubscription = {
            ...(billingSubscription || { id: 1 }),
            ...data,
          }
          return billingSubscription
        }

        if (collection === 'users') {
          return {
            email: 'user@example.com',
            id: 1,
            stripeCustomerId: 'cus_test_123',
            ...data,
          }
        }

        throw new Error(`Unsupported update collection: ${collection}`)
      },
    },
  } as never

  try {
    const first = await syncStripeSubscriptionState({
      customerId: 'cus_test_123',
      req,
      subscriptionId: 'sub_test_123',
      userIdHint: 1,
    })

    const second = await syncStripeSubscriptionState({
      customerId: 'cus_test_123',
      req,
      subscriptionId: 'sub_test_123',
      userIdHint: 1,
    })

    assert.equal(grantCalls, 1)
    assert.equal(first.billingSubscription.lastGrantedPeriodKey, 'sub_test_123:2000')
    assert.equal(second.billingSubscription.lastGrantedPeriodKey, 'sub_test_123:2000')
  } finally {
    __setSubscriptionFlowTestHooks(null)
  }
})

test('model download failure triggers automatic credit refund', async () => {
  let refundCalls = 0

  __setModelDownloadEndpointTestHooks({
    getMediaAccessURL: async () => null,
    isAllowedRemoteAssetURL: async () => true,
    refundDownloadCredits: async () => {
      refundCalls += 1
      return {
        account: {},
        applied: true,
      }
    },
    spendDownloadCredits: async () => ({
      account: {},
      applied: true,
    }),
  })

  try {
    const response = await modelDownloadEndpoint.handler({
      payload: {
        findGlobal: async () => ({
          modelAccessPolicy: {
            chargeDownloadCredits: true,
          },
        }),
        findByID: async () => ({
          formats: [
            {
              downloadCredits: 2,
              file: {
                mimeType: 'model/gltf-binary',
                url: 'https://cdn.example.com/model.glb',
              },
              format: 'glb',
            },
          ],
          id: 5,
          sourceTask: null,
          title: 'Test Model',
        }),
        logger: createLogger(),
      },
      query: {
        format: 'glb',
      },
      routeParams: {
        modelId: '5',
      },
      user: {
        id: 7,
      },
    } as never)

    const body = await response.json()

    assert.equal(response.status, 502)
    assert.equal(refundCalls, 1)
    assert.match(body.message, /refunded automatically|download failed/i)
  } finally {
    __setModelDownloadEndpointTestHooks(null)
  }
})

test('AI webhook verifies signature and updates task state', async () => {
  let verifyCalls = 0
  let handledProviderTaskId = ''

  __setAITasksEndpointTestHooks({
    handleAIWebhook: async ({ payloadData }) => {
      handledProviderTaskId = String(payloadData.providerTaskId)
      return {
        providerTaskId: handledProviderTaskId,
        status: 'succeeded',
        taskId: 99,
      }
    },
    verifyWebhookSignature: async () => {
      verifyCalls += 1
      return { ok: true }
    },
  })

  try {
    const response = await aiWebhookEndpoint.handler({
      headers: new Headers({
        'x-provider-signature': 'sig_test',
        'x-webhook-timestamp': String(Math.floor(Date.now() / 1000)),
      }),
      payload: {
        logger: createLogger(),
      },
      text: async () =>
        JSON.stringify({
          provider: 'meshy',
          providerTaskId: 'provider-task-1',
          status: 'SUCCEEDED',
        }),
    } as never)

    const body = await response.json()

    assert.equal(response.status, 200)
    assert.equal(verifyCalls, 1)
    assert.equal(handledProviderTaskId, 'provider-task-1')
    assert.equal(body.result.taskId, 99)
  } finally {
    __setAITasksEndpointTestHooks(null)
  }
})

test('Meshy webhook accepts token and schedules provider sync after response', async () => {
  const previousToken = process.env.MESHY_WEBHOOK_TOKEN
  let handledProviderTaskId = ''
  let scheduledTask: (() => Promise<void>) | null = null

  process.env.MESHY_WEBHOOK_TOKEN = 'meshy-secret'
  __setAITasksEndpointTestHooks({
    handleMeshyWebhook: async ({ payloadData }) => {
      handledProviderTaskId = String(payloadData.id)
      return {
        providerTaskId: handledProviderTaskId,
        status: 'succeeded',
        taskId: 101,
      }
    },
    scheduleAfterResponse: (task) => {
      scheduledTask = task
    },
  })

  try {
    const response = await meshyWebhookEndpoint.handler({
      headers: new Headers(),
      payload: {
        logger: createLogger(),
      },
      text: async () =>
        JSON.stringify({
          id: 'meshy-task-1',
          status: 'SUCCEEDED',
        }),
      url: 'http://localhost/api/platform/ai/webhooks/meshy?token=meshy-secret',
    } as never)
    const body = await response.json()

    assert.equal(response.status, 202)
    assert.equal(body.message, 'Meshy webhook accepted.')
    assert.equal(handledProviderTaskId, '')
    assert.ok(scheduledTask)

    await scheduledTask()

    assert.equal(handledProviderTaskId, 'meshy-task-1')
  } finally {
    if (previousToken === undefined) {
      delete process.env.MESHY_WEBHOOK_TOKEN
    } else {
      process.env.MESHY_WEBHOOK_TOKEN = previousToken
    }

    __setAITasksEndpointTestHooks(null)
  }
})

test('image generation endpoint rejects multiple source image assets', async () => {
  const response = await submitImageGenerationEndpoint.handler({
    headers: new Headers(),
    json: async () => ({
      inputMode: 'image',
      prompt: 'make a clean concept image',
      sourceImageAssets: [
        { publicUrl: 'https://storage.example.com/a.png' },
        { publicUrl: 'https://storage.example.com/b.png' },
      ],
    }),
    payload: {
      config: { cookiePrefix: 'payload' },
      logger: createLogger(),
    },
    user: {
      id: 7,
    },
  } as never)
  const body = await response.json()

  assert.equal(response.status, 400)
  assert.match(body.message, /one source image/i)
})

test('image generation endpoint forwards a single source image asset from the array payload', async () => {
  let forwardedSourceImageAsset: Record<string, unknown> | undefined

  __setImageGenerationEndpointTestHooks({
    submitImageGeneration: async ({ sourceImageAsset }) => {
      forwardedSourceImageAsset = sourceImageAsset
      return {
        media: {
          id: 3,
          mimeType: 'image/png',
          url: 'https://storage.example.com/result.png',
        },
        task: {
          id: 9,
        },
      } as never
    },
  })

  try {
    const response = await submitImageGenerationEndpoint.handler({
      headers: new Headers(),
      json: async () => ({
        inputMode: 'image',
        prompt: 'make a clean concept image',
        sourceImageAssets: [{ bucket: 'media', path: 'media/input/a.png', publicUrl: 'https://storage.example.com/a.png' }],
      }),
      payload: {
        config: { cookiePrefix: 'payload' },
        logger: createLogger(),
      },
      user: {
        id: 7,
      },
    } as never)

    assert.equal(response.status, 202)
    assert.equal(forwardedSourceImageAsset?.bucket, 'media')
    assert.equal(forwardedSourceImageAsset?.path, 'media/input/a.png')
  } finally {
    __setImageGenerationEndpointTestHooks(null)
  }
})

test('image generation endpoint forwards OpenAI-compatible provider requests', async () => {
  let forwardedProvider: string | undefined

  __setImageGenerationEndpointTestHooks({
    submitImageGeneration: async ({ provider }) => {
      forwardedProvider = provider
      return {
        media: {
          id: 3,
          mimeType: 'image/png',
          url: 'https://storage.example.com/result.png',
        },
        task: {
          id: 9,
        },
      } as never
    },
  })

  try {
    const response = await submitImageGenerationEndpoint.handler({
      headers: new Headers(),
      json: async () => ({
        inputMode: 'text',
        prompt: 'make a clean concept image',
        provider: 'openai-compatible',
      }),
      payload: {
        config: { cookiePrefix: 'payload' },
        logger: createLogger(),
      },
      user: {
        id: 7,
      },
    } as never)

    assert.equal(response.status, 202)
    assert.equal(forwardedProvider, 'openai-compatible')
  } finally {
    __setImageGenerationEndpointTestHooks(null)
  }
})

test('image generation endpoint returns a queued task and schedules provider work', async () => {
  let scheduledTask: (() => Promise<void>) | null = null
  let dispatchedTaskId = 0

  __setImageGenerationEndpointTestHooks({
    runImageGenerationTask: async ({ taskId }) => {
      dispatchedTaskId = taskId
      return {
        media: null,
        task: {
          id: taskId,
        },
      } as never
    },
    scheduleAfterResponse: (task) => {
      scheduledTask = task
    },
    submitImageGeneration: async ({ dispatchProvider }) => {
      assert.equal(dispatchProvider, false)
      return {
        media: null,
        task: {
          id: 11,
          status: 'queued',
          taskCode: 'IMG-TEST',
        },
      } as never
    },
  })

  try {
    const response = await submitImageGenerationEndpoint.handler({
      headers: new Headers(),
      json: async () => ({
        inputMode: 'text',
        prompt: 'make a clean concept image',
      }),
      payload: {
        config: { cookiePrefix: 'payload' },
        logger: createLogger(),
      },
      user: {
        id: 7,
      },
    } as never)
    const body = await response.json()

    assert.equal(response.status, 202)
    assert.equal(body.next.syncEndpoint, '/api/studio/ai/images/11/sync')
    assert.ok(scheduledTask)

    await scheduledTask()

    assert.equal(dispatchedTaskId, 11)
  } finally {
    __setImageGenerationEndpointTestHooks(null)
  }
})

test('model download returns an error instead of mock content when no real asset is available', async () => {
  let spendCalls = 0
  let refundCalls = 0

  __setModelDownloadEndpointTestHooks({
    isAllowedRemoteAssetURL: async () => true,
    refundDownloadCredits: async () => {
      refundCalls += 1
      return {
        account: {},
        applied: true,
      }
    },
    resolveModelFormatAsset: async () => ({
      filename: null,
      mimeType: null,
      url: null,
    }),
    spendDownloadCredits: async () => {
      spendCalls += 1
      return {
        account: {},
        applied: true,
      }
    },
  })

  try {
    const response = await modelDownloadEndpoint.handler({
      payload: {
        findGlobal: async () => ({
          modelAccessPolicy: {
            chargeDownloadCredits: true,
            downloadCredits: 8,
          },
        }),
        findByID: async () => ({
          formats: [
            {
              downloadCredits: 2,
              file: null,
              format: 'glb',
            },
          ],
          id: 6,
          sourceTask: null,
          title: 'Missing Asset Model',
        }),
        logger: createLogger(),
      },
      query: {
        format: 'glb',
      },
      routeParams: {
        modelId: '6',
      },
      user: {
        id: 7,
      },
    } as never)

    const body = await response.json()

    assert.equal(response.status, 404)
    assert.equal(spendCalls, 0)
    assert.equal(refundCalls, 0)
    assert.match(body.message, /asset is available/i)
  } finally {
    __setModelDownloadEndpointTestHooks(null)
  }
})

test('model download does not spend credits when download charging is disabled by policy', async () => {
  let spendCalls = 0

  __setModelDownloadEndpointTestHooks({
    getMediaAccessURL: async () => 'https://cdn.example.com/model.glb',
    isAllowedRemoteAssetURL: async () => true,
    spendDownloadCredits: async () => {
      spendCalls += 1
      return {
        account: {},
        applied: true,
      }
    },
  })

  try {
    const response = await modelDownloadEndpoint.handler({
      payload: {
        findGlobal: async () => ({
          modelAccessPolicy: {
            chargeDownloadCredits: false,
            downloadCredits: 8,
          },
        }),
        findByID: async () => ({
          formats: [
            {
              downloadCredits: 2,
              file: {
                mimeType: 'model/gltf-binary',
                url: 'https://cdn.example.com/model.glb',
              },
              format: 'glb',
            },
          ],
          id: 7,
          sourceTask: null,
          title: 'Free Download Model',
        }),
        logger: createLogger(),
      },
      query: {
        format: 'glb',
      },
      routeParams: {
        modelId: '7',
      },
      user: {
        id: 7,
      },
    } as never)

    assert.equal(response.status, 307)
    assert.equal(response.headers.get('location'), 'https://cdn.example.com/model.glb')
    assert.equal(spendCalls, 0)
  } finally {
    __setModelDownloadEndpointTestHooks(null)
  }
})
