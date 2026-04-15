import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { getCachedPayload } from '@/lib/getCachedPayload'
import { getPaymentProviderSettings } from '@/lib/paymentProviders'
import { getSubscriptionPlans } from '@/lib/subscriptionPlans'

import { ManageSubscriptionButton } from '../_components/ManageSubscriptionButton'
import { SiteShell } from '../_components/SiteShell'
import { SubscribePlanButton } from '../_components/SubscribePlanButton'
import { SubscriptionStatusSync } from '../_components/SubscriptionStatusSync'
import { getCurrentUser, getCurrentUserActiveSubscription } from '../_lib/session'
import { formatDateTime, formatSubscriptionStatus } from '../_lib/ui-text'

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string; session_id?: string }>
}) {
  const payload = await getCachedPayload()
  const [user, activeSubscription, query, subscriptionPlans, paymentProviders] = await Promise.all([
    getCurrentUser(),
    getCurrentUserActiveSubscription(),
    searchParams,
    getSubscriptionPlans(payload),
    getPaymentProviderSettings(payload),
  ])

  const shouldSync = Boolean(user && query.checkout === 'success' && query.session_id)
  const isCancelled = query.checkout === 'cancelled'
  const stripeSubscriptionsEnabled = paymentProviders.subscriptionProvider === 'stripe'
  const subscriptionProviderLabel = stripeSubscriptionsEnabled ? 'Stripe（当前已启用）' : 'Shopify（预留）'

  return (
    <SiteShell currentPath="/pricing" user={user}>
      <section className="mx-auto flex max-w-7xl flex-col gap-10 px-4 py-10 sm:px-6 sm:py-14">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="max-w-3xl">
            <Badge variant="secondary">价格方案</Badge>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">订阅、积分与打印履约分层定价</h1>
            <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
              现在补齐 3 个常规月付订阅方案，并保留积分充值与打印订单两条商业化路径。订阅负责稳定产能，积分负责灵活补量，打印订单继续走实体交付。
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Badge variant="outline">{subscriptionProviderLabel}</Badge>
              <Badge variant="outline">每月自动发放积分</Badge>
              <Badge variant="outline">支持 Billing Portal 管理</Badge>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">{paymentProviders.providerNotice}</p>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {[
                { label: 'Starter', text: '适合个人创作者起步。' },
                { label: 'Pro', text: '适合高频生产与迭代。' },
                { label: 'Studio', text: '适合持续商业化产出。' },
              ].map((item) => (
                <Card className="border-border/60 bg-card/80" key={item.label} size="sm">
                  <CardHeader>
                    <CardTitle>{item.label}</CardTitle>
                    <CardDescription>{item.text}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>

          <Card className="border-border/60 bg-card/85 shadow-sm">
            <CardHeader>
              <Badge variant="outline">当前订阅</Badge>
              <CardTitle className="mt-3 text-2xl tracking-tight">{activeSubscription ? activeSubscription.planKey : '尚未开通'}</CardTitle>
              <CardDescription>
                {activeSubscription
                  ? `状态：${formatSubscriptionStatus(activeSubscription.status)}`
                  : '开通订阅后，会在支付成功后自动同步方案和本期积分。'}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm text-muted-foreground">
              {shouldSync && query.session_id ? <SubscriptionStatusSync enabled sessionId={query.session_id} /> : null}
              {isCancelled ? <p>你已取消本次 Stripe 结算，可稍后重新发起订阅。</p> : null}
              {activeSubscription ? (
                <>
                  <p>每期积分：{activeSubscription.monthlyCredits ?? 0}</p>
                  <p>当前周期结束：{formatDateTime(activeSubscription.currentPeriodEnd)}</p>
                  <p>最近同步状态：{formatSubscriptionStatus(activeSubscription.status)}</p>
                </>
              ) : (
                <p>建议从 Starter 或 Pro 开始，等生成频率稳定后再升级到 Studio。</p>
              )}
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              {user ? (
                activeSubscription ? (
                  <ManageSubscriptionButton />
                ) : (
                  <p className="w-full text-sm text-muted-foreground">
                    {stripeSubscriptionsEnabled
                      ? '选择下方任一方案即可进入 Stripe Checkout。'
                      : '当前订阅支付通道处于 Shopify 预留模式，在线订阅入口已暂停。'}
                  </p>
                )
              ) : (
                <Button asChild className="w-full">
                  <Link href="/login">登录后订阅</Link>
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>

        <section className="grid gap-4 xl:grid-cols-3">
          {subscriptionPlans.map((plan) => {
            const isCurrentPlan = activeSubscription?.planKey === plan.key

            return (
              <Card className="border-border/60 bg-card/90 shadow-sm" key={plan.key}>
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <Badge variant={plan.key === 'pro' ? 'default' : 'outline'}>{plan.shortLabel}</Badge>
                    {isCurrentPlan ? <Badge variant="secondary">当前方案</Badge> : null}
                  </div>
                  <CardTitle className="mt-4 text-3xl tracking-tight">
                    ${plan.monthlyPrice}
                    <span className="ml-2 text-base font-normal text-muted-foreground">/ 月</span>
                  </CardTitle>
                  <CardDescription className="mt-2">{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <div className="rounded-2xl border border-border/60 bg-muted/40 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">每月发放积分</p>
                    <p className="mt-2 text-2xl font-semibold tracking-tight">{plan.creditsPerMonth}</p>
                  </div>
                  <ul className="grid gap-3 text-sm leading-6 text-muted-foreground">
                    {plan.features.map((feature) => (
                      <li key={feature}>• {feature}</li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter className="flex flex-col gap-3">
                  {user ? (
                    isCurrentPlan ? (
                      <ManageSubscriptionButton label="管理当前订阅" variant="secondary" />
                    ) : (
                      <SubscribePlanButton disabled={!stripeSubscriptionsEnabled} planKey={plan.key} />
                    )
                  ) : (
                    <Button asChild className="w-full" variant="outline">
                      <Link href="/login">登录后订阅</Link>
                    </Button>
                  )}
                </CardFooter>
              </Card>
            )
          })}
        </section>

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <Card className="border-border/60 bg-card/80 shadow-sm">
            <CardHeader>
              <Badge variant="outline">订阅之外</Badge>
              <CardTitle className="mt-3 text-2xl tracking-tight">积分充值与打印订单继续保留</CardTitle>
              <CardDescription>订阅适合稳定用量，积分充值适合峰值补量，打印订单继续按实体交付流程计费。</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="grid gap-3 text-sm leading-6 text-muted-foreground">
                <li>图生 3D / 文生 3D / 图文混合仍按积分消耗。</li>
                <li>订阅会先补齐基础产能，再由积分充值承接临时高峰。</li>
                <li>模型进入实体打印后，继续走订单与履约支付链路。</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/80 shadow-sm">
            <CardHeader>
              <Badge variant="secondary">支付流程</Badge>
              <CardTitle className="mt-3 text-2xl tracking-tight">当前已接通的订阅支付全流程</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="grid gap-3 text-sm leading-6 text-muted-foreground">
                <li>1. 价格页发起 Stripe Checkout 订阅。</li>
                <li>2. 结算成功回跳价格页并自动同步订阅状态。</li>
                <li>3. 同步成功后，自动创建或更新订阅记录。</li>
                <li>4. 当前账期首次同步时自动发放对应积分。</li>
                <li>5. 后续可通过 Billing Portal 管理订阅。</li>
              </ol>
            </CardContent>
          </Card>
        </section>
      </section>
    </SiteShell>
  )
}
