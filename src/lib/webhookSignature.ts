/**
 * Webhook signature verification built on the shared KVStore abstraction for replay protection.
 *
 * Production deployments can switch to Redis through REDIS_URL so replay tracking
 * survives restarts and can be shared across multiple instances.
 */

import crypto from 'crypto'

import { getKVStore } from '@/lib/kvStore'

const REPLAY_PREFIX = 'webhook-replay:'
const DEFAULT_TOLERANCE_SECONDS = 300

export type WebhookVerificationResult =
  | { ok: true }
  | { code: 'EXPIRED' | 'MALFORMED_TIMESTAMP' | 'MISSING_SECRET' | 'MISSING_SIGNATURE' | 'REPLAY' | 'SIGNATURE_MISMATCH'; ok: false }

const getToleranceSeconds = () => {
  const configured = Number(process.env.AI_WEBHOOK_TOLERANCE_SECONDS || DEFAULT_TOLERANCE_SECONDS)
  return Number.isFinite(configured) && configured > 0 ? configured : DEFAULT_TOLERANCE_SECONDS
}

export function signWebhookPayload(args: { payload: string; secret: string; timestamp: string }) {
  const signer = crypto.createHmac('sha256', args.secret)
  signer.update(`${args.timestamp}.${args.payload}`)
  return signer.digest('hex')
}

export async function verifyWebhookSignature(args: {
  payload: string
  secret: string
  signature?: string | null
  timestamp?: string | null
}): Promise<WebhookVerificationResult> {
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

  // Replay protection uses the shared KV store backend.
  const store = getKVStore()
  const replayKey = `${REPLAY_PREFIX}${timestamp}:${signature}`

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

  // Atomically claim the signature for the tolerance window. Only the first caller
  // for a given (timestamp, signature) wins; concurrent replays of the same valid
  // payload lose the race and are rejected. This closes the check-then-set gap that
  // a plain has()+set() left open under concurrency / multiple instances.
  const claimed = await store.setIfAbsent(replayKey, String(now), tolerance * 1000)
  if (!claimed) {
    return { code: 'REPLAY', ok: false }
  }

  return { ok: true }
}
