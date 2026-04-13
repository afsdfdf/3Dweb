import { getCachedPayload } from './getCachedPayload'

const startOfToday = () => {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return now.toISOString()
}

export async function getOpsDashboardData() {
  const payload = await getCachedPayload()

  const [tasks, models, orders, payments, creditAccounts, recentTasks, recentOrders, recentPayments, topCreditAccounts] = await Promise.all([
    payload.count({ collection: 'generation-tasks', where: {} }),
    payload.count({ collection: 'models', where: {} }),
    payload.count({ collection: 'print-orders', where: {} }),
    payload.count({ collection: 'shopify-payments', where: {} }),
    payload.count({ collection: 'credits', where: {} }),
    payload.find({ collection: 'generation-tasks', depth: 1, limit: 5, sort: '-updatedAt' }),
    payload.find({ collection: 'print-orders', depth: 2, limit: 5, sort: '-updatedAt' }),
    payload.find({ collection: 'shopify-payments', depth: 2, limit: 5, sort: '-updatedAt' }),
    payload.find({ collection: 'credits', depth: 1, limit: 5, sort: '-balance' }),
  ])

  const today = startOfToday()

  const [newTasksToday, processingTasks, failedTasks, paidOrdersToday, pendingOrders, highBalanceAccounts] = await Promise.all([
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
  ])

  return {
    overview: {
      creditAccounts: creditAccounts.totalDocs,
      failedTasks: failedTasks.totalDocs,
      highBalanceAccounts: highBalanceAccounts.totalDocs,
      models: models.totalDocs,
      newTasksToday: newTasksToday.totalDocs,
      paidOrdersToday: paidOrdersToday.totalDocs,
      payments: payments.totalDocs,
      pendingOrders: pendingOrders.totalDocs,
      processingTasks: processingTasks.totalDocs,
      tasks: tasks.totalDocs,
      totalOrders: orders.totalDocs,
    },
    recentOrders: recentOrders.docs,
    recentPayments: recentPayments.docs,
    recentTasks: recentTasks.docs,
    topCreditAccounts: topCreditAccounts.docs,
  }
}
