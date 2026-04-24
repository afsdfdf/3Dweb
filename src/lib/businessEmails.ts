import type { PayloadRequest } from 'payload'

import { getEmailSettings } from '@/lib/emailSettings'

const getAppURL = () => process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

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
        <p>Your <strong>${planLabel}</strong> subscription is active.</p>
        <p>${settings.templates.subscriptionSuccess.intro}</p>
        <p>Credits added this period: <strong>${monthlyCredits}</strong></p>
        <p>Current period ends at: ${currentPeriodEnd || '--'}</p>
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
        <p>Your print order <strong>${orderNumber}</strong> has been paid successfully.</p>
        <p>${settings.templates.orderPaid.intro}</p>
        <p>Model: ${modelTitle || 'Unnamed model'}</p>
        <p>Payment amount: ${amount} ${currency || 'USD'}</p>
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
