export function formatTaskStatus(status?: string | null) {
  switch (status) {
    case 'draft':
      return '草稿'
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
    case 'cancelled':
      return '已取消'
    default:
      return status || '未知'
  }
}

export function formatOrderStatus(status?: string | null) {
  switch (status) {
    case 'pending':
    case 'pending-payment':
      return '待支付'
    case 'paid':
      return '已支付'
    case 'confirmed':
      return '已确认'
    case 'printing':
    case 'in-production':
      return '生产中'
    case 'shipped':
      return '已发货'
    case 'completed':
      return '已完成'
    case 'cancelled':
      return '已取消'
    default:
      return status || '未知'
  }
}

export function formatModelStatus(status?: string | null) {
  switch (status) {
    case 'draft':
      return '草稿'
    case 'processing':
      return '处理中'
    case 'ready':
      return '可用'
    case 'archived':
      return '已归档'
    default:
      return status || '未知'
  }
}

export function formatInputMode(mode?: string | null) {
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

export function formatCreditType(type?: string | null) {
  switch (type) {
    case 'purchase':
      return '购买充值'
    case 'task_hold':
      return '任务预扣'
    case 'task_spend':
      return '任务扣费'
    case 'download_spend':
      return '下载扣费'
    case 'refund':
      return '退款返还'
    case 'manual_adjustment':
      return '手工调整'
    case 'subscription_grant':
      return '订阅发放'
    default:
      return type || '未知类型'
  }
}

export function formatSubscriptionStatus(status?: string | null) {
  switch (status) {
    case 'active':
      return '已激活'
    case 'trialing':
      return '试用中'
    case 'past_due':
      return '逾期'
    case 'unpaid':
      return '未付款'
    case 'canceled':
      return '已取消'
    case 'incomplete':
      return '待完成'
    case 'incomplete_expired':
      return '已过期'
    default:
      return status || '未知'
  }
}

export function formatRole(role?: string | null) {
  switch (role) {
    case 'admin':
      return '管理员'
    case 'operator':
      return '运营'
    case 'customer':
      return '用户'
    default:
      return role || '未设置'
  }
}

export function formatDateTime(value?: string | null) {
  if (!value) return '—'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)

  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}
