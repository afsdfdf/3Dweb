import { getCachedPayload } from '@/lib/getCachedPayload'
import { getPaymentProviderSettings } from '@/lib/paymentProviders'
import { getSubscriptionPlans } from '@/lib/subscriptionPlans'

import { SiteShell } from '../_components/SiteShell'
import { SubscriptionMobilePage, SubscriptionPage } from '../_components/SubscriptionPage'
import { getMarketingSiteData } from '../_lib/marketing'
import { getCurrentUser, getCurrentUserActiveSubscription } from '../_lib/session'

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string; session_id?: string }>
}) {
  const payload = await getCachedPayload()
  const [user, activeSubscription, query, subscriptionPlans, paymentProviders, marketing] = await Promise.all([
    getCurrentUser(),
    getCurrentUserActiveSubscription(),
    searchParams,
    getSubscriptionPlans(payload),
    getPaymentProviderSettings(payload),
    getMarketingSiteData(),
  ])

  const shouldSync = Boolean(user && query.checkout === 'success' && query.session_id)
  const isCancelled = query.checkout === 'cancelled'
  const stripeSubscriptionsEnabled = paymentProviders.subscriptionProvider === 'stripe'
  const { siteSettings } = marketing
  const subscriptionPageProps = {
    activeSubscription,
    footerContent: siteSettings.footer,
    isCancelled,
    paymentProviderNotice: paymentProviders.providerNotice,
    shouldSync,
    siteDescription: siteSettings.siteDescription || 'An AI 3D product platform for character creation, asset management, and print fulfillment.',
    stripeSubscriptionsEnabled,
    subscriptionPlans,
    supportEmail: siteSettings.supportEmail || 'support@example.com',
    syncSessionId: query.session_id,
    user,
  }

  return (
    <SiteShell
      announcement={siteSettings.announcement}
      currentPath="/pricing"
      footer={siteSettings.footer}
      mobileChildren={<SubscriptionMobilePage {...subscriptionPageProps} />}
      navigation={siteSettings.headerNav}
      showFooter={false}
      user={user}
    >
      <SubscriptionPage {...subscriptionPageProps} />
    </SiteShell>
  )
}
