'use client'

import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'

import { apiFetch } from '@/app/(frontend)/_lib/apiFetch'
import { useAuthModal } from '@/components/auth/AuthModalProvider'
import {
  SubscriptionPanel,
  type SubscriptionBillingCycle,
  type SubscriptionPanelPlan,
} from '@/components/ui-lab/subscription-panel'
import type { SubscriptionPlanDefinition } from '@/lib/subscriptionPlans'

type CurrentUser = {
  email?: string | null
} | null

type ActiveSubscription = {
  currentPeriodEnd?: string | null
  monthlyCredits?: number | null
  planKey?: string | null
  status?: string | null
} | null

type PricingSubscriptionPanelProps = {
  activeSubscription: ActiveSubscription
  isCancelled: boolean
  paymentProviderNotice?: string | null
  stripeSubscriptionsEnabled: boolean
  subscriptionPlans: SubscriptionPlanDefinition[]
  user: CurrentUser
}

function formatPanelPrice(value: number) {
  const amount = Number.isFinite(value) ? value : 0
  return `$ ${amount.toLocaleString('en-US', {
    maximumFractionDigits: 2,
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
  })}`
}

function normalizeFeatures(plan: SubscriptionPlanDefinition) {
  const features = plan.features.filter((feature) => feature.trim())
  return features.length > 0 ? features : [`${plan.creditsPerMonth} credits per month`]
}

export function PricingSubscriptionPanel({
  activeSubscription,
  isCancelled,
  paymentProviderNotice,
  stripeSubscriptionsEnabled,
  subscriptionPlans,
  user,
}: PricingSubscriptionPanelProps) {
  const router = useRouter()
  const { openAuthModal } = useAuthModal()
  const [loadingPlanKey, setLoadingPlanKey] = useState<null | string>(null)
  const [message, setMessage] = useState('')
  const [messageTone, setMessageTone] = useState<'error' | 'info'>('info')
  const [billingCycle, setBillingCycle] = useState<SubscriptionBillingCycle>('yearly')

  const panelPlans = useMemo<SubscriptionPanelPlan[]>(() => {
    return subscriptionPlans.map((plan) => {
      const isCurrentPlan = activeSubscription?.planKey === plan.key
      const isLoading = loadingPlanKey === plan.key
      const isDisabled = Boolean(user && !isCurrentPlan && !stripeSubscriptionsEnabled) || Boolean(loadingPlanKey && !isLoading)
      const cyclePrice = billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice
      const yearlyOriginalPrice = plan.monthlyPrice * 12
      const originalPrice =
        billingCycle === 'yearly' && yearlyOriginalPrice > cyclePrice ? formatPanelPrice(yearlyOriginalPrice) : undefined

      return {
        ctaDisabled: isDisabled,
        ctaLabel: !user
          ? 'Sign In'
          : isCurrentPlan
            ? isLoading
              ? 'Opening'
              : 'Manage'
            : isLoading
              ? 'Redirecting'
              : stripeSubscriptionsEnabled
                ? 'Subscribe Now'
                : 'Unavailable',
        description: plan.description,
        features: normalizeFeatures(plan),
        id: plan.key,
        originalPrice,
        price: formatPanelPrice(cyclePrice),
        priceIntervalLabel: billingCycle === 'yearly' ? 'Year' : 'Month',
        subtitle: plan.shortLabel,
        title: plan.name,
      }
    })
  }, [activeSubscription?.planKey, billingCycle, loadingPlanKey, stripeSubscriptionsEnabled, subscriptionPlans, user])

  const openPortal = async (planKey: string) => {
    setLoadingPlanKey(planKey)
    setMessage('')

    try {
      const response = await apiFetch('/api/billing/subscriptions/portal', {
        
        method: 'POST',
      })
      const json = await response.json()

      if (!response.ok) {
        throw new Error(json.message || 'Failed to open subscription management.')
      }

      if (json.portalUrl && typeof window !== 'undefined') {
        window.location.assign(json.portalUrl)
        return
      }

      router.refresh()
    } catch (error) {
      setMessageTone('error')
      setMessage(error instanceof Error ? error.message : 'Failed to open subscription management.')
    } finally {
      setLoadingPlanKey(null)
    }
  }

  const openCheckout = async (planKey: string) => {
    setLoadingPlanKey(planKey)
    setMessage('')

    try {
      const response = await apiFetch('/api/billing/subscriptions/checkout', {
        body: JSON.stringify({ billingCycle, planKey }),
        
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })
      const json = await response.json()

      if (!response.ok) {
        throw new Error(json.message || 'Failed to create subscription checkout.')
      }

      if (json.checkoutUrl && typeof window !== 'undefined') {
        window.location.assign(json.checkoutUrl)
        return
      }

      router.refresh()
    } catch (error) {
      setMessageTone('error')
      setMessage(error instanceof Error ? error.message : 'Failed to create subscription checkout.')
    } finally {
      setLoadingPlanKey(null)
    }
  }

  const handleSubscribe = (plan: SubscriptionPanelPlan) => {
    if (loadingPlanKey) return

    if (!user) {
      openAuthModal('login')
      return
    }

    const selectedPlan = subscriptionPlans.find((item) => item.key === plan.id)
    if (!selectedPlan) return

    if (activeSubscription?.planKey === selectedPlan.key) {
      void openPortal(selectedPlan.key)
      return
    }

    if (!stripeSubscriptionsEnabled) {
      setMessageTone('error')
      setMessage(paymentProviderNotice || 'Subscription checkout is unavailable.')
      return
    }

    void openCheckout(selectedPlan.key)
  }

  const statusMessage = message || (isCancelled ? 'Checkout was cancelled. You can choose a plan again when ready.' : '')

  return (
    <div className="grid justify-items-center gap-3">
      <SubscriptionPanel
        billingCycle={billingCycle}
        currencies={['USD']}
        onClose={() => router.push('/')}
        onBillingCycleChange={setBillingCycle}
        onSubscribe={handleSubscribe}
        plans={panelPlans}
      />
      {paymentProviderNotice ? <p className="max-w-[720px] text-center text-sm leading-6 text-[#a7a9b0]">{paymentProviderNotice}</p> : null}
      {statusMessage ? (
        <p
          className={[
            'max-w-[720px] text-center text-sm leading-6',
            messageTone === 'error' ? 'text-[#ffb3a8]' : 'text-[#d8d0bf]',
          ].join(' ')}
        >
          {statusMessage}
        </p>
      ) : null}
    </div>
  )
}
