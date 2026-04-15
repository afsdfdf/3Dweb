export type LegacyPaymentCarrier = {
  rawWebhookPayload?: unknown
  shopifyCheckoutId?: string | null
  shopifyCheckoutUrl?: string | null
  shopifyOrderId?: string | null
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

export function getPaymentProviderLabel(rawWebhookPayload?: unknown) {
  if (!isRecord(rawWebhookPayload)) return 'Stripe'

  const provider = typeof rawWebhookPayload.provider === 'string' ? rawWebhookPayload.provider.toLowerCase() : ''

  if (provider === 'shopify') return 'Shopify'
  if (provider === 'stripe') return 'Stripe'
  return 'Stripe'
}

export function getPaymentSessionId(input: LegacyPaymentCarrier) {
  return typeof input.shopifyCheckoutId === 'string' && input.shopifyCheckoutId.trim() ? input.shopifyCheckoutId.trim() : ''
}

export function getPaymentCheckoutUrl(input: LegacyPaymentCarrier) {
  return typeof input.shopifyCheckoutUrl === 'string' && input.shopifyCheckoutUrl.trim() ? input.shopifyCheckoutUrl.trim() : ''
}

export function getPaymentOrderReference(input: LegacyPaymentCarrier) {
  return typeof input.shopifyOrderId === 'string' && input.shopifyOrderId.trim() ? input.shopifyOrderId.trim() : ''
}
