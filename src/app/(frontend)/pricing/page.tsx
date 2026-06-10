import { getCachedPayload } from '@/lib/getCachedPayload'
import { getCreditTopupProducts } from '@/lib/getCreditTopupProducts'
import { getPaymentProviderSettings } from '@/lib/paymentProviders'
import { getSubscriptionPlans } from '@/lib/subscriptionPlans'

import { SiteShell } from '../_components/SiteShell'
import { SubscriptionMobilePage, SubscriptionPage } from '../_components/SubscriptionPage'
import { getMarketingPageContent } from '../_lib/formal-page-content'
import { getMarketingSiteData } from '../_lib/marketing'
import { getCurrentUser, getCurrentUserActiveSubscription } from '../_lib/session'

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string; credits_checkout?: string; session_id?: string }>
}) {
  const payload = await getCachedPayload()
  const [user, activeSubscription, query, subscriptionPlans, creditTopupProducts, paymentProviders, marketing, pageContent] =
    await Promise.all([
      getCurrentUser(),
      getCurrentUserActiveSubscription(),
      searchParams,
      getSubscriptionPlans(payload),
      getCreditTopupProducts(payload),
      getPaymentProviderSettings(payload),
      getMarketingSiteData(),
      getMarketingPageContent('pricing'),
    ])

  const shouldSync = Boolean(user && query.checkout === 'success' && query.session_id)
  const shouldSyncCreditTopup = Boolean(user && query.credits_checkout === 'success' && query.session_id)
  const isCancelled = query.checkout === 'cancelled'
  const isCreditTopupCancelled = query.credits_checkout === 'cancelled'
  const stripeSubscriptionsEnabled = paymentProviders.subscriptionProvider === 'stripe'
  const stripeCreditTopupsEnabled = paymentProviders.orderProvider === 'stripe'
  const { siteSettings } = marketing
  const subscriptionPageProps = {
    activeSubscription,
    creditTopupProducts,
    footerContent: siteSettings.footer,
    isCreditTopupCancelled,
    isCancelled,
    pageContent,
    paymentProviderNotice: paymentProviders.providerNotice,
    shouldSyncCreditTopup,
    shouldSync,
    siteDescription: siteSettings.siteDescription || 'An AI 3D product platform for character creation, asset management, and print fulfillment.',
    stripeCreditTopupsEnabled,
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
