import { getPayload } from 'payload'

const DEFAULT_FAILURE_BACKOFF_MS = 5000

type GetPayloadArgs = Parameters<typeof getPayload>[0]
type GetPayloadResult = ReturnType<typeof getPayload>
type GetPayloadFn = () => GetPayloadResult

type GetCachedPayloadTestHooks = {
  failureBackoffMs?: number
  getPayload?: GetPayloadFn
  now?: () => number
}

let payloadPromise: GetPayloadResult | null = null
let cachedFailure: { error: unknown; retryAt: number } | null = null
let getCachedPayloadTestHooks: GetCachedPayloadTestHooks | null = null

const getNow = () => {
  return getCachedPayloadTestHooks?.now?.() ?? Date.now()
}

const getFailureBackoffMs = () => {
  const configured = getCachedPayloadTestHooks?.failureBackoffMs
  if (typeof configured === 'number' && Number.isFinite(configured)) {
    return Math.max(0, configured)
  }

  return DEFAULT_FAILURE_BACKOFF_MS
}

const resolvePayload = async () => {
  const payloadConfig = await import('@payload-config')
  return getPayload({ config: payloadConfig.default } satisfies GetPayloadArgs)
}

export function __setGetCachedPayloadTestHooks(hooks: GetCachedPayloadTestHooks | null) {
  getCachedPayloadTestHooks = hooks
  payloadPromise = null
  cachedFailure = null
}

export function getCachedPayload(): GetPayloadResult {
  if (cachedFailure) {
    if (getNow() < cachedFailure.retryAt) {
      return Promise.reject(cachedFailure.error) as GetPayloadResult
    }

    cachedFailure = null
  }

  if (!payloadPromise) {
    const getPayloadForRequest = getCachedPayloadTestHooks?.getPayload || resolvePayload

    payloadPromise = getPayloadForRequest().catch((error) => {
      payloadPromise = null
      cachedFailure = {
        error,
        retryAt: getNow() + getFailureBackoffMs(),
      }
      throw error
    })
  }

  return payloadPromise
}
