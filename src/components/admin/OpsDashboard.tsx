import type { CSSProperties } from 'react'
import Link from 'next/link'

import { getOpsDashboardData } from '@/lib/adminDashboard'

const colors = {
  blue: '#2563eb',
  blueSoft: '#dbeafe',
  border: 'rgba(15, 23, 42, 0.08)',
  cyan: '#0891b2',
  foreground: '#0f172a',
  green: '#16a34a',
  greenSoft: '#dcfce7',
  panel: '#ffffff',
  slate: '#64748b',
  subtle: '#f8fafc',
  violet: '#7c3aed',
  violetSoft: '#ede9fe',
  yellow: '#d97706',
  yellowSoft: '#fef3c7',
}

const shellStyle: CSSProperties = {
  display: 'grid',
  gap: 20,
  padding: '4px 0 28px',
}

const panelStyle: CSSProperties = {
  background: colors.panel,
  border: `1px solid ${colors.border}`,
  borderRadius: 18,
  padding: 20,
}

const headingMetaStyle: CSSProperties = {
  color: colors.slate,
  fontSize: 13,
  fontWeight: 600,
  letterSpacing: '0.04em',
  margin: 0,
  textTransform: 'uppercase',
}

const sectionTitleStyle: CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  letterSpacing: '0.06em',
  margin: 0,
  textTransform: 'uppercase',
}

const linkPillStyle: CSSProperties = {
  background: colors.subtle,
  border: `1px solid ${colors.border}`,
  borderRadius: 999,
  color: colors.foreground,
  fontSize: 13,
  fontWeight: 600,
  padding: '8px 14px',
  textDecoration: 'none',
}

const cardStyle: CSSProperties = {
  ...panelStyle,
  padding: 18,
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

function formatDateTime(value?: string) {
  if (!value) return '刚刚'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

function getStatusTone(status?: string) {
  switch (status) {
    case 'succeeded':
    case 'completed':
    case 'paid':
      return { background: colors.greenSoft, color: colors.green }
    case 'processing':
    case 'in-production':
    case 'queued':
    case 'pending':
    case 'pending-payment':
      return { background: colors.blueSoft, color: colors.blue }
    case 'failed':
    case 'timeout':
    case 'cancelled':
    case 'refunded':
      return { background: '#fee2e2', color: '#dc2626' }
    default:
      return { background: colors.violetSoft, color: colors.violet }
  }
}

function getTaskStatusLabel(status: string) {
  return formatTaskStatus(status)
}

function getTaskModeLabel(mode: string) {
  return formatInputMode(mode)
}

function getOrderStatusLabel(status: string) {
  return formatOrderStatus(status)
}

function getPaymentStatusLabel(status: string) {
  switch (status) {
    case 'pending':
      return '待支付'
    case 'paid':
      return '已支付'
    case 'failed':
      return '失败'
    case 'refunded':
      return '已退款'
    default:
      return status || '未知'
  }
}

function StatusBadge({ label, tone }: { label: string; tone: { background: string; color: string } }) {
  return (
    <span
      style={{
        background: tone.background,
        borderRadius: 999,
        color: tone.color,
        display: 'inline-flex',
        fontSize: 12,
        fontWeight: 700,
        padding: '5px 10px',
      }}
    >
      {label}
    </span>
  )
}

function MetricCard({
  accent,
  label,
  note,
  value,
}: {
  accent: string
  label: string
  note: string
  value: number
}) {
  return (
    <div style={cardStyle}>
      <div
        style={{
          alignItems: 'center',
          display: 'inline-flex',
          gap: 8,
        }}
      >
        <span
          style={{
            background: accent,
            borderRadius: 999,
            display: 'inline-block',
            height: 10,
            width: 10,
          }}
        />
        <span style={{ color: colors.slate, fontSize: 12 }}>{note}</span>
      </div>
      <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.04em', marginTop: 12 }}>{value}</div>
      <div style={{ color: colors.foreground, fontSize: 14, fontWeight: 600, marginTop: 6 }}>{label}</div>
    </div>
  )
}

function TrendChart({
  bars,
  lines,
  title,
}: {
  bars: Array<{ count: number; label: string }>
  lines: Array<{ count: number; label: string }>
  title: string
}) {
  const maxValue = Math.max(1, ...bars.map((item) => item.count), ...lines.map((item) => item.count))

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <div>
        <h3 style={{ fontSize: 20, margin: 0 }}>{title}</h3>
        <p style={{ color: colors.slate, fontSize: 13, lineHeight: 1.7, margin: '6px 0 0' }}>
          用最近 7 天的任务提交与已支付订单走势，判断后台当前更偏向“流量增长”还是“交付推进”。
        </p>
      </div>

      <div
        style={{
          background: colors.subtle,
          border: `1px solid ${colors.border}`,
          borderRadius: 16,
          display: 'grid',
          gap: 12,
          padding: 16,
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ alignItems: 'center', display: 'inline-flex', gap: 8 }}>
            <span style={{ background: colors.blue, borderRadius: 999, height: 10, width: 10 }} />
            <span style={{ color: colors.slate, fontSize: 12 }}>任务提交</span>
          </div>
          <div style={{ alignItems: 'center', display: 'inline-flex', gap: 8 }}>
            <span style={{ background: colors.green, borderRadius: 999, height: 10, width: 10 }} />
            <span style={{ color: colors.slate, fontSize: 12 }}>已支付订单</span>
          </div>
        </div>

        <div style={{ alignItems: 'end', display: 'grid', gap: 12, gridTemplateColumns: `repeat(${bars.length}, minmax(0, 1fr))`, minHeight: 180 }}>
          {bars.map((bar, index) => {
            const line = lines[index]
            const barHeight = `${Math.max(10, (bar.count / maxValue) * 100)}%`
            const lineHeight = `${Math.max(10, (line.count / maxValue) * 100)}%`

            return (
              <div key={bar.label} style={{ display: 'grid', gap: 8, justifyItems: 'center' }}>
                <div style={{ alignItems: 'end', display: 'flex', gap: 6, height: 130, width: '100%' }}>
                  <div style={{ background: colors.blue, borderRadius: 999, flex: 1, height: barHeight, minWidth: 18 }} />
                  <div style={{ background: colors.green, borderRadius: 999, flex: 1, height: lineHeight, minWidth: 18 }} />
                </div>
                <div style={{ color: colors.slate, fontSize: 12, textAlign: 'center' }}>{bar.label}</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function DistributionCard({
  color,
  items,
  labelFormatter,
  title,
}: {
  color: string
  items: Array<{ count: number; key: string }>
  labelFormatter: (value: string) => string
  title: string
}) {
  const total = Math.max(1, items.reduce((sum, item) => sum + item.count, 0))

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div>
        <h3 style={{ fontSize: 18, margin: 0 }}>{title}</h3>
      </div>
      <div style={{ display: 'grid', gap: 10 }}>
        {items.map((item) => {
          const percentage = Math.round((item.count / total) * 100)

          return (
            <div
              key={item.key}
              style={{
                background: colors.subtle,
                border: `1px solid ${colors.border}`,
                borderRadius: 14,
                display: 'grid',
                gap: 8,
                padding: '12px 14px',
              }}
            >
              <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{labelFormatter(item.key)}</span>
                <span style={{ color: colors.slate, fontSize: 12 }}>
                  {item.count} / {percentage}%
                </span>
              </div>
              <div style={{ background: '#e2e8f0', borderRadius: 999, height: 8, overflow: 'hidden' }}>
                <div style={{ background: color, borderRadius: 999, height: '100%', width: `${percentage}%` }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function InsightPanel({ items }: { items: string[] }) {
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      {items.map((item, index) => (
        <div
          key={item}
          style={{
            alignItems: 'center',
            background: index === 0 ? colors.blueSoft : colors.subtle,
            border: `1px solid ${colors.border}`,
            borderRadius: 14,
            color: colors.foreground,
            display: 'flex',
            gap: 12,
            padding: '12px 14px',
          }}
        >
          <span
            style={{
              alignItems: 'center',
              background: index === 0 ? colors.blue : '#cbd5e1',
              borderRadius: 999,
              color: index === 0 ? '#fff' : colors.foreground,
              display: 'inline-flex',
              fontSize: 12,
              fontWeight: 800,
              height: 24,
              justifyContent: 'center',
              minWidth: 24,
            }}
          >
            {index + 1}
          </span>
          <span style={{ fontSize: 14, lineHeight: 1.7 }}>{item}</span>
        </div>
      ))}
    </div>
  )
}

function QueueList({
  emptyText,
  items,
  linkLabel,
  linkPrefix,
  renderMeta,
  title,
}: {
  emptyText: string
  items: any[]
  linkLabel: string
  linkPrefix: string
  renderMeta: (item: any) => string
  title: string
}) {
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between' }}>
        <h3 style={{ fontSize: 18, margin: 0 }}>{title}</h3>
        <Link href={linkPrefix} style={{ color: colors.blue, fontSize: 13, fontWeight: 700 }}>
          {linkLabel}
        </Link>
      </div>
      <div style={{ display: 'grid', gap: 10 }}>
        {items.length > 0 ? (
          items.map((item) => (
            <div
              key={`${title}-${item.id}`}
              style={{
                background: colors.subtle,
                border: `1px solid ${colors.border}`,
                borderRadius: 14,
                display: 'grid',
                gap: 8,
                padding: '12px 14px',
              }}
            >
              <div style={{ alignItems: 'center', display: 'flex', gap: 12, justifyContent: 'space-between' }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>
                    {item.taskCode || item.orderNumber || item.checkoutReference || item.user?.email || item.accountLabel || `#${item.id}`}
                  </div>
                  <div style={{ color: colors.slate, fontSize: 12, marginTop: 4 }}>{renderMeta(item)}</div>
                </div>
                <Link href={`${linkPrefix}/${item.id}`} style={linkPillStyle}>
                  查看
                </Link>
              </div>
            </div>
          ))
        ) : (
          <div style={{ background: colors.subtle, border: `1px dashed ${colors.border}`, borderRadius: 14, color: colors.slate, padding: 18 }}>
            {emptyText}
          </div>
        )}
      </div>
    </div>
  )
}

const groupedLinks = [
  {
    items: [
      { href: '/admin/collections/generation-tasks', label: '任务管理' },
      { href: '/admin/collections/task-events', label: '任务事件' },
      { href: '/admin/collections/models', label: '模型库' },
      { href: '/admin/globals/ai-provider-settings', label: 'AI 配置' },
    ],
    title: 'AI 生产',
  },
  {
    items: [
      { href: '/admin/collections/print-orders', label: '打印订单' },
      { href: '/admin/collections/credit-products', label: '积分商品' },
      { href: '/admin/collections/credit-transactions', label: '积分流水' },
      { href: '/admin/collections/shopify-payments', label: '支付记录' },
    ],
    title: '商务',
  },
  {
    items: [
      { href: '/admin/collections/users', label: '用户' },
      { href: '/admin/collections/media', label: '媒体资源' },
      { href: '/admin/globals/site-settings', label: '站点设置' },
      { href: '/admin/globals/homepage-content', label: '首页内容' },
    ],
    title: '平台',
  },
] as const

export async function OpsDashboardView() {
  const data = await getOpsDashboardData()

  const cards = [
    { accent: colors.blue, label: '今日新任务', note: '新增任务数', value: data.overview.newTasksToday },
    { accent: colors.cyan, label: '处理中', note: '当前进行中', value: data.overview.processingTasks },
    { accent: colors.yellow, label: '待履约订单', note: '待支付 / 生产', value: data.overview.pendingOrders },
    { accent: colors.violet, label: '高余额账户', note: '余额 > 50', value: data.overview.highBalanceAccounts },
  ]

  const insights = [
    data.overview.failedTasks > 0
      ? `当前有 ${data.overview.failedTasks} 个失败任务，建议先查看任务事件与供应商配置。`
      : '当前没有失败任务，任务主链路状态稳定。',
    data.overview.pendingOrders > 0
      ? `当前有 ${data.overview.pendingOrders} 个待推进订单，适合优先跟进支付与履约。`
      : '当前没有堆积中的订单，履约节奏较为健康。',
    data.overview.reservedCreditAccounts > 0
      ? `有 ${data.overview.reservedCreditAccounts} 个积分账户存在预扣，建议留意异常任务是否需要退款。`
      : '当前没有挂起的积分预扣，账务状态清晰。',
    data.overview.lowBalanceAccounts > 0
      ? `有 ${data.overview.lowBalanceAccounts} 个低余额账户，可考虑引导订阅或积分充值。`
      : '用户余额分布尚可，当前不急需做充值提醒。',
  ]

  return (
    <div style={shellStyle}>
      <div
        style={{
          ...panelStyle,
          background: 'linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)',
          padding: 24,
        }}
      >
        <div style={{ alignItems: 'start', display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'space-between' }}>
          <div style={{ maxWidth: 960 }}>
            <p style={headingMetaStyle}>运营后台 / 总览</p>
            <h1 style={{ fontSize: 34, letterSpacing: '-0.04em', lineHeight: 1.08, margin: '10px 0 0' }}>AI 任务、订单与积分总览</h1>
            <p style={{ color: colors.slate, lineHeight: 1.8, margin: '12px 0 0', maxWidth: 880 }}>
              这一页只做运营看板：帮助你快速判断任务流量、订单推进、支付状态与积分健康度。核心功能入口保持不变，后台组件仅增强结构与可读性。
            </p>
          </div>

          <div style={{ display: 'grid', gap: 10, minWidth: 240 }}>
            {[
              `任务总数 ${data.overview.tasks}`,
              `订单总数 ${data.overview.totalOrders}`,
              `支付记录 ${data.overview.payments}`,
              `积分账户 ${data.overview.creditAccounts}`,
              `更新时间 ${formatDateTime(data.generatedAt)}`,
            ].map((item) => (
              <div
                key={item}
                style={{
                  background: '#ffffffcc',
                  border: `1px solid ${colors.border}`,
                  borderRadius: 14,
                  color: colors.foreground,
                  fontSize: 13,
                  fontWeight: 600,
                  padding: '10px 12px',
                }}
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}>
        {cards.map((card) => (
          <MetricCard key={card.label} {...card} />
        ))}
      </div>

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: '1.2fr 0.8fr' }}>
        <div style={panelStyle}>
          <TrendChart bars={data.analytics.taskTrend} lines={data.analytics.paidOrderTrend} title="近 7 天任务 / 订单走势" />
        </div>

        <div style={{ display: 'grid', gap: 16 }}>
          <div style={panelStyle}>
            <DistributionCard
              color={colors.blue}
              items={data.analytics.taskStatusCounts}
              labelFormatter={getTaskStatusLabel}
              title="任务状态分布"
            />
          </div>

          <div style={panelStyle}>
            <DistributionCard
              color={colors.violet}
              items={data.analytics.paymentStatusCounts}
              labelFormatter={getPaymentStatusLabel}
              title="支付状态分布"
            />
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: '1fr 1fr' }}>
        <div style={panelStyle}>
          <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <p style={headingMetaStyle}>工作入口</p>
              <h2 style={{ fontSize: 26, margin: '6px 0 0' }}>快捷入口</h2>
            </div>
            <StatusBadge label={`支付记录 ${data.overview.payments}`} tone={{ background: colors.violetSoft, color: colors.violet }} />
          </div>

          <div style={{ display: 'grid', gap: 16 }}>
            {groupedLinks.map((group) => (
              <div key={group.title}>
                <p style={sectionTitleStyle}>{group.title}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 12 }}>
                  {group.items.map((item) => (
                    <Link key={item.href} href={item.href} style={linkPillStyle}>
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={panelStyle}>
          <div style={{ marginBottom: 16 }}>
            <p style={headingMetaStyle}>运营提示</p>
            <h2 style={{ fontSize: 26, margin: '6px 0 0' }}>当前优先事项</h2>
          </div>
          <InsightPanel items={insights} />
        </div>
      </div>

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: '1fr 1fr 1fr' }}>
        <div style={panelStyle}>
          <DistributionCard
            color={colors.cyan}
            items={data.analytics.taskModeCounts}
            labelFormatter={getTaskModeLabel}
            title="任务输入模式"
          />
        </div>
        <div style={panelStyle}>
          <DistributionCard
            color={colors.green}
            items={data.analytics.orderStatusCounts}
            labelFormatter={getOrderStatusLabel}
            title="订单履约阶段"
          />
        </div>
        <div style={panelStyle}>
          <div style={{ marginBottom: 14 }}>
            <p style={headingMetaStyle}>操作路径</p>
            <h2 style={{ fontSize: 22, margin: '6px 0 0' }}>任务流</h2>
          </div>
          <InsightPanel
            items={[
              '前台提交生成请求，后台立即落任务与事件记录。',
              '根据后台积分规则决定是否预扣并记录流水。',
              '任务成功后生成模型，失败或超时则进入异常处理。',
              '订单、支付、积分与用户数据继续由后台统一追踪。',
            ]}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: '1fr 1fr' }}>
        <div style={panelStyle}>
          <div style={{ marginBottom: 16 }}>
            <p style={headingMetaStyle}>运营筛查</p>
            <h2 style={{ fontSize: 26, margin: '6px 0 0' }}>异常任务与订单</h2>
            <p style={{ color: colors.slate, fontSize: 13, lineHeight: 1.7, margin: '8px 0 0' }}>
              优先把失败任务、待支付订单、退款/失败支付放到同一块，减少运营在多个集合之间来回切换。
            </p>
          </div>
          <div style={{ display: 'grid', gap: 16 }}>
            <QueueList
              emptyText="当前没有失败或超时任务。"
              items={data.operatorQueues.failedTasks.docs}
              linkLabel={`失败任务 ${data.operatorQueues.failedTasks.count}`}
              linkPrefix="/admin/collections/generation-tasks"
              renderMeta={(item) => `${formatTaskStatus(item.status)} · ${formatDateTime(item.updatedAt)} · ${item.user?.email || '未关联用户'}`}
              title="失败任务队列"
            />
            <QueueList
              emptyText="当前没有待跟进订单。"
              items={data.operatorQueues.pendingOrders.docs}
              linkLabel={`异常订单 ${data.operatorQueues.pendingOrders.count}`}
              linkPrefix="/admin/collections/print-orders"
              renderMeta={(item) =>
                `${formatOrderStatus(item.status)} / ${getPaymentStatusLabel(item.paymentStatus)} · ${item.user?.email || '未关联用户'}`
              }
              title="订单异常队列"
            />
          </div>
        </div>

        <div style={panelStyle}>
          <div style={{ marginBottom: 16 }}>
            <p style={headingMetaStyle}>运营筛查</p>
            <h2 style={{ fontSize: 26, margin: '6px 0 0' }}>支付与余额关注名单</h2>
            <p style={{ color: colors.slate, fontSize: 13, lineHeight: 1.7, margin: '8px 0 0' }}>
              运营可直接查看支付异常和高/低余额账户，优先做人工排查、提醒和后续跟进。
            </p>
          </div>
          <div style={{ display: 'grid', gap: 16 }}>
            <QueueList
              emptyText="当前没有支付异常记录。"
              items={data.operatorQueues.paymentExceptions.docs}
              linkLabel={`支付异常 ${data.operatorQueues.paymentExceptions.count}`}
              linkPrefix="/admin/collections/shopify-payments"
              renderMeta={(item) => `${getPaymentStatusLabel(item.status)} · ${item.user?.email || '未关联用户'} · ${item.amount ?? 0} ${item.currency ?? 'USD'}`}
              title="支付异常队列"
            />
            <div style={{ display: 'grid', gap: 16, gridTemplateColumns: '1fr 1fr' }}>
              <QueueList
                emptyText="当前没有低余额账户。"
                items={data.operatorQueues.lowBalanceAccounts.docs}
                linkLabel={`低余额 ${data.operatorQueues.lowBalanceAccounts.count}`}
                linkPrefix="/admin/collections/credits"
                renderMeta={(item) => `余额 ${item.balance ?? 0} · 预扣 ${item.reservedBalance ?? 0} · ${item.user?.email || '未关联用户'}`}
                title="低余额账户"
              />
              <QueueList
                emptyText="当前没有高余额账户。"
                items={data.operatorQueues.highBalanceAccounts.docs}
                linkLabel={`高余额 ${data.operatorQueues.highBalanceAccounts.count}`}
                linkPrefix="/admin/collections/credits"
                renderMeta={(item) => `余额 ${item.balance ?? 0} · 预扣 ${item.reservedBalance ?? 0} · ${item.user?.email || '未关联用户'}`}
                title="高余额账户"
              />
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: '1fr 1fr' }}>
        <div style={panelStyle}>
          <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <div>
              <p style={headingMetaStyle}>商务</p>
              <h2 style={{ fontSize: 24, margin: '6px 0 0' }}>订单运营面板</h2>
            </div>
            <Link href="/admin/collections/print-orders" style={{ color: colors.blue, fontSize: 13, fontWeight: 700 }}>
              进入订单管理
            </Link>
          </div>
          <div style={{ display: 'grid', gap: 12 }}>
            {data.recentOrders.length > 0 ? (
              data.recentOrders.map((order: any) => (
                <div key={order.id} style={{ border: `1px solid ${colors.border}`, borderRadius: 14, padding: 14 }}>
                  <div style={{ alignItems: 'start', display: 'flex', gap: 12, justifyContent: 'space-between' }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 700 }}>{order.orderNumber}</div>
                      <div style={{ color: colors.slate, fontSize: 13, marginTop: 6 }}>{order.model?.title || '未关联模型'}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <StatusBadge label={formatOrderStatus(order.status)} tone={getStatusTone(order.status)} />
                      <div style={{ color: colors.slate, fontSize: 13, marginTop: 8 }}>
                        {order.amount ?? 0} {order.currency ?? 'USD'}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ background: colors.subtle, border: `1px dashed ${colors.border}`, borderRadius: 14, color: colors.slate, padding: 20 }}>
                暂无订单
              </div>
            )}
          </div>
        </div>

        <div style={panelStyle}>
          <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <div>
              <p style={headingMetaStyle}>积分</p>
              <h2 style={{ fontSize: 24, margin: '6px 0 0' }}>用户积分面板</h2>
            </div>
            <Link href="/admin/collections/credits" style={{ color: colors.blue, fontSize: 13, fontWeight: 700 }}>
              进入积分账户
            </Link>
          </div>
          <div style={{ display: 'grid', gap: 12 }}>
            {data.topCreditAccounts.length > 0 ? (
              data.topCreditAccounts.map((account: any) => (
                <div key={account.id} style={{ border: `1px solid ${colors.border}`, borderRadius: 14, padding: 14 }}>
                  <div style={{ alignItems: 'start', display: 'flex', gap: 12, justifyContent: 'space-between' }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 700 }}>{account.user?.email || account.accountLabel}</div>
                      <div style={{ color: colors.slate, fontSize: 13, marginTop: 6 }}>预扣：{account.reservedBalance ?? 0}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.04em' }}>{account.balance ?? 0}</div>
                      <div style={{ color: colors.slate, fontSize: 13, marginTop: 6 }}>累计消费：{account.lifetimeSpent ?? 0}</div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ background: colors.subtle, border: `1px dashed ${colors.border}`, borderRadius: 14, color: colors.slate, padding: 20 }}>
                暂无积分账户
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: '1fr 1fr' }}>
        <div style={panelStyle}>
          <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <div>
              <p style={headingMetaStyle}>AI 生产</p>
              <h2 style={{ fontSize: 24, margin: '6px 0 0' }}>最近任务</h2>
            </div>
            <Link href="/admin/collections/generation-tasks" style={{ color: colors.blue, fontSize: 13, fontWeight: 700 }}>
              查看全部
            </Link>
          </div>
          <div style={{ display: 'grid', gap: 12 }}>
            {data.recentTasks.length > 0 ? (
              data.recentTasks.map((task: any) => (
                <div key={task.id} style={{ border: `1px solid ${colors.border}`, borderRadius: 14, padding: 14 }}>
                  <div style={{ alignItems: 'start', display: 'flex', gap: 12, justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700 }}>{task.taskCode}</div>
                      <div style={{ color: colors.slate, fontSize: 13, marginTop: 6 }}>
                        {formatInputMode(task.inputMode)} · {task.progress ?? 0}%
                      </div>
                    </div>
                    <StatusBadge label={formatTaskStatus(task.status)} tone={getStatusTone(task.status)} />
                  </div>
                </div>
              ))
            ) : (
              <div style={{ background: colors.subtle, border: `1px dashed ${colors.border}`, borderRadius: 14, color: colors.slate, padding: 20 }}>
                暂无任务
              </div>
            )}
          </div>
        </div>

        <div style={panelStyle}>
          <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <div>
              <p style={headingMetaStyle}>支付</p>
              <h2 style={{ fontSize: 24, margin: '6px 0 0' }}>最近支付</h2>
            </div>
            <Link href="/admin/collections/shopify-payments" style={{ color: colors.blue, fontSize: 13, fontWeight: 700 }}>
              查看全部
            </Link>
          </div>
          <div style={{ display: 'grid', gap: 12 }}>
            {data.recentPayments.length > 0 ? (
              data.recentPayments.map((payment: any) => (
                <div key={payment.id} style={{ border: `1px solid ${colors.border}`, borderRadius: 14, padding: 14 }}>
                  <div style={{ alignItems: 'start', display: 'flex', gap: 12, justifyContent: 'space-between' }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 700 }}>{payment.checkoutReference}</div>
                      <div style={{ color: colors.slate, fontSize: 13, marginTop: 6 }}>{payment.user?.email || '未知用户'}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <StatusBadge label={getPaymentStatusLabel(payment.status)} tone={getStatusTone(payment.status)} />
                      <div style={{ color: colors.slate, fontSize: 13, marginTop: 8 }}>
                        {payment.amount ?? 0} {payment.currency ?? 'USD'}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ background: colors.subtle, border: `1px dashed ${colors.border}`, borderRadius: 14, color: colors.slate, padding: 20 }}>
                暂无支付记录
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export const OpsDashboard = OpsDashboardView
