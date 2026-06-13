import type { Payload, PayloadRequest } from 'payload'

export type SubscriptionBillingCycle = 'monthly' | 'yearly'
export type SubscriptionPlanKey = 'starter' | 'pro' | 'studio'

export type SubscriptionPlanDefinition = {
  creditsPerMonth: number
  description: string
  features: string[]
  key: SubscriptionPlanKey
  lookupKey: string
  monthlyPrice: number
  name: string
  shortLabel: string
  yearlyLookupKey: string
  yearlyPrice: number
}

const defaultPlans: Record<SubscriptionPlanKey, SubscriptionPlanDefinition> = {
  starter: {
    creditsPerMonth: 240,
    description: 'Designed for individual creators who need steady character generation, fast downloads, and lightweight sampling.',
    features: ['240 credits per month', 'Supports image, text, and hybrid generation', 'Standard model downloads and result archiving'],
    key: 'starter',
    lookupKey: 'miniforge_starter_monthly',
    monthlyPrice: 19,
    name: 'Starter',
    shortLabel: 'Starter plan',
    yearlyLookupKey: 'miniforge_starter_yearly',
    yearlyPrice: 182.4,
  },
  pro: {
    creditsPerMonth: 760,
    description: 'Designed for high-frequency creation, repeated iteration, and smaller teams that need more stable output capacity.',
    features: ['760 credits per month', 'Better suited to frequent character iteration', 'Supports generation, downloads, and sampling workflows'],
    key: 'pro',
    lookupKey: 'miniforge_pro_monthly',
    monthlyPrice: 49,
    name: 'Pro',
    shortLabel: 'Pro plan',
    yearlyLookupKey: 'miniforge_pro_yearly',
    yearlyPrice: 470.4,
  },
  studio: {
    creditsPerMonth: 1680,
    description: 'Designed for teams that need generation, asset retention, and physical sampling inside one operating rhythm.',
    features: ['1680 credits per month', 'Built for stable commercial throughput', 'Supports continuous generation, downloads, and print fulfillment'],
    key: 'studio',
    lookupKey: 'miniforge_studio_monthly',
    monthlyPrice: 99,
    name: 'Studio',
    shortLabel: 'Studio plan',
    yearlyLookupKey: 'miniforge_studio_yearly',
    yearlyPrice: 950.4,
  },
}

type ReadOptions = {
  strict?: boolean
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

const pickString = (value: unknown, fallback: string) => {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

const pickNumber = (value: unknown, fallback: number) => {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

const pickFeatures = (value: unknown, fallback: string[]) => {
  if (!Array.isArray(value)) return fallback

  const features = value
    .map((item) => {
      if (typeof item === 'string') return item.trim()
      if (isRecord(item) && typeof item.label === 'string') return item.label.trim()
      return ''
    })
    .filter(Boolean)

  return features.length > 0 ? features : fallback
}

async function getPayloadLike(input?: Payload | PayloadRequest) {
  if (!input) return null
  return 'findGlobal' in input ? input : input.payload
}

const getDefaultYearlyPrice = (monthlyPrice: number) => {
  return Math.round(monthlyPrice * 12 * 0.8 * 100) / 100
}

export function normalizeSubscriptionBillingCycle(value: unknown): SubscriptionBillingCycle {
  return value === 'yearly' ? 'yearly' : 'monthly'
}

export function getSubscriptionPlanPricing(plan: SubscriptionPlanDefinition, billingCycle: SubscriptionBillingCycle) {
  if (billingCycle === 'yearly') {
    return {
      billingCycle,
      interval: 'year' as const,
      intervalLabel: 'Year',
      lookupKey: plan.yearlyLookupKey,
      price: plan.yearlyPrice,
    }
  }

  return {
    billingCycle,
    interval: 'month' as const,
    intervalLabel: 'Month',
    lookupKey: plan.lookupKey,
    price: plan.monthlyPrice,
  }
}

export function getSubscriptionCreditsForBillingCycle(
  plan: SubscriptionPlanDefinition,
  billingCycle: SubscriptionBillingCycle,
) {
  return billingCycle === 'yearly' ? plan.creditsPerMonth * 12 : plan.creditsPerMonth
}

export async function getSubscriptionPlans(
  input?: Payload | PayloadRequest,
  options: ReadOptions = {},
): Promise<SubscriptionPlanDefinition[]> {
  const payload = await getPayloadLike(input)
  let siteSettings: unknown = null

  if (!payload && options.strict) {
    throw new Error('Subscription plan settings are temporarily unavailable.')
  }

  if (payload) {
    try {
      siteSettings = await payload.findGlobal({
        slug: 'site-settings',
        overrideAccess: true,
      })
    } catch {
      if (options.strict) {
        throw new Error('Subscription plan settings are temporarily unavailable.')
      }
      siteSettings = null
    }
  }

  const subscriptionPlans = isRecord((siteSettings as unknown as Record<string, unknown> | null)?.subscriptionPlans)
    ? ((siteSettings as unknown as Record<string, unknown>).subscriptionPlans as Record<string, unknown>)
    : {}

  return (['starter', 'pro', 'studio'] as const).map((key) => {
    const source = isRecord(subscriptionPlans[key]) ? subscriptionPlans[key] : {}
    const fallback = defaultPlans[key]
    const monthlyPrice = pickNumber(source.monthlyPrice, fallback.monthlyPrice)
    const yearlyPrice = pickNumber(source.yearlyPrice, getDefaultYearlyPrice(monthlyPrice))

    return {
      creditsPerMonth: pickNumber(source.creditsPerMonth, fallback.creditsPerMonth),
      description: pickString(source.description, fallback.description),
      features: pickFeatures(source.features, fallback.features),
      key,
      lookupKey: fallback.lookupKey,
      monthlyPrice,
      name: pickString(source.name, fallback.name),
      shortLabel: pickString(source.shortLabel, fallback.shortLabel),
      yearlyLookupKey: fallback.yearlyLookupKey,
      yearlyPrice,
    } satisfies SubscriptionPlanDefinition
  })
}

export async function getSubscriptionPlan(planKey: string, input?: Payload | PayloadRequest, options: ReadOptions = {}) {
  const plans = await getSubscriptionPlans(input, options)
  return plans.find((plan) => plan.key === planKey) ?? null
}
