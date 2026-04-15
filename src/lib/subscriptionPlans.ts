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
    description: '适合个人创作者持续生成角色、快速下载，并维持轻量打样需求。',
    features: ['每月 240 积分', '支持图生 3D / 文生 3D / 图文混合', '标准模型下载与结果归档'],
    key: 'starter',
    lookupKey: 'miniforge_starter_monthly',
    monthlyPrice: 19,
    name: 'Starter',
    shortLabel: '入门订阅',
  },
  pro: {
    creditsPerMonth: 760,
    description: '适合高频创作、反复迭代与需要更稳定产能的小团队或工作室。',
    features: ['每月 760 积分', '更适合高频角色迭代', '优先覆盖生成、下载与打样协同'],
    key: 'pro',
    lookupKey: 'miniforge_pro_monthly',
    monthlyPrice: 49,
    name: 'Pro',
    shortLabel: '专业订阅',
  },
  studio: {
    creditsPerMonth: 1680,
    description: '适合把 AI 生成、资产沉淀与实体打样放进同一运营节奏的团队。',
    features: ['每月 1680 积分', '适合稳定商业化产出', '支持持续生成、下载与打印履约'],
    key: 'studio',
    lookupKey: 'miniforge_studio_monthly',
    monthlyPrice: 99,
    name: 'Studio',
    shortLabel: '工作室订阅',
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
