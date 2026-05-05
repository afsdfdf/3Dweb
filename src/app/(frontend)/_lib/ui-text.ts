import type { Locale } from './locale'

const fallbackLabel = (value: string | null | undefined) => value || 'Unknown'

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
      cancelled: '\u5df2\u53d6\u6d88',
      draft: '\u8349\u7a3f',
      failed: '\u5931\u8d25',
      processing: '\u5904\u7406\u4e2d',
      queued: '\u6392\u961f\u4e2d',
      succeeded: '\u5df2\u5b8c\u6210',
      timeout: '\u5df2\u8d85\u65f6',
    },
  } as const

  return labels[locale][status as keyof (typeof labels)[typeof locale]] || fallbackLabel(status)
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
      cancelled: '\u5df2\u53d6\u6d88',
      completed: '\u5df2\u5b8c\u6210',
      confirmed: '\u5df2\u786e\u8ba4',
      'in-production': '\u751f\u4ea7\u4e2d',
      paid: '\u5df2\u652f\u4ed8',
      pending: '\u5f85\u652f\u4ed8',
      'pending-payment': '\u5f85\u652f\u4ed8',
      printing: '\u751f\u4ea7\u4e2d',
      shipped: '\u5df2\u53d1\u8d27',
    },
  } as const

  return labels[locale][status as keyof (typeof labels)[typeof locale]] || fallbackLabel(status)
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
      archived: '\u5df2\u5f52\u6863',
      draft: '\u8349\u7a3f',
      processing: '\u5904\u7406\u4e2d',
      ready: '\u53ef\u7528',
    },
  } as const

  return labels[locale][status as keyof (typeof labels)[typeof locale]] || fallbackLabel(status)
}

export function formatInputMode(mode?: string | null, locale: Locale = 'en') {
  const labels = {
    en: {
      hybrid: 'Hybrid 3D',
      image: 'Image to 3D',
      text: 'Text to 3D',
    },
    zh: {
      hybrid: '\u56fe\u6587\u6df7\u5408',
      image: '\u56fe\u751f 3D',
      text: '\u6587\u751f 3D',
    },
  } as const

  return labels[locale][mode as keyof (typeof labels)[typeof locale]] || fallbackLabel(mode)
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
      download_spend: '\u4e0b\u8f7d\u6263\u8d39',
      manual_adjustment: '\u624b\u52a8\u8c03\u6574',
      purchase: '\u79ef\u5206\u5145\u503c',
      refund: '\u9000\u6b3e\u8fd4\u8fd8',
      subscription_grant: '\u8ba2\u9605\u53d1\u653e',
      task_hold: '\u4efb\u52a1\u9884\u7559',
      task_spend: '\u4efb\u52a1\u6263\u8d39',
    },
  } as const

  return labels[locale][type as keyof (typeof labels)[typeof locale]] || fallbackLabel(type)
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
      active: '\u5df2\u6fc0\u6d3b',
      canceled: '\u5df2\u53d6\u6d88',
      incomplete: '\u672a\u5b8c\u6210',
      incomplete_expired: '\u5df2\u8fc7\u671f',
      past_due: '\u5df2\u903e\u671f',
      trialing: '\u8bd5\u7528\u4e2d',
      unpaid: '\u672a\u4ed8\u6b3e',
    },
  } as const

  return labels[locale][status as keyof (typeof labels)[typeof locale]] || fallbackLabel(status)
}

export function formatRole(role?: string | null, locale: Locale = 'en') {
  const labels = {
    en: {
      admin: 'Admin',
      customer: 'Customer',
      operator: 'Operator',
    },
    zh: {
      admin: '\u7ba1\u7406\u5458',
      customer: '\u7528\u6237',
      operator: '\u8fd0\u8425',
    },
  } as const

  return labels[locale][role as keyof (typeof labels)[typeof locale]] || fallbackLabel(role)
}

export function getTopNavigationUserMenuText(locale: Locale = 'en') {
  const labels = {
    en: {
      account: 'Account',
      models: 'My models',
      plans: 'Plans',
      signOut: 'Sign out',
      signingOut: 'Signing out...',
    },
    zh: {
      account: '\u4e2a\u4eba\u4e2d\u5fc3',
      models: '\u6211\u7684\u6a21\u578b',
      plans: '\u5957\u9910\u5145\u503c',
      signOut: '\u9000\u51fa\u767b\u5f55',
      signingOut: '\u9000\u51fa\u4e2d...',
    },
  } as const

  return labels[locale]
}

export function formatDateTime(value?: string | null, locale: Locale = 'en') {
  if (!value) return '-'

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
