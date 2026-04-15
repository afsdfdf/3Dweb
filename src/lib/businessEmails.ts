import type { PayloadRequest } from 'payload'

import { getEmailSettings } from '@/lib/emailSettings'

const getAppURL = () => process.env.NEXT_PUBLIC_APP_URL || 'http://127.0.0.1:3000'

const renderShell = (title: string, content: string) => `
  <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a; max-width: 640px; margin: 0 auto; padding: 24px;">
    <h2 style="margin: 0 0 16px;">${title}</h2>
    ${content}
    <hr style="margin: 24px 0; border: none; border-top: 1px solid #e2e8f0;" />
    <p style="font-size:12px;color:#64748b;">MiniForge AI 3D</p>
  </div>
`

export async function sendSubscriptionSuccessEmail(args: {
  currentPeriodEnd?: string | null
  email: string
  monthlyCredits: number
  planLabel: string
  req: PayloadRequest
}) {
  const { currentPeriodEnd, email, monthlyCredits, planLabel, req } = args
  const appURL = getAppURL()
  const settings = await getEmailSettings(req)

  await req.payload.sendEmail({
    from: `"${settings.sender.fromName}" <${settings.sender.fromAddress}>`,
    html: renderShell(
      settings.templates.subscriptionSuccess.subject,
      `
        <p>你的 <strong>${planLabel}</strong> 已经开通成功。</p>
        <p>${settings.templates.subscriptionSuccess.intro}</p>
        <p>本期已到账积分：<strong>${monthlyCredits}</strong></p>
        <p>当前周期结束时间：${currentPeriodEnd || '—'}</p>
        <p>
          <a href="${appURL}/dashboard/credits" style="display:inline-block;padding:10px 16px;background:#111827;color:#fff;text-decoration:none;border-radius:8px;">
            ${settings.templates.subscriptionSuccess.ctaLabel}
          </a>
        </p>
      `,
    ),
    replyTo: settings.sender.replyTo || undefined,
    subject: `${settings.templates.subscriptionSuccess.subject} - ${planLabel}`,
    to: email,
  })
}

export async function sendOrderPaidEmail(args: {
  amount: number
  currency?: string | null
  email: string
  modelTitle?: string
  orderId: number | string
  orderNumber: string
  req: PayloadRequest
}) {
  const { amount, currency, email, modelTitle, orderId, orderNumber, req } = args
  const appURL = getAppURL()
  const settings = await getEmailSettings(req)

  await req.payload.sendEmail({
    from: `"${settings.sender.fromName}" <${settings.sender.fromAddress}>`,
    html: renderShell(
      settings.templates.orderPaid.subject,
      `
        <p>你的打印订单 <strong>${orderNumber}</strong> 已支付成功。</p>
        <p>${settings.templates.orderPaid.intro}</p>
        <p>模型：${modelTitle || '未命名模型'}</p>
        <p>支付金额：${amount} ${currency || 'USD'}</p>
        <p>
          <a href="${appURL}/dashboard/orders/${orderId}" style="display:inline-block;padding:10px 16px;background:#111827;color:#fff;text-decoration:none;border-radius:8px;">
            ${settings.templates.orderPaid.ctaLabel}
          </a>
        </p>
      `,
    ),
    replyTo: settings.sender.replyTo || undefined,
    subject: `${settings.templates.orderPaid.subject} - ${orderNumber}`,
    to: email,
  })
}
