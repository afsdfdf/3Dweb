import type { BillingSubscription } from '@/payload-types'

export const subscriptionCheckoutBlockingStatuses = ['active', 'trialing', 'past_due', 'incomplete'] as const
export const subscriptionCreditGrantStatuses = ['active', 'trialing'] as const
export const subscriptionEntitlementStatuses = ['active', 'trialing', 'past_due'] as const

export type SubscriptionStatus = BillingSubscription['status']

export function hasSubscriptionCreditGrantStatus(status: unknown): status is (typeof subscriptionCreditGrantStatuses)[number] {
  return subscriptionCreditGrantStatuses.includes(status as never)
}

export function hasSubscriptionEntitlementStatus(status: unknown): status is (typeof subscriptionEntitlementStatuses)[number] {
  return subscriptionEntitlementStatuses.includes(status as never)
}
