import type { Payload, PayloadRequest } from 'payload'

export type PaymentProviderKey = 'shopify' | 'stripe'

export type PaymentProviderSettings = {
  orderProvider: PaymentProviderKey
  providerNotice: string
  subscriptionProvider: PaymentProviderKey
}

const defaults: PaymentProviderSettings = {
  orderProvider: 'stripe',
  providerNotice:
    '当前版本正式启用 Stripe 处理订阅与订单支付；Shopify 相关数据结构继续保留，用于未来扩展商品、变体与结算链路。',
  subscriptionProvider: 'stripe',
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

const normalizeProvider = (value: unknown, fallback: PaymentProviderKey): PaymentProviderKey => {
  return value === 'shopify' || value === 'stripe' ? value : fallback
}

async function getPayloadLike(input?: Payload | PayloadRequest) {
  if (!input) return null
  return 'findGlobal' in input ? input : input.payload
}

export async function getPaymentProviderSettings(input?: Payload | PayloadRequest): Promise<PaymentProviderSettings> {
  const payload = await getPayloadLike(input)
  const siteSettings = payload
    ? await payload
        .findGlobal({
          slug: 'site-settings',
        })
        .catch(() => null)
    : null

  const paymentProviders = isRecord((siteSettings as unknown as Record<string, unknown> | null)?.paymentProviders)
    ? ((siteSettings as unknown as Record<string, unknown>).paymentProviders as Record<string, unknown>)
    : {}

  return {
    orderProvider: normalizeProvider(paymentProviders.orderProvider, defaults.orderProvider),
    providerNotice:
      typeof paymentProviders.providerNotice === 'string' && paymentProviders.providerNotice.trim()
        ? paymentProviders.providerNotice.trim()
        : defaults.providerNotice,
    subscriptionProvider: normalizeProvider(paymentProviders.subscriptionProvider, defaults.subscriptionProvider),
  }
}
