import Link from 'next/link'

import { BorderComboFrame1 } from '@/components/ui-lab/border-combo-frame-1'
import { BorderComboFrame2Variant } from '@/components/ui-lab/border-combo-frame-2'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import type { SubscriptionPlanDefinition } from '@/lib/subscriptionPlans'

import { FooterBar } from './shell/FooterBar'
import { ManageSubscriptionButton } from './ManageSubscriptionButton'
import { PricingLoginButton } from './PricingLoginButton'
import { SubscribePlanButton } from './SubscribePlanButton'
import { SubscriptionStatusSync } from './SubscriptionStatusSync'
import type { FooterContent } from '../_lib/marketing-content'
import { formatDateTime, formatSubscriptionStatus } from '../_lib/ui-text'

type CurrentUser = {
  email?: string | null
} | null

type ActiveSubscription = {
  currentPeriodEnd?: string | null
  monthlyCredits?: number | null
  planKey?: string | null
  status?: string | null
} | null

type SubscriptionPageProps = {
  activeSubscription: ActiveSubscription
  footerContent: FooterContent
  isCancelled: boolean
  paymentProviderNotice?: string | null
  shouldSync: boolean
  siteDescription: string
  stripeSubscriptionsEnabled: boolean
  subscriptionPlans: SubscriptionPlanDefinition[]
  supportEmail: string
  syncSessionId?: string
  user: CurrentUser
}

function PlanAction({
  activeSubscription,
  isCurrentPlan,
  plan,
  stripeSubscriptionsEnabled,
  user,
}: {
  activeSubscription: ActiveSubscription
  isCurrentPlan: boolean
  plan: SubscriptionPlanDefinition
  stripeSubscriptionsEnabled: boolean
  user: CurrentUser
}) {
  if (!user) {
    return <PricingLoginButton />
  }

  if (activeSubscription && isCurrentPlan) {
    return <ManageSubscriptionButton label="Manage current plan" variant="secondary" />
  }

  return <SubscribePlanButton disabled={!stripeSubscriptionsEnabled} planKey={plan.key} />
}

function BillingComparison({ plan }: { plan: SubscriptionPlanDefinition }) {
  const yearlyPrice = plan.monthlyPrice * 12

  return (
    <div className="grid min-h-[76px] gap-2 sm:grid-cols-2">
      <div className="flex h-[76px] flex-col justify-center rounded-[8px] border border-[#8d5c25] bg-[#221d17] px-4 py-3">
        <p className="text-xs uppercase tracking-[0.18em] text-[#d6ad61]">Monthly</p>
        <p className="mt-1 text-xl font-semibold tracking-tight text-[#f5ead0]">
          ${plan.monthlyPrice}
          <span className="ml-1 text-xs font-normal text-[#a7a9b0]">/ month</span>
        </p>
      </div>
      <div className="flex h-[76px] flex-col justify-center rounded-[8px] border border-[#403f46] bg-[#18181b] px-4 py-3">
        <p className="text-xs uppercase tracking-[0.18em] text-[#8f7a4a]">Yearly</p>
        <p className="mt-1 text-xl font-semibold tracking-tight text-[#f1e2bc]">
          ${yearlyPrice}
          <span className="ml-1 text-xs font-normal text-[#a7a9b0]">/ year</span>
        </p>
      </div>
    </div>
  )
}

function FreePlanSummary() {
  return (
    <div className="grid gap-3">
      <div className="flex h-[84px] flex-col justify-center rounded-[8px] border border-[#403f46] bg-[#18181b] p-4">
        <p className="text-xs uppercase tracking-[0.18em] text-[#8f7a4a]">Free allowance</p>
        <p className="mt-1 text-2xl font-semibold tracking-tight text-[#f0d188]">0 credits</p>
      </div>
      <div className="grid min-h-[76px] gap-2 sm:grid-cols-2">
        <div className="flex h-[76px] flex-col justify-center rounded-[8px] border border-[#8d5c25] bg-[#221d17] px-4 py-3">
          <p className="text-xs uppercase tracking-[0.18em] text-[#d6ad61]">Monthly</p>
          <p className="mt-1 text-xl font-semibold tracking-tight text-[#f5ead0]">
            $0<span className="ml-1 text-xs font-normal text-[#a7a9b0]">/ month</span>
          </p>
        </div>
        <div className="flex h-[76px] flex-col justify-center rounded-[8px] border border-[#403f46] bg-[#18181b] px-4 py-3">
          <p className="text-xs uppercase tracking-[0.18em] text-[#8f7a4a]">Yearly</p>
          <p className="mt-1 text-xl font-semibold tracking-tight text-[#f1e2bc]">
            $0<span className="ml-1 text-xs font-normal text-[#a7a9b0]">/ year</span>
          </p>
        </div>
      </div>
    </div>
  )
}

function SupportPanel({ eyebrow, title, body }: { body: string; eyebrow: string; title: string }) {
  return (
    <div className="min-h-[180px] border-y border-[#403f46] bg-[#1c1c20]/72 px-6 py-7 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <p className="text-xs uppercase tracking-[0.24em] text-[#8f7a4a]">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#f1e2bc]">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-[#a7a9b0]">{body}</p>
    </div>
  )
}

export function SubscriptionMobilePage(props: SubscriptionPageProps) {
  const { activeSubscription, footerContent, siteDescription, subscriptionPlans, supportEmail } = props

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#181818_0%,#222225_44%,#181818_100%)] text-[#ededee]">
      <header className="sticky top-0 z-40 border-b border-[#403f46] bg-[#181818]/95 px-4 py-3 backdrop-blur">
        <Link className="flex h-8 w-[161px] items-center" href="/">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="Thorns Tavern" className="h-8 w-[161px] object-contain" src="/ui/nav/brand-wordmark.png" />
        </Link>
      </header>

      <main className="flex flex-col gap-8 px-4 py-6">
        <BorderComboFrame1 className="bg-[linear-gradient(135deg,#101011,#252327)]" style={{ pointerEvents: 'auto' }}>
          <div className="flex flex-col gap-4 p-1">
            <Badge className="w-fit border-[#8d5c25] bg-[#24211c] text-[#f1d99c]" variant="outline">
              Subscription
            </Badge>
            <h1 className="text-3xl font-semibold leading-tight tracking-tight text-[#f5ead0]">Compare monthly and yearly credits for creation workflows.</h1>
            <p className="text-sm leading-6 text-[#b9bac0]">
              Plans are loaded from backend site settings, while checkout and portal actions keep the existing billing endpoints.
            </p>
          </div>
        </BorderComboFrame1>

        <section className="grid gap-4">
          {subscriptionPlans.map((plan) => {
            const isCurrentPlan = activeSubscription?.planKey === plan.key

            return (
              <BorderComboFrame1 className="bg-[#1c1c20]" key={plan.key} style={{ pointerEvents: 'auto' }}>
                <div className="flex flex-col gap-4 p-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-[#8f7a4a]">{plan.shortLabel}</p>
                      <h2 className="mt-1 text-2xl font-semibold tracking-tight text-[#f1e2bc]">{plan.name}</h2>
                    </div>
                    {isCurrentPlan ? <Badge variant="secondary">Current</Badge> : null}
                  </div>
                  <p className="text-sm leading-6 text-[#a7a9b0]">{plan.description}</p>
                  <Separator className="bg-[#403f46]" />
                  <div className="flex min-h-[86px] flex-col justify-center rounded-[8px] border border-[#403f46] bg-[#18181b] p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-[#8f7a4a]">Monthly allowance</p>
                    <p className="mt-1 text-xl font-semibold tracking-tight text-[#f0d188]">{plan.creditsPerMonth} credits</p>
                  </div>
                  <BillingComparison plan={plan} />
                  <ul className="grid gap-2 text-sm leading-6 text-[#9b9da5]">
                    {plan.features.map((feature) => (
                      <li key={feature}>{feature}</li>
                    ))}
                  </ul>
                  <PlanAction {...props} isCurrentPlan={isCurrentPlan} plan={plan} />
                </div>
              </BorderComboFrame1>
            )
          })}
        </section>
      </main>

      <FooterBar footerContent={footerContent} siteDescription={siteDescription} supportEmail={supportEmail} />
    </div>
  )
}

export function SubscriptionPage(props: SubscriptionPageProps) {
  const {
    activeSubscription,
    footerContent,
    isCancelled,
    paymentProviderNotice,
    shouldSync,
    siteDescription,
    stripeSubscriptionsEnabled,
    subscriptionPlans,
    supportEmail,
    syncSessionId,
    user,
  } = props

  const currentPlan = activeSubscription?.planKey || 'No active plan'

  return (
    <>
      <div className="h-[1020px] overflow-y-auto bg-[radial-gradient(circle_at_50%_4%,rgba(155,112,45,0.16),transparent_24%),linear-gradient(180deg,#181818_0%,#222225_42%,#181818_100%)]">
        <section className="mx-auto max-w-[1600px] px-4 pb-4 pt-8 sm:px-6">
          <div className="grid gap-4">
            <BorderComboFrame1
              className="min-h-[220px] bg-[linear-gradient(135deg,rgba(13,13,15,0.96),rgba(47,45,48,0.9))] shadow-[0_20px_52px_rgba(0,0,0,0.36)]"
              style={{ pointerEvents: 'auto' }}
            >
              <div className="grid min-h-[152px] items-center gap-6 p-1 lg:grid-cols-[minmax(0,1fr)_420px]">
                <div className="flex flex-col justify-center gap-4">
                  <Badge className="w-fit border-[#8d5c25] bg-[#24211c] text-[#f1d99c]" variant="outline">
                    Subscription
                  </Badge>
                  <h1 className="max-w-5xl text-4xl font-semibold leading-tight tracking-tight text-[#f5ead0]">
                    Monthly and yearly plan comparison for AI 3D creation credits.
                  </h1>
                  <p className="max-w-4xl text-base leading-7 text-[#b9bac0]">
                    Choose a backend-managed plan, compare payment cadence, and keep checkout, success sync, and billing portal behavior on the existing subscription endpoints.
                  </p>
                </div>
                <div className="grid gap-3 border-l border-[#403f46] pl-6">
                  <Badge className="w-fit border-[#5c4a35] text-[#d8d0bf]" variant="outline">
                    {stripeSubscriptionsEnabled ? 'Stripe checkout enabled' : 'Checkout unavailable'}
                  </Badge>
                  <p className="text-sm leading-6 text-[#a7a9b0]">Plan names, prices, monthly credits, and feature text are editable from backend site settings.</p>
                  {paymentProviderNotice ? <p className="text-sm leading-6 text-[#8f9199]">{paymentProviderNotice}</p> : null}
                </div>
              </div>
            </BorderComboFrame1>
          </div>
        </section>

        <section className="mx-auto max-w-[1600px] px-4 py-4 sm:px-6">
          <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
            <BorderComboFrame2Variant className="min-h-[396px] bg-[#1c1c20]" style={{ pointerEvents: 'auto' }}>
              <div className="flex h-[404px] flex-col gap-4 p-1">
                <p className="text-xs uppercase tracking-[0.24em] text-[#8f7a4a]">Current subscription</p>
                <h2 className="text-3xl font-semibold tracking-tight text-[#f1e2bc]">{currentPlan}</h2>
                <FreePlanSummary />
                {shouldSync && syncSessionId ? <SubscriptionStatusSync enabled sessionId={syncSessionId} /> : null}
                {isCancelled ? <p className="text-sm leading-6 text-[#d8d0bf]">Checkout was cancelled. You can choose a plan again when ready.</p> : null}
                {activeSubscription ? (
                  <div className="grid gap-3 text-sm leading-6 text-[#a7a9b0]">
                    <p>Status: {formatSubscriptionStatus(activeSubscription.status)}</p>
                    <p>Monthly credits: {activeSubscription.monthlyCredits ?? 0}</p>
                    <p>Current period ends: {formatDateTime(activeSubscription.currentPeriodEnd)}</p>
                    {user ? <ManageSubscriptionButton /> : null}
                  </div>
                ) : (
                  <p className="mt-auto text-sm leading-6 text-[#a7a9b0]">
                    Subscribe to unlock a predictable monthly credit allowance. Credits support generation, delivery, downloads, and downstream order workflows.
                  </p>
                )}
              </div>
            </BorderComboFrame2Variant>

            <div className="grid gap-4 xl:grid-cols-3">
              {subscriptionPlans.map((plan) => {
                const isCurrentPlan = activeSubscription?.planKey === plan.key

                return (
                  <BorderComboFrame1 className="min-h-[500px] bg-[#1c1c20]" key={plan.key} style={{ pointerEvents: 'auto' }}>
                    <article className="flex h-[432px] flex-col gap-3 p-1">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.24em] text-[#8f7a4a]">{plan.shortLabel}</p>
                          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-[#f1e2bc]">{plan.name}</h2>
                        </div>
                        {isCurrentPlan ? <Badge variant="secondary">Current</Badge> : null}
                      </div>
                      <p className="min-h-[48px] text-sm leading-6 text-[#a7a9b0]">{plan.description}</p>
                      <Separator className="bg-[#403f46]" />
                      <div className="flex min-h-[84px] flex-col justify-center rounded-[8px] border border-[#403f46] bg-[#18181b] p-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-[#8f7a4a]">Monthly allowance</p>
                        <p className="mt-1 text-2xl font-semibold tracking-tight text-[#f0d188]">{plan.creditsPerMonth} credits</p>
                      </div>
                      <BillingComparison plan={plan} />
                      <ul className="grid h-[90px] content-start gap-2 overflow-hidden text-sm leading-6 text-[#9b9da5]">
                        {plan.features.map((feature) => (
                          <li key={feature}>{feature}</li>
                        ))}
                      </ul>
                      <div className="mt-auto pt-4">
                        <PlanAction {...props} isCurrentPlan={isCurrentPlan} plan={plan} />
                      </div>
                    </article>
                  </BorderComboFrame1>
                )
              })}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6">
          <div className="grid gap-4 lg:grid-cols-2">
            <SupportPanel
              body="Subscriptions provide predictable monthly capacity. Credits can still support flexible usage, and physical print fulfillment remains an order-based workflow."
              eyebrow="Beyond subscriptions"
              title="Credits and print orders stay modular."
            />

            <SupportPanel
              body="Subscribe actions still call the existing checkout endpoint, success returns still sync subscription status, and active users can open the existing billing portal."
              eyebrow="Billing flow"
              title="Existing checkout and portal endpoints are preserved."
            />
          </div>
        </section>

        <FooterBar footerContent={footerContent} siteDescription={siteDescription} supportEmail={supportEmail} />
      </div>
    </>
  )
}
