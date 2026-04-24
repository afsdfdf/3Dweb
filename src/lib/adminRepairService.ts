import type { PayloadRequest } from 'payload'

import { writeAuditLog } from '@/lib/auditLog'
import { adjustCreditsManually } from '@/lib/creditLedger'

const INTERNAL_ACCESS = true

const assertStaff = (req: PayloadRequest) => {
  const role = String(req.user?.role || 'customer')
  if (!['admin', 'operator'].includes(role)) {
    throw new Error('Only staff can use admin repair operations.')
  }
}

const requireReason = (value: unknown, label: string) => {
  const reason = String(value || '').trim()
  if (!reason) {
    throw new Error(`${label} is required.`)
  }
  return reason
}

export async function adminUpdateOrderStatus(args: {
  internalNotes?: string
  orderId: number
  paymentStatus?: 'failed' | 'paid' | 'pending' | 'refunded'
  reason: string
  req: PayloadRequest
  status: 'cancelled' | 'completed' | 'in-production' | 'paid' | 'pending-payment' | 'shipped'
}) {
  assertStaff(args.req)
  const reason = requireReason(args.reason, 'Reason')

  const order = await args.req.payload.findByID({
    collection: 'print-orders',
    depth: 0,
    id: args.orderId,
    overrideAccess: INTERNAL_ACCESS,
    req: args.req,
  })

  const updated = await args.req.payload.update({
    collection: 'print-orders',
    data: {
      ...(args.internalNotes !== undefined ? { internalNotes: String(args.internalNotes || '') } : {}),
      ...(args.paymentStatus ? { paymentStatus: args.paymentStatus } : {}),
      status: args.status,
    },
    id: args.orderId,
    overrideAccess: INTERNAL_ACCESS,
    req: args.req,
  })

  writeAuditLog({
    details: {
      fromPaymentStatus: order.paymentStatus,
      fromStatus: order.status,
      reason,
      toPaymentStatus: updated.paymentStatus,
      toStatus: updated.status,
    },
    eventType: 'admin.order_status_repair',
    orderId: args.orderId,
    req: args.req,
    status: 'completed',
    userId: args.req.user?.id,
  })

  return updated
}

export async function adminAdjustCredits(args: {
  amountDelta: number
  metadata?: Record<string, unknown>
  reason: string
  req: PayloadRequest
  userId: number
}) {
  assertStaff(args.req)
  const reason = requireReason(args.reason, 'Reason')

  const result = await adjustCreditsManually({
    amountDelta: args.amountDelta,
    idempotencyKey: `admin-credit-adjust:${args.userId}:${Date.now()}`,
    metadata: {
      ...(args.metadata || {}),
      source: 'admin-repair',
    },
    notes: reason,
    req: args.req,
    userId: args.userId,
  })

  writeAuditLog({
    details: {
      amountDelta: args.amountDelta,
      reason,
    },
    eventType: 'admin.credit_adjustment',
    req: args.req,
    status: result.applied ? 'completed' : 'ignored',
    userId: args.userId,
  })

  return result
}

export async function adminRepairTaskResult(args: {
  callbackPayload?: Record<string, unknown>
  failureReason?: string | null
  progress?: number
  reason: string
  req: PayloadRequest
  resultModel?: number | null
  status?: 'failed' | 'processing' | 'queued' | 'succeeded' | 'timeout'
  taskId: number
}) {
  assertStaff(args.req)
  const reason = requireReason(args.reason, 'Reason')

  const task = await args.req.payload.findByID({
    collection: 'generation-tasks',
    depth: 0,
    id: args.taskId,
    overrideAccess: INTERNAL_ACCESS,
    req: args.req,
  })

  const updated = await args.req.payload.update({
    collection: 'generation-tasks',
    data: {
      ...(args.callbackPayload ? { callbackPayload: args.callbackPayload } : {}),
      ...(args.failureReason !== undefined ? { failureReason: args.failureReason } : {}),
      ...(args.progress !== undefined ? { progress: args.progress } : {}),
      ...(args.resultModel !== undefined ? { resultModel: args.resultModel } : {}),
      ...(args.status ? { status: args.status } : {}),
    },
    id: args.taskId,
    overrideAccess: INTERNAL_ACCESS,
    req: args.req,
  })

  writeAuditLog({
    details: {
      fromFailureReason: task.failureReason,
      fromResultModel: task.resultModel,
      fromStatus: task.status,
      reason,
      toFailureReason: updated.failureReason,
      toResultModel: updated.resultModel,
      toStatus: updated.status,
    },
    eventType: 'admin.task_result_repair',
    req: args.req,
    status: 'completed',
    taskId: args.taskId,
    userId: args.req.user?.id,
  })

  return updated
}
