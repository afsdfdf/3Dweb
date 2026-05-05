import type { CSSProperties } from 'react'

import Link from 'next/link'

import { getOpsDashboardData } from '@/lib/adminDashboard'
import { getAdminPhraseLocale, getLocalizedAdminPhrase, type AdminPhraseLocale } from '@/lib/adminPhrase'

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

const statusLabels = {
  order: {
    cancelled: 'Cancelled',
    completed: 'Completed',
    'in-production': 'In production',
    paid: 'Paid',
    'pending-payment': 'Pending payment',
    shipped: 'Shipped',
  },
  payment: {
    failed: 'Failed',
    paid: 'Paid',
    pending: 'Pending',
    refunded: 'Refunded',
  },
  task: {
    failed: 'Failed',
    processing: 'Processing',
    queued: 'Queued',
    succeeded: 'Succeeded',
    timeout: 'Timed out',
  },
} as const

const formatDateTime = (value: null | string | undefined, locale: AdminPhraseLocale) => {
  if (!value) {
    return getLocalizedAdminPhrase('Just now', locale)
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat(locale === 'zh' ? 'zh-CN' : 'en-US', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: '2-digit',
  }).format(date)
}

const formatTaskStatus = (status: null | string | undefined, locale: AdminPhraseLocale) =>
  getLocalizedAdminPhrase(statusLabels.task[status as keyof typeof statusLabels.task] || 'Unknown', locale)

const formatOrderStatus = (status: null | string | undefined, locale: AdminPhraseLocale) =>
  getLocalizedAdminPhrase(statusLabels.order[status as keyof typeof statusLabels.order] || 'Unknown', locale)

const formatPaymentStatus = (status: null | string | undefined, locale: AdminPhraseLocale) =>
  getLocalizedAdminPhrase(statusLabels.payment[status as keyof typeof statusLabels.payment] || 'Unknown', locale)

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
  renderMeta,
  text,
  title,
}: {
  emptyText: string
  items: any[]
  linkPrefix: string
  renderMeta: (item: any) => string
  text: (value: string) => string
  title: string
}) {
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between' }}>
        <h3 style={{ fontSize: 18, margin: 0 }}>{title}</h3>
        <Link href={linkPrefix} style={{ color: '#2563eb', fontSize: 13, fontWeight: 700 }}>
          {text('View all')}
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
                {text('View')}
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

export async function OpsDashboardView(props: { i18n?: { language?: string } } = {}) {
  const data = await getOpsDashboardData()
  const locale = getAdminPhraseLocale(props.i18n?.language)
  const text = (value: string) => getLocalizedAdminPhrase(value, locale)

  const quickLinkGroups = [
    {
      links: [
        { href: '/admin/collections/generation-tasks', label: text('AI Production') },
        { href: '/admin/collections/models', label: text('Models') },
        { href: '/admin/globals/ai-provider-settings', label: text('AI provider settings') },
      ],
      title: text('AI Production'),
    },
    {
      links: [
        { href: '/admin/collections/print-orders', label: text('Print orders') },
        { href: '/admin/collections/shopify-payments', label: text('Payments') },
        { href: '/admin/collections/credits', label: text('Credit accounts') },
      ],
      title: text('Commerce'),
    },
    {
      links: [
        { href: '/admin/collections/users', label: text('Users') },
        { href: '/admin/collections/media', label: text('Media assets') },
        { href: '/admin/collections/posts', label: text('Posts and events') },
        { href: '/admin/collections/announcements', label: text('Announcements') },
        { href: '/admin/globals/site-settings', label: text('Site settings') },
      ],
      title: text('Platform'),
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
        <p style={headingStyle}>{text('Operations overview')}</p>
        <div>
          <h1 style={{ fontSize: 34, letterSpacing: '-0.04em', lineHeight: 1.08, margin: 0 }}>{text('Operations dashboard')}</h1>
          <p style={{ color: colors.text, fontSize: 16, fontWeight: 700, margin: '10px 0 0' }}>
            {text('Tasks, orders, payments, and credits')}
          </p>
          <p style={{ color: colors.slate, lineHeight: 1.8, margin: '12px 0 0', maxWidth: 920 }}>
            {text('This overview keeps tasks, payments, orders, and credits on one screen so operators can spot exceptions early.')}
          </p>
        </div>
        <div style={{ color: colors.slate, fontSize: 13 }}>
          {text('Generated at')}: {formatDateTime(data.generatedAt, locale)}
        </div>
      </div>

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(5, minmax(0, 1fr))' }}>
        <MetricCard label={text('New tasks today')} note={text('Tasks')} value={data.overview.newTasksToday} />
        <MetricCard label={text('Active queue')} note={text('AI Production')} value={data.overview.processingTasks} />
        <MetricCard label={text('Failed tasks')} note={text('Failed task queue')} value={data.overview.failedTasks} />
        <MetricCard label={text('Pending orders')} note={text('Print orders')} value={data.overview.pendingOrders} />
        <MetricCard label={text('High-balance accounts')} note={text('Credit accounts')} value={data.overview.highBalanceAccounts} />
      </div>

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: '1fr 1fr' }}>
        <div style={panelStyle}>
          <p style={headingStyle}>{text('Quick links')}</p>
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
          <p style={headingStyle}>{text('Recent activity')}</p>
          <div style={{ display: 'grid', gap: 16, marginTop: 14 }}>
            <QueueList
              emptyText={text('No failed tasks right now.')}
              items={data.operatorQueues.failedTasks.docs}
              linkPrefix="/admin/collections/generation-tasks"
              renderMeta={(item) =>
                `${formatTaskStatus(item.status, locale)} | ${formatDateTime(item.updatedAt, locale)} | ${item.user?.email || text('Unknown user')}`
              }
              text={text}
              title={text('Recent tasks')}
            />
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: '1fr 1fr' }}>
        <div style={panelStyle}>
          <QueueList
            emptyText={text('There are no orders needing follow-up right now.')}
            items={data.operatorQueues.pendingOrders.docs}
            linkPrefix="/admin/collections/print-orders"
            renderMeta={(item) =>
              `${formatOrderStatus(item.status, locale)} | ${formatPaymentStatus(item.paymentStatus, locale)} | ${item.user?.email || text('Unknown user')}`
            }
            text={text}
            title={text('Orders needing follow-up')}
          />
        </div>

        <div style={panelStyle}>
          <QueueList
            emptyText={text('There are no payment exceptions right now.')}
            items={data.operatorQueues.paymentExceptions.docs}
            linkPrefix="/admin/collections/shopify-payments"
            renderMeta={(item) =>
              `${formatPaymentStatus(item.status, locale)} | ${item.user?.email || text('Unknown user')} | ${item.amount ?? 0} ${item.currency ?? 'USD'}`
            }
            text={text}
            title={text('Payment exceptions')}
          />
        </div>
      </div>
    </div>
  )
}

export const OpsDashboard = OpsDashboardView
