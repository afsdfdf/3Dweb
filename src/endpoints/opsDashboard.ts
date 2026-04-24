import type { PayloadRequest } from 'payload'

import { getOpsDashboardData } from '@/lib/adminDashboard'

const isStaffUser = (req: PayloadRequest) => ['admin', 'operator'].includes(String(req.user?.role ?? ''))

export const opsDashboardEndpoint = {
  handler: async (req: PayloadRequest) => {
    if (!req.user) {
      return Response.json({ message: 'Please sign in first.' }, { status: 401 })
    }

    if (!isStaffUser(req)) {
      return Response.json({ message: 'You are not allowed to access the operations dashboard.' }, { status: 403 })
    }

    const data = await getOpsDashboardData()
    return Response.json(data)
  },
  method: 'get' as const,
  path: '/platform/ops/dashboard',
}
