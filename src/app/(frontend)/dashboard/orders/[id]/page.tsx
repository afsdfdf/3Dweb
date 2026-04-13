import Link from 'next/link'

import { OrderActionButton } from '../../../_components/OrderActionButton'
import { OrderPaymentStatusSync } from '../../../_components/OrderPaymentStatusSync'
import { DashboardShell } from '../../../_components/DashboardShell'
import { getCurrentUserOrderById, requireUser } from '../../../_lib/session'
import { formatDateTime, formatOrderStatus } from '../../../_lib/ui-text'

const steps = [
  { key: 'pending-payment', label: '待支付', description: '订单已创建，等待完成 Stripe Checkout 支付。' },
  { key: 'paid', label: '已支付', description: '支付已确认，订单将进入生产排期。' },
  { key: 'in-production', label: '生产中', description: '工单已进入制作阶段，正在安排生产。' },
  { key: 'shipped', label: '已发货', description: '订单已出库，可以跟踪物流状态。' },
  { key: 'completed', label: '已完成', description: '订单流程已结束，欢迎继续下单。' },
] as const

export default async function DashboardOrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ checkout?: string; session_id?: string }>
}) {
  await requireUser()
  const { id } = await params
  const query = await searchParams
  const order = await getCurrentUserOrderById(id)

  if (!order) {
    return (
      <DashboardShell currentPath="/dashboard/orders" description="当前订单不存在或你没有访问权限。" title="订单详情">
        <section className="panel empty-state">
          <strong>未找到订单</strong>
          <p>请返回订单列表确认编号是否正确，或稍后刷新重试。</p>
          <Link className="primary-button" href="/dashboard/orders">
            返回订单列表
          </Link>
        </section>
      </DashboardShell>
    )
  }

  const currentIndex = steps.findIndex((step) => step.key === order.status)
  const modelTitle = typeof order.model === 'object' ? order.model?.title || '未命名模型' : String(order.model)
  const sourceTaskCode = typeof order.sourceTask === 'object' ? order.sourceTask?.taskCode || '—' : '—'
  const shouldAutoSync = query.checkout === 'success' && order.status === 'pending-payment'
  const showCancelledNotice = query.checkout === 'cancelled'

  return (
    <DashboardShell
      currentPath="/dashboard/orders"
      description="查看支付、生产、物流与收货信息，并从这里继续推进订单。"
      title={order.orderNumber || '订单详情'}
    >
      <section className="panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">订单流程</p>
            <h2>履约进度</h2>
          </div>
          <span className={`status-pill${['paid', 'in-production', 'shipped', 'completed'].includes(String(order.status)) ? ' success' : ''}`}>
            {formatOrderStatus(order.status)}
          </span>
        </div>

        {shouldAutoSync ? <OrderPaymentStatusSync enabled orderId={Number(order.id)} /> : null}
        {showCancelledNotice ? <p className="soft-text">你已取消本次支付，可稍后继续完成结账。</p> : null}

        <div className="timeline-stage-grid">
          {steps.map((step, index) => {
            const active = index <= currentIndex
            const current = index === currentIndex

            return (
              <article className={`timeline-stage${active ? ' active' : ''}${current ? ' current' : ''}`} key={step.key}>
                <div className="timeline-stage-index">{index + 1}</div>
                <div>
                  <h3>{step.label}</h3>
                  <p>{step.description}</p>
                </div>
              </article>
            )
          })}
        </div>
      </section>

      <section className="mesh-grid order-detail-grid">
        <div className="gradient-panel">
          <div className="section-head">
            <div>
              <p className="eyebrow">订单信息</p>
              <h2>支付与制作</h2>
            </div>
          </div>

          <div className="detail-grid">
            <div><strong>订单号</strong><p>{order.orderNumber}</p></div>
            <div><strong>当前状态</strong><p>{formatOrderStatus(order.status)}</p></div>
            <div><strong>订单金额</strong><p>{order.amount ?? 0} {order.currency ?? 'USD'}</p></div>
            <div><strong>使用积分</strong><p>{order.creditsUsed ?? 0}</p></div>
            <div><strong>关联模型</strong><p>{modelTitle}</p></div>
            <div><strong>来源任务</strong><p>{sourceTaskCode}</p></div>
            <div><strong>尺寸方案</strong><p>{order.sizeOption || 'standard'}</p></div>
            <div><strong>材质方案</strong><p>{order.materialOption || 'plastic'}</p></div>
            <div><strong>创建时间</strong><p>{formatDateTime(order.createdAt)}</p></div>
            <div><strong>更新时间</strong><p>{formatDateTime(order.updatedAt)}</p></div>
          </div>

          <div className="button-column" style={{ marginTop: 18 }}>
            {order.shopifyCheckoutUrl ? (
              <a className="primary-button" href={order.shopifyCheckoutUrl} rel="noreferrer" target="_blank">
                继续支付
              </a>
            ) : null}
            <OrderActionButton orderId={Number(order.id)} status={String(order.status)} />
            <Link className="ghost-button" href="/dashboard/orders">
              返回订单列表
            </Link>
          </div>
        </div>

        <div className="detail-stack">
          <div className="panel">
            <p className="eyebrow">收货信息</p>
            <h2>配送详情</h2>
            <div className="detail-grid compact-gap">
              <div><strong>收件人</strong><p>{order.shippingName || '未填写'}</p></div>
              <div><strong>联系电话</strong><p>{order.shippingPhone || '未填写'}</p></div>
              <div className="full-width"><strong>收货地址</strong><p>{order.shippingAddress || '未填写'}</p></div>
              <div><strong>物流单号</strong><p>{order.trackingNumber || '待生成'}</p></div>
              <div><strong>支付会话</strong><p>{query.session_id || order.shopifyOrderId || 'Stripe Checkout 已创建'}</p></div>
            </div>
          </div>

          <div className="panel">
            <p className="eyebrow">订单备注</p>
            <h2>内部状态</h2>
            <p className="soft-text">
              {order.internalNotes || '系统会在支付、生产和发货节点更新这里的说明。'}
            </p>
          </div>

          <div className="panel">
            <p className="eyebrow">下一步</p>
            <h2>操作建议</h2>
            <ul className="check-list">
              <li>如果已完成支付但状态未变化，可点击“检查支付结果”。</li>
              <li>进入发货后，物流单号会显示在本页和订单列表中。</li>
              <li>订单完成后仍可回到模型库继续下新的打印单。</li>
            </ul>
          </div>
        </div>
      </section>
    </DashboardShell>
  )
}
