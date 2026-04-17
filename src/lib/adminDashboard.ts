import { getCachedPayload } from './getCachedPayload'

const startOfToday = () => {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return now
}

const toISO = (date: Date) => date.toISOString()

const addDays = (date: Date, offset: number) => {
  const next = new Date(date)
  next.setDate(next.getDate() + offset)
  return next
}

const formatDayLabel = (date: Date) => {
  const month = date.getMonth() + 1
  const day = date.getDate()
  return `${month}/${day}`
}

const taskStatuses = ['queued', 'processing', 'succeeded', 'failed', 'timeout'] as const
const taskModes = ['image', 'text', 'hybrid'] as const
const orderStatuses = ['pending-payment', 'paid', 'in-production', 'shipped', 'completed', 'cancelled'] as const
const paymentStatuses = ['pending', 'paid', 'failed', 'refunded'] as const

const buildDateRanges = (days: number) => {
  const today = startOfToday()
  const ranges: Array<{ end: string; label: string; start: string }> = []

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const start = addDays(today, -offset)
    const end = addDays(start, 1)

    ranges.push({
      end: toISO(end),
      label: formatDayLabel(start),
      start: toISO(start),
    })
  }

  return ranges
}

export async function getOpsDashboardData() {
  const payload = await getCachedPayload()
  const today = toISO(startOfToday())
  const ranges = buildDateRanges(7)

  const [
    tasks,
    models,
    orders,
    payments,
    creditAccounts,
    recentTasks,
    recentOrders,
    recentPayments,
    topCreditAccounts,
    failedTaskQueue,
    pendingOrderQueue,
    paymentExceptionQueue,
    lowBalanceQueue,
    highBalanceQueue,
  ] = await Promise.all([
    payload.count({ collection: 'generation-tasks', where: {} }),
    payload.count({ collection: 'models', where: {} }),
    payload.count({ collection: 'print-orders', where: {} }),
    payload.count({ collection: 'shopify-payments', where: {} }),
    payload.count({ collection: 'credits', where: {} }),
    payload.find({ collection: 'generation-tasks', depth: 1, limit: 5, sort: '-updatedAt' }),
    payload.find({ collection: 'print-orders', depth: 2, limit: 5, sort: '-updatedAt' }),
    payload.find({ collection: 'shopify-payments', depth: 2, limit: 5, sort: '-updatedAt' }),
    payload.find({ collection: 'credits', depth: 1, limit: 5, sort: '-balance' }),
    payload.find({
      collection: 'generation-tasks',
      depth: 1,
      limit: 6,
      sort: '-updatedAt',
      where: {
        status: { in: ['failed', 'timeout'] },
      },
    }),
    payload.find({
      collection: 'print-orders',
      depth: 2,
      limit: 6,
      sort: '-updatedAt',
      where: {
        or: [{ status: { equals: 'pending-payment' } }, { paymentStatus: { in: ['failed', 'refunded'] } }, { status: { equals: 'cancelled' } }],
      },
    }),
    payload.find({
      collection: 'shopify-payments',
      depth: 2,
      limit: 6,
      sort: '-updatedAt',
      where: {
        status: { in: ['failed', 'refunded', 'pending'] },
      },
    }),
    payload.find({
      collection: 'credits',
      depth: 1,
      limit: 6,
      sort: 'balance',
      where: {
        balance: { less_than_equal: 20 },
      },
    }),
    payload.find({
      collection: 'credits',
      depth: 1,
      limit: 6,
      sort: '-balance',
      where: {
        balance: { greater_than: 50 },
      },
    }),
  ])

  const [
    newTasksToday,
    processingTasks,
    failedTasks,
    paidOrdersToday,
    pendingOrders,
    highBalanceAccounts,
    lowBalanceAccounts,
    reservedCreditAccounts,
    taskStatusCounts,
    taskModeCounts,
    orderStatusCounts,
    paymentStatusCounts,
    taskTrend,
    paidOrderTrend,
  ] = await Promise.all([
    payload.count({
      collection: 'generation-tasks',
      where: { createdAt: { greater_than_equal: today } },
    }),
    payload.count({
      collection: 'generation-tasks',
      where: { status: { in: ['queued', 'processing'] } },
    }),
    payload.count({
      collection: 'generation-tasks',
      where: { status: { equals: 'failed' } },
    }),
    payload.count({
      collection: 'print-orders',
      where: {
        and: [{ createdAt: { greater_than_equal: today } }, { status: { in: ['paid', 'in-production', 'shipped', 'completed'] } }],
      },
    }),
    payload.count({
      collection: 'print-orders',
      where: { status: { in: ['pending-payment', 'paid', 'in-production'] } },
    }),
    payload.count({
      collection: 'credits',
      where: { balance: { greater_than: 50 } },
    }),
    payload.count({
      collection: 'credits',
      where: { balance: { less_than_equal: 20 } },
    }),
    payload.count({
      collection: 'credits',
      where: { reservedBalance: { greater_than: 0 } },
    }),
    Promise.all(
      taskStatuses.map(async (status) => ({
        count: (
          await payload.count({
            collection: 'generation-tasks',
            where: { status: { equals: status } },
          })
        ).totalDocs,
        key: status,
      })),
    ),
    Promise.all(
      taskModes.map(async (mode) => ({
        count: (
          await payload.count({
            collection: 'generation-tasks',
            where: { inputMode: { equals: mode } },
          })
        ).totalDocs,
        key: mode,
      })),
    ),
    Promise.all(
      orderStatuses.map(async (status) => ({
        count: (
          await payload.count({
            collection: 'print-orders',
            where: { status: { equals: status } },
          })
        ).totalDocs,
        key: status,
      })),
    ),
    Promise.all(
      paymentStatuses.map(async (status) => ({
        count: (
          await payload.count({
            collection: 'shopify-payments',
            where: { status: { equals: status } },
          })
        ).totalDocs,
        key: status,
      })),
    ),
    Promise.all(
      ranges.map(async (range) => ({
        count: (
          await payload.count({
            collection: 'generation-tasks',
            where: {
              and: [{ createdAt: { greater_than_equal: range.start } }, { createdAt: { less_than: range.end } }],
            },
          })
        ).totalDocs,
        label: range.label,
      })),
    ),
    Promise.all(
      ranges.map(async (range) => ({
        count: (
          await payload.count({
            collection: 'print-orders',
            where: {
              and: [
                { createdAt: { greater_than_equal: range.start } },
                { createdAt: { less_than: range.end } },
                { status: { in: ['paid', 'in-production', 'shipped', 'completed'] } },
              ],
            },
          })
        ).totalDocs,
        label: range.label,
      })),
    ),
  ])

  return {
    analytics: {
      orderStatusCounts,
      paidOrderTrend,
      paymentStatusCounts,
      taskModeCounts,
      taskStatusCounts,
      taskTrend,
    },
    generatedAt: new Date().toISOString(),
    overview: {
      creditAccounts: creditAccounts.totalDocs,
      failedTasks: failedTasks.totalDocs,
      highBalanceAccounts: highBalanceAccounts.totalDocs,
      lowBalanceAccounts: lowBalanceAccounts.totalDocs,
      models: models.totalDocs,
      newTasksToday: newTasksToday.totalDocs,
      paidOrdersToday: paidOrdersToday.totalDocs,
      payments: payments.totalDocs,
      pendingOrders: pendingOrders.totalDocs,
      processingTasks: processingTasks.totalDocs,
      reservedCreditAccounts: reservedCreditAccounts.totalDocs,
      tasks: tasks.totalDocs,
      totalOrders: orders.totalDocs,
    },
    operatorQueues: {
      failedTasks: {
        count: failedTaskQueue.totalDocs,
        docs: failedTaskQueue.docs,
      },
      highBalanceAccounts: {
        count: highBalanceQueue.totalDocs,
        docs: highBalanceQueue.docs,
      },
      lowBalanceAccounts: {
        count: lowBalanceQueue.totalDocs,
        docs: lowBalanceQueue.docs,
      },
      pendingOrders: {
        count: pendingOrderQueue.totalDocs,
        docs: pendingOrderQueue.docs,
      },
      paymentExceptions: {
        count: paymentExceptionQueue.totalDocs,
        docs: paymentExceptionQueue.docs,
      },
    },
    recentOrders: recentOrders.docs,
    recentPayments: recentPayments.docs,
    recentTasks: recentTasks.docs,
    topCreditAccounts: topCreditAccounts.docs,
  }
}
