export type LegacyPaymentCarrier = {
  checkoutReference?: string | null
  rawWebhookPayload?: unknown
  shopifyCheckoutId?: string | null
  shopifyCheckoutUrl?: string | null
  shopifyCustomerId?: string | null
  shopifyOrderId?: string | null
  stripeCustomerId?: string | null
}

export type PaymentProviderKey = 'shopify' | 'stripe'

export type PaymentRecordPatchInput = {
  checkoutUrl?: string | null
  customerReference?: string | null
  orderReference?: string | null
  provider?: PaymentProviderKey | null
  sessionId?: string | null
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

export function getPaymentProviderKey(rawWebhookPayload?: unknown): PaymentProviderKey {
  if (!isRecord(rawWebhookPayload)) return 'stripe'

  const provider = typeof rawWebhookPayload.provider === 'string' ? rawWebhookPayload.provider.toLowerCase() : ''
  return provider === 'shopify' ? 'shopify' : 'stripe'
}

export function getPaymentProviderLabel(rawWebhookPayload?: unknown) {
  return getPaymentProviderKey(rawWebhookPayload) === 'shopify' ? 'Shopify' : 'Stripe'
}

export function getPaymentSessionId(input: LegacyPaymentCarrier) {
  if (typeof input.shopifyCheckoutId === 'string' && input.shopifyCheckoutId.trim()) {
    return input.shopifyCheckoutId.trim()
  }

  if (typeof input.checkoutReference === 'string' && input.checkoutReference.trim()) {
    return input.checkoutReference.trim()
  }

  return ''
}

export function getPaymentCheckoutUrl(input: LegacyPaymentCarrier) {
  return typeof input.shopifyCheckoutUrl === 'string' && input.shopifyCheckoutUrl.trim() ? input.shopifyCheckoutUrl.trim() : ''
}

export function getPaymentOrderReference(input: LegacyPaymentCarrier) {
  return typeof input.shopifyOrderId === 'string' && input.shopifyOrderId.trim() ? input.shopifyOrderId.trim() : ''
}

export function getPaymentCustomerReference(input: LegacyPaymentCarrier) {
  if (typeof input.stripeCustomerId === 'string' && input.stripeCustomerId.trim()) {
    return input.stripeCustomerId.trim()
  }

  if (typeof input.shopifyCustomerId === 'string' && input.shopifyCustomerId.trim()) {
    return input.shopifyCustomerId.trim()
  }

  return ''
}

export function setPaymentLegacyFields(input: PaymentRecordPatchInput) {
  return {
    ...(typeof input.checkoutUrl === 'string' ? { shopifyCheckoutUrl: input.checkoutUrl.trim() } : {}),
    ...(typeof input.customerReference === 'string' ? { shopifyCustomerId: input.customerReference.trim() } : {}),
    ...(typeof input.orderReference === 'string' ? { shopifyOrderId: input.orderReference.trim() } : {}),
    ...(typeof input.sessionId === 'string' ? { shopifyCheckoutId: input.sessionId.trim() } : {}),
  }
}

export const PAYMENT_LEGACY_FIELD_NAMES = {
  checkoutUrl: 'shopifyCheckoutUrl',
  customerReference: 'shopifyCustomerId',
  orderReference: 'shopifyOrderId',
  sessionId: 'shopifyCheckoutId',
} as const
