import type { PayloadRequest } from 'payload'

import { getEmailSettings } from '@/lib/emailSettings'
import { getCanonicalAppURL } from '@/lib/getCanonicalAppURL'

const getAppURL = getCanonicalAppURL

const renderEmailShell = (args: { body: string; footerText: string; title: string }) => {
  const { body, footerText, title } = args

  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a; max-width: 640px; margin: 0 auto; padding: 24px;">
      <h2 style="margin: 0 0 16px;">${title}</h2>
      ${body}
      <hr style="margin: 24px 0; border: none; border-top: 1px solid #e2e8f0;" />
      <p style="font-size:12px;color:#64748b;">${footerText}</p>
    </div>
  `
}

const fallbackEmailSettings = {
  branding: { footerText: 'Thorns Tavern', productName: 'Thorns Tavern' },
  sender: { fromAddress: 'no-reply@thornstavern.com', fromName: 'Thorns Tavern', replyTo: '' },
  templates: {
    forgotPassword: {
      ctaLabel: 'Reset password',
      intro: 'We received a request to reset your password. Use the button below to choose a new password.',
      subject: 'Reset your Thorns Tavern password',
    },
    orderPaid: { ctaLabel: 'View order details', intro: '', subject: '' },
    subscriptionSuccess: { ctaLabel: 'View credits and subscription', intro: '', subject: '' },
    verify: { ctaLabel: 'Verify email', intro: '', subject: '' },
    welcome: { ctaLabel: 'Open Studio', intro: '', subject: '' },
  },
}

const getDisplayName = (user: any) => {
  return typeof user?.fullName === 'string' && user.fullName.trim() ? user.fullName.trim() : user?.email || 'user'
}

export const generateVerifyEmailHTML = async ({ req, token, user }: { req: PayloadRequest; token: string; user: any }) => {
  const appURL = getAppURL()
  const settings = await getEmailSettings(req)
  const displayName = getDisplayName(user)
  const verifyURL = `${appURL}/verify-email/${token}`

  return renderEmailShell({
    body: `
      <p>Hello, ${displayName}:</p>
      <p>${settings.templates.verify.intro}</p>
      <p>
        <a href="${verifyURL}" style="display:inline-block;padding:10px 16px;background:#111827;color:#fff;text-decoration:none;border-radius:8px;">
          ${settings.templates.verify.ctaLabel}
        </a>
      </p>
      <p>If the button does not work, copy this link into your browser:</p>
      <p><a href="${verifyURL}">${verifyURL}</a></p>
    `,
    footerText: settings.branding.footerText,
    title: settings.templates.verify.subject,
  })
}

export const generateVerifyEmailSubject = async ({ req }: { req: PayloadRequest; token: string; user: any }) => {
  const settings = await getEmailSettings(req)
  return settings.templates.verify.subject
}

export const generateRegistrationCodeEmailHTML = async ({
  code,
  expiresMinutes,
  req,
}: {
  code: string
  expiresMinutes: number
  req: PayloadRequest
}) => {
  const settings = await getEmailSettings(req)

  return renderEmailShell({
    body: `
      <p>Use this verification code to finish creating your Thorns Tavern account:</p>
      <p style="font-size:28px;letter-spacing:6px;font-weight:700;margin:18px 0;">${code}</p>
      <p>This code expires in ${expiresMinutes} minutes. If you did not request it, you can ignore this email.</p>
    `,
    footerText: settings.branding.footerText,
    title: 'Your Thorns Tavern verification code',
  })
}

export const generateRegistrationCodeEmailSubject = async ({ req }: { req: PayloadRequest }) => {
  const settings = await getEmailSettings(req)
  return `${settings.branding.productName} verification code`
}

export const generateForgotPasswordEmailHTML = async (args?: { req?: PayloadRequest; token?: string; user?: any }) => {
  const { req, token, user } = args || {}
  const appURL = getAppURL()
  const settings = req ? await getEmailSettings(req) : fallbackEmailSettings
  const resetURL = `${appURL}/reset-password?token=${encodeURIComponent(String(token || ''))}`
  const displayName = getDisplayName(user)

  return renderEmailShell({
    body: `
      <p>Hello, ${displayName}:</p>
      <p>${settings.templates.forgotPassword.intro}</p>
      <p>
        <a href="${resetURL}" style="display:inline-block;padding:10px 16px;background:#111827;color:#fff;text-decoration:none;border-radius:8px;">
          ${settings.templates.forgotPassword.ctaLabel}
        </a>
      </p>
      <p>If the button does not work, copy this link into your browser:</p>
      <p><a href="${resetURL}">${resetURL}</a></p>
      <p>If you did not request this, you can ignore this email.</p>
    `,
    footerText: settings.branding.footerText,
    title: settings.templates.forgotPassword.subject,
  })
}

export const generateForgotPasswordEmailSubject = async (args?: { req?: PayloadRequest; token?: string; user?: any }) => {
  if (args?.req) {
    const settings = await getEmailSettings(args.req)
    return settings.templates.forgotPassword.subject
  }

  return 'Reset your Thorns Tavern password'
}
