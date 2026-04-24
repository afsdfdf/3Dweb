import type { CSSProperties } from 'react'

import Link from 'next/link'

import { getOpsDashboardData } from '@/lib/adminDashboard'
import { getAdminLocale } from '@/lib/adminText'

const colors = {
  border: 'rgba(15, 23, 42, 0.08)',
  panel: '#ffffff',
  slate: '#64748b',
  soft: '#f8fafc',
  text: '#0f172a',
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

const headingStyle: CSSProperties = {
  color: colors.slate,
  fontSize: 13,
  fontWeight: 700,
  letterSpacing: '0.05em',
  margin: 0,
  textTransform: 'uppercase',
}

const pillStyle: CSSProperties = {
  background: colors.soft,
  border: `1px solid ${colors.border}`,
  borderRadius: 999,
  color: colors.text,
  fontSize: 13,
  fontWeight: 600,
  padding: '8px 14px',
  textDecoration: 'none',
}

const copy = {
  en: {
    accountFallback: 'Unknown user',
    dashboard: 'Operations overview',
    generatedAt: 'Generated at',
    intro:
      'This overview keeps tasks, payments, orders, and credits on one screen so operators can spot exceptions before they spread.',
    metrics: {
      failedTasks: 'Failed tasks',
      highBalanceAccounts: 'High-balance accounts',
      newTasksToday: 'New tasks today',
      pendingOrders: 'Pending orders',
      processingTasks: 'Active queue',
    },
    nav: {
      ai: 'AI Production',
      aiProviders: 'AI provider settings',
      announcements: 'Announcements',
      credits: 'Credit accounts',
      media: 'Media assets',
      models: 'Models',
      orders: 'Print orders',
      payments: 'Payments',
      platform: 'Platform',
      posts: 'Posts & events',
      settings: 'Site settings',
      users: 'Users',
    },
    quickLinks: 'Quick links',
    queues: {
      failedTasks: 'Failed task queue',
      highBalance: 'High-balance accounts',
      lowBalance: 'Low-balance accounts',
      pendingOrders: 'Orders needing follow-up',
      paymentExceptions: 'Payment exceptions',
    },
    recent: {
      credits: 'Top credit accounts',
      orders: 'Recent orders',
      payments: 'Recent payments',
      tasks: 'Recent tasks',
    },
    statuses: {
      order: {
        cancelled: 'Cancelled',
        completed: 'Completed',
        inProduction: 'In production',
        paid: 'Paid',
        pendingPayment: 'Pending payment',
        shipped: 'Shipped',
        unknown: 'Unknown',
      },
      payment: {
        failed: 'Failed',
        paid: 'Paid',
        pending: 'Pending',
        refunded: 'Refunded',
        unknown: 'Unknown',
      },
      task: {
        failed: 'Failed',
        processing: 'Processing',
        queued: 'Queued',
        succeeded: 'Succeeded',
        timeout: 'Timed out',
        unknown: 'Unknown',
      },
    },
    subtitle: 'Tasks, orders, payments, and credits',
    title: 'Operations dashboard',
    viewAll: 'View all',
  },
  zh: {
    accountFallback: '未知用户',
    dashboard: '运营总览',
    generatedAt: '生成时间',
    intro: '把任务、支付、订单和积分放到同一张看板上，方便运营优先处理异常。',
    metrics: {
      failedTasks: '失败任务',
      highBalanceAccounts: '高余额账户',
      newTasksToday: '今日新任务',
      pendingOrders: '待推进订单',
      processingTasks: '当前队列',
    },
    nav: {
      ai: 'AI 生产',
      aiProviders: 'AI 提供方设置',
      announcements: '公告',
      credits: '积分账户',
      media: '媒体资源',
      models: '模型',
      orders: '打印订单',
      payments: '支付记录',
      platform: '平台',
      posts: '文章与活动',
      settings: '站点设置',
      users: '用户',
    },
    quickLinks: '快捷入口',
    queues: {
      failedTasks: '失败任务队列',
      highBalance: '高余额账户',
      lowBalance: '低余额账户',
      pendingOrders: '待跟进订单',
      paymentExceptions: '支付异常',
    },
    recent: {
      credits: '高余额账户',
      orders: '最近订单',
      payments: '最近支付',
      tasks: '最近任务',
    },
    statuses: {
      order: {
        cancelled: '已取消',
        completed: '已完成',
        inProduction: '生产中',
        paid: '已支付',
        pendingPayment: '待支付',
        shipped: '已发货',
        unknown: '未知',
      },
      payment: {
        failed: '失败',
        paid: '已支付',
        pending: '待支付',
        refunded: '已退款',
        unknown: '未知',
      },
      task: {
        failed: '失败',
        processing: '处理中',
        queued: '排队中',
        succeeded: '已完成',
        timeout: '超时',
        unknown: '未知',
      },
    },
    subtitle: '任务、订单、支付与积分',
    title: '运营仪表板',
    viewAll: '查看全部',
  },
} as const

type DashboardProps = {
  i18n?: {
    language?: null | string
  } | null
}

const formatDateTime = (value?: null | string, language: 'en' | 'zh' = 'en') => {
  if (!value) {
    return language === 'zh' ? '刚刚' : 'Just now'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat(language === 'zh' ? 'zh-CN' : 'en-US', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: '2-digit',
  }).format(date)
}

const formatTaskStatus = (status?: null | string, language: 'en' | 'zh' = 'en') => {
  const source = copy[language].statuses.task

  switch (status) {
    case 'queued':
      return source.queued
    case 'processing':
      return source.processing
    case 'succeeded':
      return source.succeeded
    case 'failed':
      return source.failed
    case 'timeout':
      return source.timeout
    default:
      return source.unknown
  }
}

const formatOrderStatus = (status?: null | string, language: 'en' | 'zh' = 'en') => {
  const source = copy[language].statuses.order

  switch (status) {
    case 'pending-payment':
      return source.pendingPayment
    case 'paid':
      return source.paid
    case 'in-production':
      return source.inProduction
    case 'shipped':
      return source.shipped
    case 'completed':
      return source.completed
    case 'cancelled':
      return source.cancelled
    default:
      return source.unknown
  }
}

const formatPaymentStatus = (status?: null | string, language: 'en' | 'zh' = 'en') => {
  const source = copy[language].statuses.payment

  switch (status) {
    case 'pending':
      return source.pending
    case 'paid':
      return source.paid
    case 'failed':
      return source.failed
    case 'refunded':
      return source.refunded
    default:
      return source.unknown
  }
}

function MetricCard({ label, note, value }: { label: string; note: string; value: number }) {
  return (
    <div
      style={{
        ...panelStyle,
        padding: 18,
      }}
    >
      <div style={{ color: colors.slate, fontSize: 12 }}>{note}</div>
      <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.04em', marginTop: 10 }}>{value}</div>
      <div style={{ color: colors.text, fontSize: 14, fontWeight: 700, marginTop: 6 }}>{label}</div>
    </div>
  )
}

function QueueList({
  emptyText,
  items,
  linkPrefix,
  locale,
  renderMeta,
  title,
  viewAll,
}: {
  emptyText: string
  items: any[]
  linkPrefix: string
  locale: 'en' | 'zh'
  renderMeta: (item: any) => string
  title: string
  viewAll: string
}) {
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between' }}>
        <h3 style={{ fontSize: 18, margin: 0 }}>{title}</h3>
        <Link href={linkPrefix} style={{ color: '#2563eb', fontSize: 13, fontWeight: 700 }}>
          {viewAll}
        </Link>
      </div>

      {items.length > 0 ? (
        items.map((item) => (
          <div
            key={`${title}-${item.id}`}
            style={{
              background: colors.soft,
              border: `1px solid ${colors.border}`,
              borderRadius: 14,
              display: 'grid',
              gap: 8,
              padding: '12px 14px',
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 700 }}>
              {item.taskCode || item.orderNumber || item.checkoutReference || item.user?.email || item.accountLabel || `#${item.id}`}
            </div>
            <div style={{ color: colors.slate, fontSize: 12 }}>{renderMeta(item)}</div>
            <div>
              <Link href={`${linkPrefix}/${item.id}`} style={pillStyle}>
                {copy[locale].viewAll}
              </Link>
            </div>
          </div>
        ))
      ) : (
        <div
          style={{
            background: colors.soft,
            border: `1px dashed ${colors.border}`,
            borderRadius: 14,
            color: colors.slate,
            padding: 16,
          }}
        >
          {emptyText}
        </div>
      )}
    </div>
  )
}

export async function OpsDashboardView(props: DashboardProps) {
  const locale = getAdminLocale(props)
  const text = copy[locale]
  const data = await getOpsDashboardData()

  const quickLinkGroups = [
    {
      links: [
        { href: '/admin/collections/generation-tasks', label: text.nav.ai },
        { href: '/admin/collections/models', label: text.nav.models },
        { href: '/admin/globals/ai-provider-settings', label: text.nav.aiProviders },
      ],
      title: text.nav.ai,
    },
    {
      links: [
        { href: '/admin/collections/print-orders', label: text.nav.orders },
        { href: '/admin/collections/shopify-payments', label: text.nav.payments },
        { href: '/admin/collections/credits', label: text.nav.credits },
      ],
      title: locale === 'zh' ? '商务' : 'Commerce',
    },
    {
      links: [
        { href: '/admin/collections/users', label: text.nav.users },
        { href: '/admin/collections/media', label: text.nav.media },
        { href: '/admin/collections/posts', label: text.nav.posts },
        { href: '/admin/collections/announcements', label: text.nav.announcements },
        { href: '/admin/globals/site-settings', label: text.nav.settings },
      ],
      title: text.nav.platform,
    },
  ]

  return (
    <div style={shellStyle}>
      <div
        style={{
          ...panelStyle,
          background: 'linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)',
          display: 'grid',
          gap: 12,
        }}
      >
        <p style={headingStyle}>{text.dashboard}</p>
        <div>
          <h1 style={{ fontSize: 34, letterSpacing: '-0.04em', lineHeight: 1.08, margin: 0 }}>{text.title}</h1>
          <p style={{ color: colors.text, fontSize: 16, fontWeight: 700, margin: '10px 0 0' }}>{text.subtitle}</p>
          <p style={{ color: colors.slate, lineHeight: 1.8, margin: '12px 0 0', maxWidth: 920 }}>{text.intro}</p>
        </div>
        <div style={{ color: colors.slate, fontSize: 13 }}>
          {text.generatedAt}: {formatDateTime(data.generatedAt, locale)}
        </div>
      </div>

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(5, minmax(0, 1fr))' }}>
        <MetricCard label={text.metrics.newTasksToday} note={text.subtitle} value={data.overview.newTasksToday} />
        <MetricCard label={text.metrics.processingTasks} note={text.nav.ai} value={data.overview.processingTasks} />
        <MetricCard label={text.metrics.failedTasks} note={text.queues.failedTasks} value={data.overview.failedTasks} />
        <MetricCard label={text.metrics.pendingOrders} note={text.nav.orders} value={data.overview.pendingOrders} />
        <MetricCard
          label={text.metrics.highBalanceAccounts}
          note={text.nav.credits}
          value={data.overview.highBalanceAccounts}
        />
      </div>

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: '1fr 1fr' }}>
        <div style={panelStyle}>
          <p style={headingStyle}>{text.quickLinks}</p>
          <div style={{ display: 'grid', gap: 16, marginTop: 14 }}>
            {quickLinkGroups.map((group) => (
              <div key={group.title}>
                <h2 style={{ fontSize: 18, margin: 0 }}>{group.title}</h2>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 10 }}>
                  {group.links.map((link) => (
                    <Link key={link.href} href={link.href} style={pillStyle}>
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={panelStyle}>
          <p style={headingStyle}>{locale === 'zh' ? '最近动态' : 'Recent activity'}</p>
          <div style={{ display: 'grid', gap: 16, marginTop: 14 }}>
            <QueueList
              emptyText={locale === 'zh' ? '当前没有失败任务。' : 'No failed tasks right now.'}
              items={data.operatorQueues.failedTasks.docs}
              linkPrefix="/admin/collections/generation-tasks"
              locale={locale}
              renderMeta={(item) =>
                `${formatTaskStatus(item.status, locale)} · ${formatDateTime(item.updatedAt, locale)} · ${item.user?.email || text.accountFallback}`
              }
              title={text.recent.tasks}
              viewAll={text.viewAll}
            />
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: '1fr 1fr' }}>
        <div style={panelStyle}>
          <QueueList
            emptyText={text.queues.pendingOrders}
            items={data.operatorQueues.pendingOrders.docs}
            linkPrefix="/admin/collections/print-orders"
            locale={locale}
            renderMeta={(item) =>
              `${formatOrderStatus(item.status, locale)} · ${formatPaymentStatus(item.paymentStatus, locale)} · ${item.user?.email || text.accountFallback}`
            }
            title={text.queues.pendingOrders}
            viewAll={text.viewAll}
          />
        </div>

        <div style={panelStyle}>
          <QueueList
            emptyText={text.queues.paymentExceptions}
            items={data.operatorQueues.paymentExceptions.docs}
            linkPrefix="/admin/collections/shopify-payments"
            locale={locale}
            renderMeta={(item) =>
              `${formatPaymentStatus(item.status, locale)} · ${item.user?.email || text.accountFallback} · ${item.amount ?? 0} ${item.currency ?? 'USD'}`
            }
            title={text.queues.paymentExceptions}
            viewAll={text.viewAll}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: '1fr 1fr 1fr' }}>
        <div style={panelStyle}>
          <QueueList
            emptyText={text.queues.lowBalance}
            items={data.operatorQueues.lowBalanceAccounts.docs}
            linkPrefix="/admin/collections/credits"
            locale={locale}
            renderMeta={(item) =>
              `${text.nav.credits} · ${item.balance ?? 0} · ${item.user?.email || text.accountFallback}`
            }
            title={text.queues.lowBalance}
            viewAll={text.viewAll}
          />
        </div>

        <div style={panelStyle}>
          <QueueList
            emptyText={text.queues.highBalance}
            items={data.operatorQueues.highBalanceAccounts.docs}
            linkPrefix="/admin/collections/credits"
            locale={locale}
            renderMeta={(item) =>
              `${text.nav.credits} · ${item.balance ?? 0} · ${item.user?.email || text.accountFallback}`
            }
            title={text.queues.highBalance}
            viewAll={text.viewAll}
          />
        </div>

        <div style={panelStyle}>
          <div style={{ display: 'grid', gap: 12 }}>
            <p style={headingStyle}>{locale === 'zh' ? '关键数字' : 'Key totals'}</p>
            {[
              `${locale === 'zh' ? '任务总数' : 'Tasks'}: ${data.overview.tasks}`,
              `${locale === 'zh' ? '订单总数' : 'Orders'}: ${data.overview.totalOrders}`,
              `${locale === 'zh' ? '支付记录' : 'Payments'}: ${data.overview.payments}`,
              `${locale === 'zh' ? '积分账户' : 'Credit accounts'}: ${data.overview.creditAccounts}`,
              `${locale === 'zh' ? '模型数量' : 'Models'}: ${data.overview.models}`,
            ].map((line) => (
              <div
                key={line}
                style={{
                  background: colors.soft,
                  border: `1px solid ${colors.border}`,
                  borderRadius: 12,
                  color: colors.text,
                  fontSize: 14,
                  fontWeight: 600,
                  padding: '12px 14px',
                }}
              >
                {line}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: '1fr 1fr 1fr' }}>
        <div style={panelStyle}>
          <QueueList
            emptyText={locale === 'zh' ? '暂无最近订单。' : 'No recent orders yet.'}
            items={data.recentOrders}
            linkPrefix="/admin/collections/print-orders"
            locale={locale}
            renderMeta={(item) =>
              `${formatOrderStatus(item.status, locale)} · ${item.amount ?? 0} ${item.currency ?? 'USD'}`
            }
            title={text.recent.orders}
            viewAll={text.viewAll}
          />
        </div>

        <div style={panelStyle}>
          <QueueList
            emptyText={locale === 'zh' ? '暂无最近支付。' : 'No recent payments yet.'}
            items={data.recentPayments}
            linkPrefix="/admin/collections/shopify-payments"
            locale={locale}
            renderMeta={(item) =>
              `${formatPaymentStatus(item.status, locale)} · ${item.amount ?? 0} ${item.currency ?? 'USD'}`
            }
            title={text.recent.payments}
            viewAll={text.viewAll}
          />
        </div>

        <div style={panelStyle}>
          <QueueList
            emptyText={locale === 'zh' ? '暂无高余额账户。' : 'No top credit accounts yet.'}
            items={data.topCreditAccounts}
            linkPrefix="/admin/collections/credits"
            locale={locale}
            renderMeta={(item) =>
              `${locale === 'zh' ? '余额' : 'Balance'} ${item.balance ?? 0} · ${item.user?.email || text.accountFallback}`
            }
            title={text.recent.credits}
            viewAll={text.viewAll}
          />
        </div>
      </div>
    </div>
  )
}

export const OpsDashboard = OpsDashboardView
