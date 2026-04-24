import type { Payload, PayloadRequest } from 'payload'

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
  },
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

export async function getSubscriptionPlans(input?: Payload | PayloadRequest): Promise<SubscriptionPlanDefinition[]> {
  const payload = await getPayloadLike(input)
  const siteSettings = payload
    ? await payload
        .findGlobal({
          slug: 'site-settings',
          overrideAccess: true,
        })
        .catch(() => null)
    : null

  const subscriptionPlans = isRecord((siteSettings as unknown as Record<string, unknown> | null)?.subscriptionPlans)
    ? ((siteSettings as unknown as Record<string, unknown>).subscriptionPlans as Record<string, unknown>)
    : {}

  return (['starter', 'pro', 'studio'] as const).map((key) => {
    const source = isRecord(subscriptionPlans[key]) ? subscriptionPlans[key] : {}
    const fallback = defaultPlans[key]

    return {
      creditsPerMonth: pickNumber(source.creditsPerMonth, fallback.creditsPerMonth),
      description: pickString(source.description, fallback.description),
      features: pickFeatures(source.features, fallback.features),
      key,
      lookupKey: fallback.lookupKey,
      monthlyPrice: pickNumber(source.monthlyPrice, fallback.monthlyPrice),
      name: pickString(source.name, fallback.name),
      shortLabel: pickString(source.shortLabel, fallback.shortLabel),
    } satisfies SubscriptionPlanDefinition
  })
}

export async function getSubscriptionPlan(planKey: string, input?: Payload | PayloadRequest) {
  const plans = await getSubscriptionPlans(input)
  return plans.find((plan) => plan.key === planKey) ?? null
}
