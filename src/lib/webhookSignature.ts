import crypto from 'crypto'

const replayCache = new Map<string, number>()
const DEFAULT_TOLERANCE_SECONDS = 300

export type WebhookVerificationResult =
  | { ok: true }
  | { code: 'EXPIRED' | 'MALFORMED_TIMESTAMP' | 'MISSING_SECRET' | 'MISSING_SIGNATURE' | 'REPLAY' | 'SIGNATURE_MISMATCH'; ok: false }

const getToleranceSeconds = () => {
  const configured = Number(process.env.AI_WEBHOOK_TOLERANCE_SECONDS || DEFAULT_TOLERANCE_SECONDS)
  return Number.isFinite(configured) && configured > 0 ? configured : DEFAULT_TOLERANCE_SECONDS
}

const cleanupReplayCache = (now: number) => {
  const maxAge = getToleranceSeconds()

  for (const [key, timestamp] of replayCache.entries()) {
    if (now - timestamp > maxAge) {
      replayCache.delete(key)
    }
  }
}

export function signWebhookPayload(args: { payload: string; secret: string; timestamp: string }) {
  const signer = crypto.createHmac('sha256', args.secret)
  signer.update(`${args.timestamp}.${args.payload}`)
  return signer.digest('hex')
}

export function verifyWebhookSignature(args: {
  payload: string
  secret: string
  signature?: string | null
  timestamp?: string | null
}): WebhookVerificationResult {
  const { payload, secret, signature, timestamp } = args

  if (!secret.trim()) {
    return { code: 'MISSING_SECRET', ok: false }
  }

  if (!signature || !timestamp) {
    return { code: 'MISSING_SIGNATURE', ok: false }
  }

  const numericTimestamp = Number(timestamp)
  if (!Number.isFinite(numericTimestamp)) {
    return { code: 'MALFORMED_TIMESTAMP', ok: false }
  }

  const now = Math.floor(Date.now() / 1000)
  const tolerance = getToleranceSeconds()
  if (Math.abs(now - numericTimestamp) > tolerance) {
    return { code: 'EXPIRED', ok: false }
  }

  cleanupReplayCache(now)

  const replayKey = `${timestamp}:${signature}`
  if (replayCache.has(replayKey)) {
    return { code: 'REPLAY', ok: false }
  }

  const expected = signWebhookPayload({
    payload,
    secret,
    timestamp,
  })

  const expectedBuffer = Buffer.from(expected, 'hex')
  const providedBuffer = Buffer.from(signature, 'hex')

  if (expectedBuffer.length === 0 || expectedBuffer.length !== providedBuffer.length) {
    return { code: 'SIGNATURE_MISMATCH', ok: false }
  }

  if (!crypto.timingSafeEqual(expectedBuffer, providedBuffer)) {
    return { code: 'SIGNATURE_MISMATCH', ok: false }
  }

  replayCache.set(replayKey, now)
  return { ok: true }
}

