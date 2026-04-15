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

export const subscriptionPlans: SubscriptionPlanDefinition[] = [
  {
    key: 'starter',
    lookupKey: 'miniforge_starter_monthly',
    name: 'Starter',
    shortLabel: '入门订阅',
    monthlyPrice: 19,
    creditsPerMonth: 240,
    description: '适合个人创作者持续生成角色、快速下载并维持轻量打印需求。',
    features: ['每月 240 积分', '图生 / 文生 / 图文混合全模式可用', '标准模型下载与结果归档'],
  },
  {
    key: 'pro',
    lookupKey: 'miniforge_pro_monthly',
    name: 'Pro',
    shortLabel: '专业订阅',
    monthlyPrice: 49,
    creditsPerMonth: 760,
    description: '适合高频创作、反复迭代与需要更稳定产能的小团队或工作室。',
    features: ['每月 760 积分', '更适合高频角色迭代', '优先用于生成、下载与打样协同'],
  },
  {
    key: 'studio',
    lookupKey: 'miniforge_studio_monthly',
    name: 'Studio',
    shortLabel: '工作室订阅',
    monthlyPrice: 99,
    creditsPerMonth: 1680,
    description: '适合把 AI 生成、资产沉淀与实体打样放进同一运营节奏的团队。',
    features: ['每月 1680 积分', '适合稳定商业化产出', '支持持续生成、下载与打印履约'],
  },
]

export function getSubscriptionPlan(planKey: string) {
  return subscriptionPlans.find((plan) => plan.key === planKey) ?? null
}
