import type { PayloadRequest } from 'payload'

import {
  adminAdjustCredits,
  adminRepairTaskResult,
  adminUpdateOrderStatus,
} from '@/lib/adminRepairService'
import { ensurePayloadRequestUser } from '@/lib/payloadAuthFallback'
import { rejectDisallowedMutationOrigin } from '@/lib/requestSecurity'

const unauthorized = () => Response.json({ message: 'Please sign in first.' }, { status: 401 })

const getErrorMessage = (error: unknown) => {
  return error instanceof Error ? error.message : 'Admin repair request failed.'
}

export const adminUpdateOrderStatusEndpoint = {
  path: '/platform/admin/orders/:orderId/status',
  method: 'post' as const,
  handler: async (req: PayloadRequest) => {
    const blocked = await rejectDisallowedMutationOrigin(req)
    if (blocked) return blocked

    await ensurePayloadRequestUser(req)
    if (!req.user) return unauthorized()

    try {
      const orderId = Number(String(req.routeParams?.orderId || '0'))
      if (!Number.isFinite(orderId) || orderId <= 0) {
        return Response.json({ message: 'Invalid order ID.' }, { status: 400 })
      }

      const body = req.json ? await req.json() : {}
      const order = await adminUpdateOrderStatus({
        internalNotes: body.internalNotes,
        orderId,
        paymentStatus: body.paymentStatus,
        reason: body.reason,
        req,
        status: body.status,
      })

      return Response.json({
        message: 'Order status updated successfully.',
        order,
      })
    } catch (error) {
      return Response.json({ message: getErrorMessage(error) }, { status: 400 })
    }
  },
}

export const adminAdjustCreditsEndpoint = {
  path: '/platform/admin/credits/:userId/adjust',
  method: 'post' as const,
  handler: async (req: PayloadRequest) => {
    const blocked = await rejectDisallowedMutationOrigin(req)
    if (blocked) return blocked

    await ensurePayloadRequestUser(req)
    if (!req.user) return unauthorized()

    try {
      const userId = Number(String(req.routeParams?.userId || '0'))
      if (!Number.isFinite(userId) || userId <= 0) {
        return Response.json({ message: 'Invalid user ID.' }, { status: 400 })
      }

      const body = req.json ? await req.json() : {}
      const result = await adminAdjustCredits({
        amountDelta: Number(body.amountDelta || 0),
        metadata: body.metadata && typeof body.metadata === 'object' ? body.metadata : undefined,
        reason: String(body.reason || ''),
        req,
        userId,
      })

      return Response.json({
        message: 'Credits adjusted successfully.',
        result,
      })
    } catch (error) {
      return Response.json({ message: getErrorMessage(error) }, { status: 400 })
    }
  },
}

export const adminRepairTaskEndpoint = {
  path: '/platform/admin/tasks/:taskId/repair',
  method: 'post' as const,
  handler: async (req: PayloadRequest) => {
    const blocked = await rejectDisallowedMutationOrigin(req)
    if (blocked) return blocked

    await ensurePayloadRequestUser(req)
    if (!req.user) return unauthorized()

    try {
      const taskId = Number(String(req.routeParams?.taskId || '0'))
      if (!Number.isFinite(taskId) || taskId <= 0) {
        return Response.json({ message: 'Invalid task ID.' }, { status: 400 })
      }

      const body = req.json ? await req.json() : {}
      const task = await adminRepairTaskResult({
        callbackPayload: body.callbackPayload && typeof body.callbackPayload === 'object' ? body.callbackPayload : undefined,
        failureReason: body.failureReason,
        progress: body.progress !== undefined ? Number(body.progress) : undefined,
        reason: String(body.reason || ''),
        req,
        resultModel: body.resultModel !== undefined ? Number(body.resultModel) : undefined,
        status: body.status,
        taskId,
      })

      return Response.json({
        message: 'Task repaired successfully.',
        task,
      })
    } catch (error) {
      return Response.json({ message: getErrorMessage(error) }, { status: 400 })
    }
  },
}
