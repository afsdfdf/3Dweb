import type { CSSProperties } from 'react'
import Link from 'next/link'

import { getOpsDashboardData } from '@/lib/adminDashboard'

const shellStyle: CSSProperties = {
  display: 'grid',
  gap: 20,
  padding: '4px 0 24px',
}

const panelStyle: CSSProperties = {
  background: '#fff',
  border: '1px solid rgba(15, 23, 42, 0.08)',
  borderRadius: 16,
  padding: 20,
}

const statStyle: CSSProperties = {
  ...panelStyle,
  padding: 18,
}

const sectionTitleStyle: CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  letterSpacing: '0.02em',
  margin: 0,
  textTransform: 'uppercase',
}

function formatTaskStatus(status?: string) {
  switch (status) {
    case 'queued':
      return '排队中'
    case 'processing':
      return '处理中'
    case 'succeeded':
      return '已完成'
    case 'failed':
      return '失败'
    case 'timeout':
      return '超时'
    default:
      return status || '未知'
  }
}

function formatInputMode(mode?: string) {
  switch (mode) {
    case 'image':
      return '图生 3D'
    case 'text':
      return '文生 3D'
    case 'hybrid':
      return '图文混合'
    default:
      return mode || '未知模式'
  }
}

function formatOrderStatus(status?: string) {
  switch (status) {
    case 'pending-payment':
    case 'pending':
      return '待支付'
    case 'paid':
      return '已支付'
    case 'in-production':
    case 'printing':
      return '生产中'
    case 'shipped':
      return '已发货'
    case 'completed':
      return '已完成'
    case 'cancelled':
      return '已取消'
    case 'failed':
      return '失败'
    case 'refunded':
      return '已退款'
    default:
      return status || '未知'
  }
}

const groupedLinks = [
  { items: [
      { href: '/admin/collections/generation-tasks', label: '任务管理' },
      { href: '/admin/collections/task-events', label: '任务事件' },
      { href: '/admin/collections/models', label: '模型库' },
      { href: '/admin/globals/ai-provider-settings', label: 'AI 配置' },
    ], title: 'AI 生产' },
  { items: [
      { href: '/admin/collections/print-orders', label: '打印订单' },
      { href: '/admin/collections/credit-products', label: '积分商品' },
      { href: '/admin/collections/credit-transactions', label: '积分流水' },
      { href: '/admin/collections/shopify-payments', label: 'Shopify 支付' },
    ], title: '商务' },
  { items: [
      { href: '/admin/collections/users', label: '用户' },
      { href: '/admin/collections/media', label: '媒体资源' },
      { href: '/admin/globals/site-settings', label: '站点设置' },
      { href: '/admin/globals/homepage-content', label: '首页内容' },
    ], title: '平台' },
]

export async function OpsDashboardView() {
  const data = await getOpsDashboardData()

  const cards = [
    { label: '今日新任务', subLabel: '新增任务数', value: data.overview.newTasksToday },
    { label: '处理中', subLabel: '当前进行中', value: data.overview.processingTasks },
    { label: '待履约订单', subLabel: '待支付/生产', value: data.overview.pendingOrders },
    { label: '高余额账户', subLabel: '余额 > 50', value: data.overview.highBalanceAccounts },
  ]

  return (
    <div style={shellStyle}>
      <div style={{ background: '#fff', border: '1px solid rgba(15, 23, 42, 0.08)', borderRadius: 18, padding: 24 }}>
        <div style={{ alignItems: 'center', display: 'flex', gap: 16, justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <p style={{ color: '#64748b', margin: 0 }}>运营后台</p>
            <h1 style={{ fontSize: 32, lineHeight: 1.15, margin: '8px 0 0' }}>AI 任务、订单与积分总览</h1>
          </div>
          <div style={{ color: '#64748b', fontSize: 14, textAlign: 'right' }}>
            <div>任务总数：{data.overview.tasks}</div>
            <div>订单总数：{data.overview.totalOrders}</div>
            <div>积分账户：{data.overview.creditAccounts}</div>
          </div>
        </div>
        <p style={{ color: '#475569', lineHeight: 1.7, margin: 0, maxWidth: 900 }}>
          本页聚合任务、订单、支付与积分运营的核心数据。后续接入真实 Shopify 时，只需替换支付网关实现层。
        </p>
      </div>

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}>
        {cards.map((card) => (
          <div key={card.label} style={statStyle}>
            <div style={{ color: '#64748b', fontSize: 12 }}>{card.subLabel}</div>
            <div style={{ fontSize: 28, fontWeight: 700, marginTop: 8 }}>{card.value}</div>
            <div style={{ color: '#0f172a', fontSize: 14, marginTop: 6 }}>{card.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: '1.1fr 1fr' }}>
        <div style={panelStyle}>
          <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ margin: 0 }}>快捷入口</h2>
            <span style={{ color: '#64748b', fontSize: 13 }}>支付记录：{data.overview.payments}</span>
          </div>
          <div style={{ display: 'grid', gap: 14 }}>
            {groupedLinks.map((group) => (
              <div key={group.title}>
                <p style={sectionTitleStyle}>{group.title}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 10 }}>
                  {group.items.map((item) => (
                    <Link key={item.href} href={item.href} style={{ background: '#f8fafc', border: '1px solid rgba(15, 23, 42, 0.08)', borderRadius: 999, color: '#0f172a', padding: '8px 14px' }}>
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={panelStyle}>
          <h2 style={{ marginTop: 0 }}>任务流</h2>
          <div style={{ display: 'grid', gap: 12 }}>
            {['1. 前台提交生成请求', '2. 创建任务与事件记录', '3. 调用 AI 供应商接口', '4. 轮询或等待回调', '5. 成功后自动生成模型记录', '6. 失败后进入异常处理或退款'].map((item) => (
              <div key={item} style={{ background: '#f8fafc', border: '1px solid rgba(15, 23, 42, 0.06)', borderRadius: 12, padding: '12px 14px' }}>{item}</div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: '1fr 1fr' }}>
        <div style={panelStyle}>
          <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <h2 style={{ margin: 0 }}>订单运营面板</h2>
            <Link href="/admin/collections/print-orders">进入订单管理</Link>
          </div>
          <div style={{ display: 'grid', gap: 12 }}>
            {data.recentOrders.length > 0 ? data.recentOrders.map((order: any) => (
              <div key={order.id} style={{ border: '1px solid rgba(15, 23, 42, 0.08)', borderRadius: 12, padding: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: 6 }}>{order.orderNumber}</div>
                    <div style={{ color: '#64748b', fontSize: 13 }}>{order.model?.title || '未关联模型'}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 13 }}>{formatOrderStatus(order.status)}</div>
                    <div style={{ color: '#64748b', fontSize: 13 }}>{order.amount ?? 0} {order.currency ?? 'USD'}</div>
                  </div>
                </div>
              </div>
            )) : <div style={{ background: '#f8fafc', border: '1px dashed rgba(15, 23, 42, 0.12)', borderRadius: 12, color: '#64748b', padding: 20 }}>暂无订单</div>}
          </div>
        </div>

        <div style={panelStyle}>
          <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <h2 style={{ margin: 0 }}>用户积分面板</h2>
            <Link href="/admin/collections/credits">进入积分账户</Link>
          </div>
          <div style={{ display: 'grid', gap: 12 }}>
            {data.topCreditAccounts.length > 0 ? data.topCreditAccounts.map((account: any) => (
              <div key={account.id} style={{ border: '1px solid rgba(15, 23, 42, 0.08)', borderRadius: 12, padding: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: 6 }}>{account.user?.email || account.accountLabel}</div>
                    <div style={{ color: '#64748b', fontSize: 13 }}>预扣：{account.reservedBalance ?? 0}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 18, fontWeight: 700 }}>{account.balance ?? 0}</div>
                    <div style={{ color: '#64748b', fontSize: 13 }}>累计消费：{account.lifetimeSpent ?? 0}</div>
                  </div>
                </div>
              </div>
            )) : <div style={{ background: '#f8fafc', border: '1px dashed rgba(15, 23, 42, 0.12)', borderRadius: 12, color: '#64748b', padding: 20 }}>暂无积分账户</div>}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: '1fr 1fr' }}>
        <div style={panelStyle}>
          <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <h2 style={{ margin: 0 }}>最近任务</h2>
            <Link href="/admin/collections/generation-tasks">查看全部</Link>
          </div>
          <div style={{ display: 'grid', gap: 12 }}>
            {data.recentTasks.length > 0 ? data.recentTasks.map((task: any) => (
              <div key={task.id} style={{ border: '1px solid rgba(15, 23, 42, 0.08)', borderRadius: 12, padding: 12 }}>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>{task.taskCode}</div>
                <div style={{ color: '#64748b', fontSize: 13 }}>{formatInputMode(task.inputMode)} · {formatTaskStatus(task.status)} · {task.progress ?? 0}%</div>
              </div>
            )) : <div style={{ background: '#f8fafc', border: '1px dashed rgba(15, 23, 42, 0.12)', borderRadius: 12, color: '#64748b', padding: 20 }}>暂无任务</div>}
          </div>
        </div>

        <div style={panelStyle}>
          <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <h2 style={{ margin: 0 }}>最近支付</h2>
            <Link href="/admin/collections/shopify-payments">查看全部</Link>
          </div>
          <div style={{ display: 'grid', gap: 12 }}>
            {data.recentPayments.length > 0 ? data.recentPayments.map((payment: any) => (
              <div key={payment.id} style={{ border: '1px solid rgba(15, 23, 42, 0.08)', borderRadius: 12, padding: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: 6 }}>{payment.checkoutReference}</div>
                    <div style={{ color: '#64748b', fontSize: 13 }}>{payment.user?.email || '未知用户'}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 13 }}>{formatOrderStatus(payment.status)}</div>
                    <div style={{ color: '#64748b', fontSize: 13 }}>{payment.amount ?? 0} {payment.currency ?? 'USD'}</div>
                  </div>
                </div>
              </div>
            )) : <div style={{ background: '#f8fafc', border: '1px dashed rgba(15, 23, 42, 0.12)', borderRadius: 12, color: '#64748b', padding: 20 }}>暂无支付记录</div>}
          </div>
        </div>
      </div>
    </div>
  )
}

export const OpsDashboard = OpsDashboardView
