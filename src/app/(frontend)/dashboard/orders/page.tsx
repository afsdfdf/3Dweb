import Link from 'next/link'

import { OrderActionButton } from '../../_components/OrderActionButton'
import { DashboardShell } from '../../_components/DashboardShell'
import { getCurrentUserOrders, requireUser } from '../../_lib/session'
import { formatDateTime, formatOrderStatus } from '../../_lib/ui-text'

function getOrderModelTitle(order: Awaited<ReturnType<typeof getCurrentUserOrders>>['docs'][number]) {
  return typeof order.model === 'object' ? order.model?.title || '未命名模型' : '未命名模型'
}

export default async function DashboardOrdersPage() {
  await requireUser()
  const orders = await getCurrentUserOrders()

  const pendingPayment = orders.docs.filter((order) => order.status === 'pending-payment').length
  const inProduction = orders.docs.filter((order) => order.status === 'in-production').length
  const shipped = orders.docs.filter((order) => order.status === 'shipped').length
  const completed = orders.docs.filter((order) => order.status === 'completed').length

  return (
    <DashboardShell
      currentPath="/dashboard/orders"
      description="查看支付进度、生产状态、物流信息与订单备注，所有实物履约都从这里继续。"
      title="订单中心"
    >
      <section className="metric-grid">
        <article className="stat-card"><p>订单总数</p><h3>{orders.docs.length}</h3></article>
        <article className="stat-card"><p>待支付</p><h3>{pendingPayment}</h3></article>
        <article className="stat-card"><p>生产中</p><h3>{inProduction}</h3></article>
        <article className="stat-card"><p>已发货 / 已完成</p><h3>{shipped + completed}</h3></article>
      </section>

      <section className="records-grid">
        {orders.docs.length > 0 ? (
          orders.docs.map((order) => {
            const progressMap: Record<string, number> = {
              'pending-payment': 18,
              paid: 36,
              'in-production': 64,
              shipped: 84,
              completed: 100,
              cancelled: 100,
            }

            return (
              <article className="record-card" key={order.id}>
                <div className="record-card-head">
                  <div>
                    <p className="eyebrow">订单</p>
                    <h2>{order.orderNumber}</h2>
                  </div>
                  <span className={`status-pill${['completed', 'paid', 'in-production', 'shipped'].includes(order.status) ? ' success' : ''}`}>
                    {formatOrderStatus(order.status)}
                  </span>
                </div>

                <p className="record-summary">
                  {getOrderModelTitle(order)} · {order.sizeOption || 'standard'} / {order.materialOption || 'plastic'}
                </p>

                <div className="detail-grid compact-gap">
                  <div>
                    <strong>金额</strong>
                    <p>{order.amount ?? 0} {order.currency ?? 'USD'}</p>
                  </div>
                  <div>
                    <strong>积分</strong>
                    <p>{order.creditsUsed ?? 0}</p>
                  </div>
                  <div>
                    <strong>物流单号</strong>
                    <p>{order.trackingNumber || '待生成'}</p>
                  </div>
                  <div>
                    <strong>最近更新</strong>
                    <p>{formatDateTime(order.updatedAt)}</p>
                  </div>
                </div>

                <div className="progress-track order-progress" aria-hidden="true">
                  <span style={{ width: `${progressMap[String(order.status)] ?? 10}%` }} />
                </div>

                <div className="record-card-footer order-actions-row">
                  <span className="muted-text">创建于 {formatDateTime(order.createdAt)}</span>
                  <div className="button-row wrap-end">
                    <Link className="ghost-button" href={`/dashboard/orders/${order.id}`}>
                      查看详情
                    </Link>
                    <OrderActionButton orderId={Number(order.id)} status={String(order.status)} />
                  </div>
                </div>
              </article>
            )
          })
        ) : (
          <section className="panel empty-state">
            <strong>还没有打印订单</strong>
            <p>当你在模型库或生成结果里发起实物打印后，订单会出现在这里。</p>
            <Link className="primary-button" href="/dashboard/library">
              前往模型库
            </Link>
          </section>
        )}
      </section>
    </DashboardShell>
  )
}
