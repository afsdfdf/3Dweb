import type { PayloadRequest } from 'payload'

import { getEmailSettings } from '@/lib/emailSettings'

const getAppURL = () => process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

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

export const generateVerifyEmailHTML = async ({ req, token, user }: { req: PayloadRequest; token: string; user: any }) => {
  const appURL = getAppURL()
  const settings = await getEmailSettings(req)
  const displayName = typeof user?.fullName === 'string' && user.fullName.trim() ? user.fullName.trim() : user?.email || '用户'
  const verifyURL = `${appURL}/verify-email/${token}`

  return renderEmailShell({
    body: `
      <p>你好，${displayName}：</p>
      <p>${settings.templates.verify.intro}</p>
      <p>
        <a href="${verifyURL}" style="display:inline-block;padding:10px 16px;background:#111827;color:#fff;text-decoration:none;border-radius:8px;">
          ${settings.templates.verify.ctaLabel}
        </a>
      </p>
      <p>如果按钮无法点击，可复制这个链接到浏览器打开：</p>
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

export const generateForgotPasswordEmailHTML = async (args?: { req?: PayloadRequest; token?: string; user?: any }) => {
  const { req, token, user } = args || {}
  const appURL = getAppURL()
  const settings = req
    ? await getEmailSettings(req)
    : {
        branding: { footerText: 'MiniForge AI 3D', productName: 'MiniForge AI 3D' },
        sender: { fromAddress: 'no-reply@miniforge.local', fromName: 'MiniForge AI 3D', replyTo: '' },
        templates: {
          forgotPassword: {
            ctaLabel: '重置密码',
            intro: '我们收到了你的密码重置请求。点击下面按钮即可设置新密码。',
            subject: 'MiniForge 密码重置',
          },
          orderPaid: { ctaLabel: '查看订单详情', intro: '', subject: '' },
          subscriptionSuccess: { ctaLabel: '查看积分与订阅', intro: '', subject: '' },
          verify: { ctaLabel: '验证邮箱', intro: '', subject: '' },
          welcome: { ctaLabel: '进入 Studio', intro: '', subject: '' },
        },
      }
  const resetURL = `${appURL}/reset-password?token=${encodeURIComponent(String(token || ''))}`
  const displayName = typeof user?.fullName === 'string' && user.fullName.trim() ? user.fullName.trim() : user?.email || '用户'

  return renderEmailShell({
    body: `
      <p>你好，${displayName}：</p>
      <p>${settings.templates.forgotPassword.intro}</p>
      <p>
        <a href="${resetURL}" style="display:inline-block;padding:10px 16px;background:#111827;color:#fff;text-decoration:none;border-radius:8px;">
          ${settings.templates.forgotPassword.ctaLabel}
        </a>
      </p>
      <p>如果按钮无法点击，可复制这个链接到浏览器打开：</p>
      <p><a href="${resetURL}">${resetURL}</a></p>
      <p>如果不是你本人发起，请忽略此邮件。</p>
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

  return 'MiniForge 密码重置'
}
