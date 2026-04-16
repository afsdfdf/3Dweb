import type { Locale } from './locale'

const fallbackLabel = (value: string | null | undefined, locale: Locale) => value || (locale === 'zh' ? '未知' : 'Unknown')

export function formatTaskStatus(status?: string | null, locale: Locale = 'en') {
  const labels = {
    en: {
      cancelled: 'Cancelled',
      draft: 'Draft',
      failed: 'Failed',
      processing: 'Processing',
      queued: 'Queued',
      succeeded: 'Completed',
      timeout: 'Timed out',
    },
    zh: {
      cancelled: '已取消',
      draft: '草稿',
      failed: '失败',
      processing: '处理中',
      queued: '排队中',
      succeeded: '已完成',
      timeout: '超时',
    },
  } as const

  return labels[locale][status as keyof (typeof labels)[typeof locale]] || fallbackLabel(status, locale)
}

export function formatOrderStatus(status?: string | null, locale: Locale = 'en') {
  const labels = {
    en: {
      cancelled: 'Cancelled',
      completed: 'Completed',
      confirmed: 'Confirmed',
      'in-production': 'In production',
      paid: 'Paid',
      pending: 'Pending payment',
      'pending-payment': 'Pending payment',
      printing: 'Printing',
      shipped: 'Shipped',
    },
    zh: {
      cancelled: '已取消',
      completed: '已完成',
      confirmed: '已确认',
      'in-production': '生产中',
      paid: '已支付',
      pending: '待支付',
      'pending-payment': '待支付',
      printing: '生产中',
      shipped: '已发货',
    },
  } as const

  return labels[locale][status as keyof (typeof labels)[typeof locale]] || fallbackLabel(status, locale)
}

export function formatModelStatus(status?: string | null, locale: Locale = 'en') {
  const labels = {
    en: {
      archived: 'Archived',
      draft: 'Draft',
      processing: 'Processing',
      ready: 'Ready',
    },
    zh: {
      archived: '已归档',
      draft: '草稿',
      processing: '处理中',
      ready: '可用',
    },
  } as const

  return labels[locale][status as keyof (typeof labels)[typeof locale]] || fallbackLabel(status, locale)
}

export function formatInputMode(mode?: string | null, locale: Locale = 'en') {
  const labels = {
    en: {
      hybrid: 'Hybrid 3D',
      image: 'Image to 3D',
      text: 'Text to 3D',
    },
    zh: {
      hybrid: '图文混合',
      image: '图生 3D',
      text: '文生 3D',
    },
  } as const

  return labels[locale][mode as keyof (typeof labels)[typeof locale]] || fallbackLabel(mode, locale)
}

export function formatCreditType(type?: string | null, locale: Locale = 'en') {
  const labels = {
    en: {
      download_spend: 'Download charge',
      manual_adjustment: 'Manual adjustment',
      purchase: 'Credit top-up',
      refund: 'Refund',
      subscription_grant: 'Subscription grant',
      task_hold: 'Task hold',
      task_spend: 'Task charge',
    },
    zh: {
      download_spend: '下载扣费',
      manual_adjustment: '手工调整',
      purchase: '购买充值',
      refund: '退款返还',
      subscription_grant: '订阅发放',
      task_hold: '任务预扣',
      task_spend: '任务扣费',
    },
  } as const

  return labels[locale][type as keyof (typeof labels)[typeof locale]] || fallbackLabel(type, locale)
}

export function formatSubscriptionStatus(status?: string | null, locale: Locale = 'en') {
  const labels = {
    en: {
      active: 'Active',
      canceled: 'Canceled',
      incomplete: 'Incomplete',
      incomplete_expired: 'Expired',
      past_due: 'Past due',
      trialing: 'Trialing',
      unpaid: 'Unpaid',
    },
    zh: {
      active: '已激活',
      canceled: '已取消',
      incomplete: '待完成',
      incomplete_expired: '已过期',
      past_due: '逾期',
      trialing: '试用中',
      unpaid: '未付款',
    },
  } as const

  return labels[locale][status as keyof (typeof labels)[typeof locale]] || fallbackLabel(status, locale)
}

export function formatRole(role?: string | null, locale: Locale = 'en') {
  const labels = {
    en: {
      admin: 'Admin',
      customer: 'Customer',
      operator: 'Operator',
    },
    zh: {
      admin: '管理员',
      customer: '用户',
      operator: '运营',
    },
  } as const

  return labels[locale][role as keyof (typeof labels)[typeof locale]] || fallbackLabel(role, locale)
}

export function formatDateTime(value?: string | null, locale: Locale = 'en') {
  if (!value) return locale === 'zh' ? '—' : '—'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)

  return new Intl.DateTimeFormat(locale === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}
