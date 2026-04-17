import type { PayloadRequest } from 'payload'

type AuditStatus = 'accepted' | 'completed' | 'failed' | 'idempotent' | 'ignored' | 'rejected'
type AuditLevel = 'error' | 'info' | 'warn'

export type AuditEventInput = {
  details?: Record<string, unknown>
  eventType: string
  level?: AuditLevel
  orderId?: number | string | null
  provider?: string | null
  req: PayloadRequest
  sessionId?: string | null
  status: AuditStatus
  subscriptionId?: string | null
  taskId?: number | string | null
  userId?: number | string | null
}

const normalizeOptional = (value: number | string | null | undefined) => {
  if (value === undefined || value === null || String(value).trim() === '') {
    return undefined
  }

  return value
}

export function writeAuditLog(input: AuditEventInput) {
  const logger = input.req.payload.logger as unknown as Record<string, ((entry: Record<string, unknown>) => void) | undefined> | undefined
  const level = input.level || (input.status === 'failed' || input.status === 'rejected' ? 'error' : 'info')

  if (!logger?.[level]) {
    return
  }

  logger[level]({
    audit: true,
    details: input.details,
    eventType: input.eventType,
    orderId: normalizeOptional(input.orderId),
    provider: normalizeOptional(input.provider),
    sessionId: normalizeOptional(input.sessionId),
    status: input.status,
    subscriptionId: normalizeOptional(input.subscriptionId),
    taskId: normalizeOptional(input.taskId),
    timestamp: new Date().toISOString(),
    userId: normalizeOptional(input.userId),
  })
}
