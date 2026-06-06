import Link from 'next/link'

import { BorderComboFrame1 } from '@/components/ui-lab/border-combo-frame-1'
import { BorderComboFrame2Variant } from '@/components/ui-lab/border-combo-frame-2'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import type { SubscriptionPlanDefinition } from '@/lib/subscriptionPlans'

import { FooterBar } from './shell/FooterBar'
import { CreditTopupButton } from './CreditTopupButton'
import { CreditTopupStatusSync } from './CreditTopupStatusSync'
import { ManageSubscriptionButton } from './ManageSubscriptionButton'
import { PricingLoginButton } from './PricingLoginButton'
import { PricingSubscriptionPanel } from './PricingSubscriptionPanel'
import { SubscribePlanButton } from './SubscribePlanButton'
import { SubscriptionStatusSync } from './SubscriptionStatusSync'
import type { FooterContent, MarketingPageContent, MarketingSection } from '../_lib/marketing-content'
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

type CreditTopupProduct = {
  credits: number
  currency: string
  description?: null | string
  id: number
  price: number
  slug: string
  title: string
}

type SubscriptionPageProps = {
  activeSubscription: ActiveSubscription
  creditTopupProducts: CreditTopupProduct[]
  footerContent: FooterContent
  isCreditTopupCancelled: boolean
  isCancelled: boolean
  pageContent: MarketingPageContent
  paymentProviderNotice?: string | null
  shouldSyncCreditTopup: boolean
  shouldSync: boolean
  siteDescription: string
  stripeCreditTopupsEnabled: boolean
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

function CreditTopupAction({
  product,
  stripeCreditTopupsEnabled,
  user,
}: {
  product: CreditTopupProduct
  stripeCreditTopupsEnabled: boolean
  user: CurrentUser
}) {
  if (!user) {
    return <PricingLoginButton />
  }

  return <CreditTopupButton disabled={!stripeCreditTopupsEnabled} productId={product.id} />
}

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    currency: currency || 'USD',
    maximumFractionDigits: 2,
    style: 'currency',
  }).format(amount)
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

function SupportPanel({
  body,
  eyebrow,
  section,
  title,
}: {
  body: string
  eyebrow: string
  section?: MarketingSection
  title: string
}) {
  return (
    <div className="min-h-[180px] border-y border-[#403f46] bg-[#1c1c20]/72 px-6 py-7 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <p className="text-xs uppercase tracking-[0.24em] text-[#8f7a4a]">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#f1e2bc]">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-[#a7a9b0]">{body}</p>
      {section?.cards?.length ? (
        <div className="mt-5 grid gap-3">
          {section.cards.map((card) => (
            <div className="rounded-[8px] border border-[#403f46] bg-[#18181b] p-4" key={card.title}>
              <div className="flex flex-wrap items-center gap-2">
                <strong className="text-sm font-semibold text-[#f1e2bc]">{card.title}</strong>
                {card.note ? <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#d6ad61]">{card.note}</span> : null}
              </div>
              <p className="mt-2 text-sm leading-6 text-[#9b9da5]">{card.text}</p>
            </div>
          ))}
        </div>
      ) : null}
      {section?.bullets?.length ? (
        <ul className="mt-5 grid gap-2 text-sm leading-6 text-[#9b9da5]">
          {section.bullets.map((bullet) => (
            <li className="border-l border-[#8d5c25] pl-3" key={bullet}>
              {bullet}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

export function SubscriptionMobilePage(props: SubscriptionPageProps) {
  const {
    activeSubscription,
    creditTopupProducts,
    footerContent,
    pageContent,
    siteDescription,
    stripeCreditTopupsEnabled,
    subscriptionPlans,
    supportEmail,
    user,
  } = props

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
              {pageContent.heroEyebrow}
            </Badge>
            <h1 className="text-3xl font-semibold leading-tight tracking-tight text-[#f5ead0]">{pageContent.heroTitle}</h1>
            <p className="text-sm leading-6 text-[#b9bac0]">{pageContent.heroText}</p>
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

        {creditTopupProducts.length > 0 ? (
          <section className="grid gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-[#8f7a4a]">Credit packs</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight text-[#f1e2bc]">One-time top-ups</h2>
            </div>
            {creditTopupProducts.map((product) => (
              <BorderComboFrame1 className="bg-[#1c1c20]" key={product.id} style={{ pointerEvents: 'auto' }}>
                <div className="flex flex-col gap-4 p-1">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-[#8f7a4a]">{product.credits} credits</p>
                    <h3 className="mt-1 text-xl font-semibold tracking-tight text-[#f1e2bc]">{product.title}</h3>
                  </div>
                  {product.description ? <p className="text-sm leading-6 text-[#a7a9b0]">{product.description}</p> : null}
                  <p className="text-2xl font-semibold tracking-tight text-[#f0d188]">{formatMoney(product.price, product.currency)}</p>
                  <CreditTopupAction product={product} stripeCreditTopupsEnabled={stripeCreditTopupsEnabled} user={user} />
                </div>
              </BorderComboFrame1>
            ))}
          </section>
        ) : null}

        {pageContent.sections.length > 0 ? (
          <section className="grid gap-4">
            {pageContent.sections.slice(0, 2).map((section) => (
              <SupportPanel body={section.text} eyebrow={section.eyebrow} key={section.id} section={section} title={section.title} />
            ))}
          </section>
        ) : null}
      </main>

      <FooterBar footerContent={footerContent} siteDescription={siteDescription} supportEmail={supportEmail} />
    </div>
  )
}

export function SubscriptionPage(props: SubscriptionPageProps) {
  const {
    activeSubscription,
    creditTopupProducts,
    footerContent,
    isCreditTopupCancelled,
    isCancelled,
    paymentProviderNotice,
    shouldSyncCreditTopup,
    shouldSync,
    siteDescription,
    stripeCreditTopupsEnabled,
    stripeSubscriptionsEnabled,
    subscriptionPlans,
    pageContent,
    supportEmail,
    syncSessionId,
    user,
  } = props

  return (
    <div className="h-[1020px] overflow-y-auto bg-[radial-gradient(circle_at_50%_9%,rgba(45,64,126,0.34),transparent_34%),radial-gradient(circle_at_16%_18%,rgba(155,112,45,0.14),transparent_28%),linear-gradient(180deg,#111111_0%,#181818_46%,#111111_100%)]">
      <section className="mx-auto flex min-h-[960px] max-w-[1600px] items-start justify-center px-4 pb-10 pt-[49px]">
        {shouldSync && syncSessionId ? <SubscriptionStatusSync enabled sessionId={syncSessionId} /> : null}
        {shouldSyncCreditTopup && syncSessionId ? <CreditTopupStatusSync enabled sessionId={syncSessionId} /> : null}
        <PricingSubscriptionPanel
          activeSubscription={activeSubscription}
          isCancelled={isCancelled}
          paymentProviderNotice={paymentProviderNotice}
          stripeSubscriptionsEnabled={stripeSubscriptionsEnabled}
          subscriptionPlans={subscriptionPlans}
          user={user}
        />
      </section>
      {isCreditTopupCancelled ? (
        <p className="mx-auto mb-4 max-w-[720px] px-4 text-center text-sm leading-6 text-[#d8d0bf]">
          Credit checkout was cancelled. You can choose a pack again when ready.
        </p>
      ) : null}
      <FooterBar footerContent={footerContent} siteDescription={siteDescription} supportEmail={supportEmail} />
    </div>
  )

}
