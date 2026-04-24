import type { Payload, PayloadRequest } from 'payload'

type EmailSettingsShape = {
  branding: {
    footerText: string
    productName: string
  }
  sender: {
    fromAddress: string
    fromName: string
    replyTo: string
  }
  templates: {
    forgotPassword: {
      ctaLabel: string
      intro: string
      subject: string
    }
    orderPaid: {
      ctaLabel: string
      intro: string
      subject: string
    }
    subscriptionSuccess: {
      ctaLabel: string
      intro: string
      subject: string
    }
    verify: {
      ctaLabel: string
      intro: string
      subject: string
    }
    welcome: {
      ctaLabel: string
      intro: string
      subject: string
    }
  }
}

const defaults: EmailSettingsShape = {
  branding: {
    footerText: 'MiniForge AI 3D',
    productName: 'MiniForge AI 3D',
  },
  sender: {
    fromAddress: process.env.EMAIL_FROM_ADDRESS || 'no-reply@miniforge.local',
    fromName: process.env.EMAIL_FROM_NAME || 'MiniForge AI 3D',
    replyTo: '',
  },
  templates: {
    forgotPassword: {
      ctaLabel: 'Reset password',
      intro: 'We received a password reset request. Use the button below to continue.',
      subject: 'MiniForge password reset',
    },
    orderPaid: {
      ctaLabel: 'View order details',
      intro: 'Your print order has been paid successfully and moved into the next processing stage.',
      subject: 'MiniForge order payment received',
    },
    subscriptionSuccess: {
      ctaLabel: 'View credits and subscription',
      intro: 'Your subscription is active and credits for the current period have been applied to your account.',
      subject: 'MiniForge subscription activated',
    },
    verify: {
      ctaLabel: 'Verify email',
      intro: 'Use the button below to verify your email address before signing in.',
      subject: 'Verify your MiniForge email',
    },
    welcome: {
      ctaLabel: 'Open Studio',
      intro: 'Your account is ready. You can now start using MiniForge for generation, model management, subscriptions, and orders.',
      subject: 'Welcome to MiniForge',
    },
  },
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

const pickString = (value: unknown, fallback: string) => {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

async function getPayloadInstance(input: Payload | PayloadRequest) {
  return 'findGlobal' in input ? input : input.payload
}

export async function getEmailSettings(input: Payload | PayloadRequest): Promise<EmailSettingsShape> {
  const payload = await getPayloadInstance(input)
  const siteSettings = await payload
    .findGlobal({
      slug: 'site-settings',
      overrideAccess: true,
    })
    .catch(() => null)

  const siteRecord = isRecord(siteSettings as unknown) ? (siteSettings as unknown as Record<string, unknown>) : {}
  const siteEmail = isRecord(siteRecord.emailSettings) ? siteRecord.emailSettings : {}
  const sender = isRecord(siteEmail.sender) ? siteEmail.sender : {}
  const branding = isRecord(siteEmail.branding) ? siteEmail.branding : {}
  const authTemplates = isRecord(siteEmail.templates) ? siteEmail.templates : {}
  const businessTemplates = isRecord(siteEmail.businessTemplates) ? siteEmail.businessTemplates : {}

  const section = (name: keyof EmailSettingsShape['templates']) => {
    const source =
      name === 'subscriptionSuccess' || name === 'orderPaid'
        ? isRecord(businessTemplates[name])
          ? businessTemplates[name]
          : {}
        : isRecord(authTemplates[name])
          ? authTemplates[name]
          : {}

    return {
      ctaLabel: pickString(source.ctaLabel, defaults.templates[name].ctaLabel),
      intro: pickString(source.intro, defaults.templates[name].intro),
      subject: pickString(source.subject, defaults.templates[name].subject),
    }
  }

  return {
    branding: {
      footerText: pickString(branding.footerText, defaults.branding.footerText),
      productName: pickString(branding.productName, defaults.branding.productName),
    },
    sender: {
      fromAddress: pickString(sender.fromAddress, defaults.sender.fromAddress),
      fromName: pickString(sender.fromName, defaults.sender.fromName),
      replyTo: pickString(sender.replyTo, defaults.sender.replyTo),
    },
    templates: {
      forgotPassword: section('forgotPassword'),
      orderPaid: section('orderPaid'),
      subscriptionSuccess: section('subscriptionSuccess'),
      verify: section('verify'),
      welcome: section('welcome'),
    },
  }
}
