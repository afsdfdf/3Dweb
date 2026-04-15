import type { CollectionAfterChangeHook } from 'payload'

import { getEmailSettings } from '@/lib/emailSettings'

export const sendWelcomeEmail: CollectionAfterChangeHook = async ({ doc, operation, req }) => {
  if (operation !== 'create') {
    return doc
  }

  if (!doc.email || typeof doc.email !== 'string') {
    return doc
  }

  try {
    const appURL = process.env.NEXT_PUBLIC_APP_URL || 'http://127.0.0.1:3000'
    const settings = await getEmailSettings(req)
    const displayName = typeof doc.fullName === 'string' && doc.fullName.trim() ? doc.fullName.trim() : doc.email

    await req.payload.sendEmail({
      from: `"${settings.sender.fromName}" <${settings.sender.fromAddress}>`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a;">
          <h2 style="margin-bottom: 12px;">${settings.templates.welcome.subject}</h2>
          <p>你好，${displayName}：</p>
          <p>${settings.templates.welcome.intro}</p>
          <p>
            <a href="${appURL}/generate" style="display:inline-block;padding:10px 16px;background:#111827;color:#fff;text-decoration:none;border-radius:8px;">
              ${settings.templates.welcome.ctaLabel}
            </a>
          </p>
          <p>如果你不是本人注册，请忽略此邮件。</p>
          <hr style="margin: 24px 0; border: none; border-top: 1px solid #e2e8f0;" />
          <p style="font-size:12px;color:#64748b;">${settings.branding.footerText}</p>
        </div>
      `,
      replyTo: settings.sender.replyTo || undefined,
      subject: settings.templates.welcome.subject,
      to: doc.email,
    })
  } catch (error) {
    req.payload.logger.error({
      err: error,
      msg: `Failed to send welcome email to ${doc.email}`,
    })
  }

  return doc
}
