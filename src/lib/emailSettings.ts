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
      ctaLabel: '重置密码',
      intro: '我们收到了你的密码重置请求。点击下面按钮即可设置新密码。',
      subject: 'MiniForge 密码重置',
    },
    orderPaid: {
      ctaLabel: '查看订单详情',
      intro: '你的打印订单已支付成功，订单已经进入后续处理流程。',
      subject: 'MiniForge 订单支付成功',
    },
    subscriptionSuccess: {
      ctaLabel: '查看积分与订阅',
      intro: '你的订阅已经开通成功，积分已按当前账期发放到账户。',
      subject: 'MiniForge 订阅开通成功',
    },
    verify: {
      ctaLabel: '验证邮箱',
      intro: '请点击下面的按钮完成邮箱验证，验证成功后即可登录并继续使用 MiniForge。',
      subject: '验证你的 MiniForge 邮箱',
    },
    welcome: {
      ctaLabel: '进入 Studio',
      intro: '你的账号已经创建成功，现在可以开始使用 MiniForge 的生成、模型、订阅与订单能力。',
      subject: '欢迎加入 MiniForge',
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
