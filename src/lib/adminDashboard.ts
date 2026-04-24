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

  const countDocs = async (args: Parameters<typeof payload.count>[0]) => {
    const result = await payload.count(args)
    return result.totalDocs
  }

  const tasks = await countDocs({ collection: 'generation-tasks', where: {} })
  const models = await countDocs({ collection: 'models', where: {} })
  const orders = await countDocs({ collection: 'print-orders', where: {} })
  const payments = await countDocs({ collection: 'shopify-payments', where: {} })
  const creditAccounts = await countDocs({ collection: 'credits', where: {} })
  const recentTasks = await payload.find({ collection: 'generation-tasks', depth: 1, limit: 5, sort: '-updatedAt' })
  const recentOrders = await payload.find({ collection: 'print-orders', depth: 2, limit: 5, sort: '-updatedAt' })
  const recentPayments = await payload.find({ collection: 'shopify-payments', depth: 2, limit: 5, sort: '-updatedAt' })
  const topCreditAccounts = await payload.find({ collection: 'credits', depth: 1, limit: 5, sort: '-balance' })
  const failedTaskQueue = await payload.find({
    collection: 'generation-tasks',
    depth: 1,
    limit: 6,
    sort: '-updatedAt',
    where: {
      status: { in: ['failed', 'timeout'] },
    },
  })
  const pendingOrderQueue = await payload.find({
    collection: 'print-orders',
    depth: 2,
    limit: 6,
    sort: '-updatedAt',
    where: {
      or: [{ status: { equals: 'pending-payment' } }, { paymentStatus: { in: ['failed', 'refunded'] } }, { status: { equals: 'cancelled' } }],
    },
  })
  const paymentExceptionQueue = await payload.find({
    collection: 'shopify-payments',
    depth: 2,
    limit: 6,
    sort: '-updatedAt',
    where: {
      status: { in: ['failed', 'refunded', 'pending'] },
    },
  })
  const lowBalanceQueue = await payload.find({
    collection: 'credits',
    depth: 1,
    limit: 6,
    sort: 'balance',
    where: {
      balance: { less_than_equal: 20 },
    },
  })
  const highBalanceQueue = await payload.find({
    collection: 'credits',
    depth: 1,
    limit: 6,
    sort: '-balance',
    where: {
      balance: { greater_than: 50 },
    },
  })

  const newTasksToday = await countDocs({
      collection: 'generation-tasks',
      where: { createdAt: { greater_than_equal: today } },
    })
  const processingTasks = await countDocs({
      collection: 'generation-tasks',
      where: { status: { in: ['queued', 'processing'] } },
    })
  const failedTasks = await countDocs({
      collection: 'generation-tasks',
      where: { status: { equals: 'failed' } },
    })
  const paidOrdersToday = await countDocs({
      collection: 'print-orders',
      where: {
        and: [{ createdAt: { greater_than_equal: today } }, { status: { in: ['paid', 'in-production', 'shipped', 'completed'] } }],
      },
    })
  const pendingOrders = await countDocs({
      collection: 'print-orders',
      where: { status: { in: ['pending-payment', 'paid', 'in-production'] } },
    })
  const highBalanceAccounts = await countDocs({
      collection: 'credits',
      where: { balance: { greater_than: 50 } },
    })
  const lowBalanceAccounts = await countDocs({
      collection: 'credits',
      where: { balance: { less_than_equal: 20 } },
    })
  const reservedCreditAccounts = await countDocs({
      collection: 'credits',
      where: { reservedBalance: { greater_than: 0 } },
    })

  const taskStatusCounts = []
  for (const status of taskStatuses) {
    taskStatusCounts.push({
      count: await countDocs({
        collection: 'generation-tasks',
        where: { status: { equals: status } },
      }),
      key: status,
    })
  }

  const taskModeCounts = []
  for (const mode of taskModes) {
    taskModeCounts.push({
      count: await countDocs({
        collection: 'generation-tasks',
        where: { inputMode: { equals: mode } },
      }),
      key: mode,
    })
  }

  const orderStatusCounts = []
  for (const status of orderStatuses) {
    orderStatusCounts.push({
      count: await countDocs({
        collection: 'print-orders',
        where: { status: { equals: status } },
      }),
      key: status,
    })
  }

  const paymentStatusCounts = []
  for (const status of paymentStatuses) {
    paymentStatusCounts.push({
      count: await countDocs({
        collection: 'shopify-payments',
        where: { status: { equals: status } },
      }),
      key: status,
    })
  }

  const taskTrend = []
  for (const range of ranges) {
    taskTrend.push({
      count: await countDocs({
        collection: 'generation-tasks',
        where: {
          and: [{ createdAt: { greater_than_equal: range.start } }, { createdAt: { less_than: range.end } }],
        },
      }),
      label: range.label,
    })
  }

  const paidOrderTrend = []
  for (const range of ranges) {
    paidOrderTrend.push({
      count: await countDocs({
        collection: 'print-orders',
        where: {
          and: [
            { createdAt: { greater_than_equal: range.start } },
            { createdAt: { less_than: range.end } },
            { status: { in: ['paid', 'in-production', 'shipped', 'completed'] } },
          ],
        },
      }),
      label: range.label,
    })
  }

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
      creditAccounts,
      failedTasks,
      highBalanceAccounts,
      lowBalanceAccounts,
      models,
      newTasksToday,
      paidOrdersToday,
      payments,
      pendingOrders,
      processingTasks,
      reservedCreditAccounts,
      tasks,
      totalOrders: orders,
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
