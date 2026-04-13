import Link from 'next/link'

import type { GenerationTask, PrintOrder } from '@/payload-types'

import { DashboardShell } from '../_components/DashboardShell'
import {
  getCurrentUserCreditAccount,
  getCurrentUserModels,
  getCurrentUserOrders,
  getCurrentUserTasks,
  requireUser,
} from '../_lib/session'
import { formatDateTime, formatOrderStatus, formatTaskStatus } from '../_lib/ui-text'

type ActivityItem = {
  description: string
  href: string
  id: string
  kind: string
  time?: string | null
  title: string
}

function getOrderModelTitle(order: PrintOrder) {
  return typeof order.model === 'object' ? order.model?.title || '未命名模型' : '未命名模型'
}

export default async function DashboardOverviewPage() {
  const user = await requireUser()
  const [tasks, models, orders, creditAccount] = await Promise.all([
    getCurrentUserTasks(),
    getCurrentUserModels(),
    getCurrentUserOrders(),
    getCurrentUserCreditAccount(),
  ])

  const processing = tasks.docs.filter((task) => ['queued', 'processing'].includes(task.status)).length
  const completedTasks = tasks.docs.filter((task) => task.status === 'succeeded').length
  const readyModels = models.docs.filter((model) => model.status === 'ready').length
  const paidOrders = orders.docs.filter((order) => ['paid', 'in-production', 'shipped', 'completed'].includes(order.status)).length

  const activities: ActivityItem[] = [
    ...tasks.docs.slice(0, 3).map((task: GenerationTask) => ({
      id: `task-${task.id}`,
      title: `${task.taskCode} · ${formatTaskStatus(task.status)}`,
      description: task.prompt || '该任务暂未填写提示词说明。',
      time: task.updatedAt || task.createdAt,
      href: `/results/${task.taskCode}`,
      kind: '任务',
    })),
    ...orders.docs.slice(0, 2).map((order: PrintOrder) => ({
      id: `order-${order.id}`,
      title: `${order.orderNumber} · ${formatOrderStatus(order.status)}`,
      description: getOrderModelTitle(order),
      time: order.updatedAt || order.createdAt,
      href: `/dashboard/orders/${order.id}`,
      kind: '订单',
    })),
  ]
    .sort((a, b) => new Date(b.time || '').getTime() - new Date(a.time || '').getTime())
    .slice(0, 5)

  return (
    <DashboardShell
      currentPath="/dashboard"
      description="快速查看当前任务、模型、订单与积分状态，这是用户进入 Studio 之后的主控制台。"
      title="工作台总览"
    >
      <section className="metric-grid">
        <article className="stat-card">
          <p>当前账号</p>
          <h3>{user.fullName || user.email}</h3>
          <span className="muted-text">欢迎回来，继续推进你的 3D 工作流。</span>
        </article>
        <article className="stat-card">
          <p>处理中任务</p>
          <h3>{processing}</h3>
          <span className="muted-text">累计完成 {completedTasks} 个任务</span>
        </article>
        <article className="stat-card">
          <p>模型资产</p>
          <h3>{models.docs.length}</h3>
          <span className="muted-text">其中 {readyModels} 个已可下载或打印</span>
        </article>
        <article className="stat-card">
          <p>可用积分</p>
          <h3>{creditAccount?.balance ?? 0}</h3>
          <span className="muted-text">已支付订单 {paidOrders} 个</span>
        </article>
      </section>

      <section className="mesh-grid dashboard-spotlight">
        <div className="gradient-panel dashboard-summary-panel">
          <div className="section-head">
            <div>
              <p className="eyebrow">今日重点</p>
              <h2>先处理正在运行的任务，再把可用模型推进到下载或打印。</h2>
            </div>
            <span className="status-pill success">工作流在线</span>
          </div>

          <div className="detail-grid compact-gap">
            <div>
              <strong>任务节奏</strong>
              <p>当前有 {processing} 个任务在运行，建议先关注排队与处理中项。</p>
            </div>
            <div>
              <strong>模型沉淀</strong>
              <p>{readyModels} 个模型已可进入下载、模型库归档或打印订单链路。</p>
            </div>
            <div>
              <strong>订单推进</strong>
              <p>{paidOrders} 个订单已完成支付，可继续进入生产或物流阶段。</p>
            </div>
            <div>
              <strong>资金状态</strong>
              <p>当前积分余额 {creditAccount?.balance ?? 0}，足够继续提交新任务或下载结果。</p>
            </div>
          </div>

          <div className="button-row" style={{ marginTop: 18 }}>
            <Link className="primary-button" href="/generate">
              进入 Studio
            </Link>
            <Link className="secondary-button" href="/dashboard/library">
              打开模型库
            </Link>
          </div>
        </div>

        <div className="panel dashboard-activity-panel">
          <div className="section-head">
            <div>
              <p className="eyebrow">最近动态</p>
              <h2>最近更新的任务与订单</h2>
            </div>
          </div>

          <div className="timeline-list">
            {activities.length > 0 ? (
              activities.map((item) => (
                <article className="timeline-item" key={item.id}>
                  <div className="timeline-dot" />
                  <div className="timeline-content">
                    <div className="timeline-topline">
                      <strong>{item.title}</strong>
                      <span className="muted-text">{item.kind}</span>
                    </div>
                    <p>{item.description}</p>
                    <div className="timeline-footer">
                      <span className="muted-text">{formatDateTime(item.time)}</span>
                      <Link href={item.href}>查看详情</Link>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <div className="empty-state compact">
                <strong>还没有最近动态</strong>
                <p>先创建一个生成任务，随后这里会展示最新的任务和订单变化。</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="two-column">
        <div className="panel">
          <div className="section-head">
            <div>
              <p className="eyebrow">任务面板</p>
              <h2>需要你关注的生成任务</h2>
            </div>
            <Link href="/dashboard/tasks">查看全部</Link>
          </div>

          <div className="table-like">
            {tasks.docs.length > 0 ? (
              tasks.docs.slice(0, 4).map((task) => (
                <div className="table-row" key={task.id}>
                  <div>
                    <strong>{task.taskCode}</strong>
                    <p>{task.prompt || '该任务未填写详细提示词。'}</p>
                  </div>
                  <div className="row-meta-stack">
                    <p>{formatTaskStatus(task.status)}</p>
                    <span className="muted-text">
                      {task.progress ?? 0}% · {formatDateTime(task.updatedAt || task.createdAt)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state compact">
                <strong>还没有生成任务</strong>
                <p>进入 Studio 后提交第一条任务，这里就会开始显示进度。</p>
              </div>
            )}
          </div>
        </div>

        <div className="panel">
          <div className="section-head">
            <div>
              <p className="eyebrow">订单面板</p>
              <h2>最近需要推进的履约订单</h2>
            </div>
            <Link href="/dashboard/orders">查看全部</Link>
          </div>

          <div className="table-like">
            {orders.docs.length > 0 ? (
              orders.docs.slice(0, 4).map((order: PrintOrder) => (
                <div className="table-row" key={order.id}>
                  <div>
                    <strong>{order.orderNumber}</strong>
                    <p>{getOrderModelTitle(order)}</p>
                  </div>
                  <div className="row-meta-stack">
                    <p>{formatOrderStatus(order.status)}</p>
                    <span className="muted-text">{order.amount ?? 0} {order.currency ?? 'USD'}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state compact">
                <strong>还没有打印订单</strong>
                <p>当模型进入实物交付流程后，订单会在这里出现。</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </DashboardShell>
  )
}
