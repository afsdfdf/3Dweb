import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'

import { listSubscriptionPlansEndpoint } from '../src/endpoints/subscriptions.ts'
import {
  hasSubscriptionCreditGrantStatus,
  hasSubscriptionEntitlementStatus,
  subscriptionCheckoutBlockingStatuses,
} from '../src/lib/subscriptionStatus.ts'

const rootDir = process.cwd()
const topNavigationPath = path.join(rootDir, 'src', 'components', 'ui-lab', 'top-navigation', 'top-navigation.tsx')
const topNavigationCssPath = path.join(rootDir, 'src', 'components', 'ui-lab', 'top-navigation', 'top-navigation.module.css')
const siteSettingsPath = path.join(rootDir, 'src', 'globals', 'SiteSettings.ts')
const marketingContentPath = path.join(rootDir, 'src', 'app', '(frontend)', '_lib', 'marketing-content.ts')
const marketingPath = path.join(rootDir, 'src', 'app', '(frontend)', '_lib', 'marketing.ts')
const sessionPath = path.join(rootDir, 'src', 'app', '(frontend)', '_lib', 'session.ts')
const subscriptionsEndpointPath = path.join(rootDir, 'src', 'endpoints', 'subscriptions.ts')
const payloadConfigPath = path.join(rootDir, 'src', 'payload.config.ts')
const crownAssetPath = path.join(rootDir, 'public', 'ui-lab', 'top-navigation', 'icon-crown-subscribe.png')
const homePagePath = path.join(rootDir, 'src', 'app', '(frontend)', 'page.tsx')
const packageJsonPath = path.join(rootDir, 'package.json')
const uiMatrixScriptPath = path.join(rootDir, 'scripts', 'audit-ui-matrix.mjs')

test('site settings owns editable top-navigation subscription promotion copy', () => {
  const settingsSource = readFileSync(siteSettingsPath, 'utf8')
  const marketingSource = readFileSync(marketingContentPath, 'utf8')
  const marketingMergeSource = readFileSync(marketingPath, 'utf8')

  assert.match(settingsSource, /name:\s*['"]navigationPromotion['"]/)
  for (const fieldName of ['enabled', 'eyebrow', 'offerText', 'buttonLabel', 'buttonAriaLabel']) {
    assert.match(settingsSource, new RegExp(`name:\\s*['"]${fieldName}['"]`))
    assert.match(marketingSource, new RegExp(`${fieldName}[:?]`))
  }

  assert.match(marketingSource, /navigationPromotion:/)
  assert.match(marketingMergeSource, /navigationPromotionInput/)
  assert.match(marketingMergeSource, /defaultSiteSettings\.navigationPromotion/)
})

test('top navigation summarizes subscription promotion state and opens the subscription dialog', () => {
  assert.equal(existsSync(crownAssetPath), true)

  const source = readFileSync(topNavigationPath, 'utf8')
  const cssSource = readFileSync(topNavigationCssPath, 'utf8')

  assert.match(source, /SubscriptionPanel/)
  assert.match(source, /TopNavigationPromotion/)
  assert.match(source, /hasActiveSubscription/)
  assert.match(source, /data-subscription-promotion-visible/)
  assert.match(source, /icon-crown-subscribe\.png/)
  assert.match(source, /\/api\/billing\/subscriptions\/plans/)
  assert.match(source, /\/api\/billing\/subscriptions\/checkout/)
  assert.match(source, /billingCycle/)
  assert.doesNotMatch(source, /fallbackSubscriptionPlans/)
  assert.match(source, /openAuthModal\(['"]login['"]\)/)
  assert.match(source, /user\?\.hasActiveSubscription !== true/)
  assert.match(source, /subscriptionPromotionButtonRef/)
  assert.match(source, /restoreFocusRef/)
  assert.match(source, /aria-labelledby/)
  assert.match(source, /getFocusableDialogElements/)
  assert.match(source, /handleDialogKeyDown/)
  assert.match(source, /onClick=\{openCreditTopupDialog\}/)

  assert.match(cssSource, /\.subscriptionPromotion/)
  assert.match(cssSource, /\.subscriptionButton/)
  assert.match(cssSource, /\.subscriptionDialogOverlay/)
  assert.match(cssSource, /\.topNav\[data-subscription-promotion-visible=["']true["']\]/)
  assert.match(cssSource, /\.topNav\[data-authenticated=["']true["']\]\[data-subscription-promotion-visible=["']true["']\]\s+\.userName\s*\{[\s\S]*?width:\s*84px/)
  assert.match(cssSource, /--nav-center-width:\s*920px/)
})

test('homepage uses viewport-fitted top navigation so the promo state does not crush the header', () => {
  const homePageSource = readFileSync(homePagePath, 'utf8')

  assert.match(homePageSource, /<TopNavigation[\s\S]*fitViewport[\s\S]*subscriptionPromotion=\{data\.navigationPromotion\}/)
})

test('viewport-fitted top navigation keeps desktop controls at design size on ultrawide screens', () => {
  const cssSource = readFileSync(topNavigationCssPath, 'utf8')

  assert.match(cssSource, /@media \(min-width:\s*1921px\)\s*\{[\s\S]*\.scaledTopNav\s*\{[\s\S]*--top-navigation-scale:\s*1/)
  assert.match(cssSource, /@media \(min-width:\s*1921px\)\s*\{[\s\S]*\.scaledTopNav\s*\{[\s\S]*height:\s*60px/)
  assert.match(cssSource, /@media \(min-width:\s*1921px\)\s*\{[\s\S]*\.scaledTopNavStage\s*\{[\s\S]*transform:\s*none/)
  assert.match(cssSource, /@media \(min-width:\s*1921px\)\s*\{[\s\S]*\.scaledTopNavStage\s*>\s*\.topNav\s*\{[\s\S]*width:\s*100%/)
})

test('top navigation subscription promotion follows the design spacing metrics', () => {
  const cssSource = readFileSync(topNavigationCssPath, 'utf8')
  const topNavRule = cssSource.match(/\.topNav\s*\{[\s\S]*?\}/)?.[0] ?? ''
  const promotionRule = cssSource.match(/\.subscriptionPromotion\s*\{[\s\S]*?\}/)?.[0] ?? ''
  const promotionTextRule = cssSource.match(/\.subscriptionPromotion strong,\s*[\s\S]*?\.subscriptionPromotion span\s*\{[\s\S]*?\}/)?.[0] ?? ''
  const promotionStrongRule = cssSource.match(/\.subscriptionPromotion strong\s*\{[\s\S]*?\}/)?.[0] ?? ''
  const promotionSpanRules = [...cssSource.matchAll(/\.subscriptionPromotion span\s*\{[\s\S]*?\}/g)]
  const promotionSpanRule = promotionSpanRules[promotionSpanRules.length - 1]?.[0] ?? ''
  const buttonRule = cssSource.match(/\.subscriptionButton\s*\{[\s\S]*?\}/)?.[0] ?? ''
  const buttonSpanRule = cssSource.match(/\.subscriptionButton span\s*\{[\s\S]*?\}/)?.[0] ?? ''

  assert.match(topNavRule, /--subscription-promotion-right:\s*368px/)
  assert.match(topNavRule, /--subscription-button-right:\s*299px/)
  assert.match(promotionRule, /width:\s*65px/)
  assert.match(promotionRule, /height:\s*36px/)
  assert.match(promotionRule, /top:\s*12px/)
  assert.match(promotionRule, /line-height:\s*18px/)
  assert.match(promotionTextRule, /white-space:\s*nowrap/)
  assert.match(promotionStrongRule, /font-size:\s*12px/)
  assert.match(promotionStrongRule, /font-weight:\s*500/)
  assert.match(promotionSpanRule, /font-size:\s*12px/)
  assert.match(promotionSpanRule, /font-weight:\s*500/)
  assert.match(buttonRule, /width:\s*57px/)
  assert.match(buttonRule, /height:\s*26px/)
  assert.match(buttonRule, /gap:\s*3px/)
  assert.match(buttonRule, /top:\s*17px/)
  assert.match(buttonRule, /border-radius:\s*8px\s+2px\s+8px\s+2px/)
  assert.doesNotMatch(buttonRule, /border-image/)
  assert.match(buttonRule, /background-clip:\s*padding-box,\s*border-box/)
  assert.match(buttonRule, /background:\s*linear-gradient\(180deg,\s*#f6d88e\s*0%,\s*#f0cd76\s*100%\)/i)
  assert.match(buttonRule, /box-shadow:[\s\S]*inset 0 0 8px 0 #ffe5ad/i)
  assert.match(buttonSpanRule, /width:\s*25px/)
  assert.match(buttonSpanRule, /height:\s*18px/)
  assert.match(buttonSpanRule, /font-family:\s*var\(--nav-font-family\)/)
  assert.match(buttonSpanRule, /font-weight:\s*500/)
  assert.match(buttonSpanRule, /font-size:\s*12px/)
  assert.match(buttonSpanRule, /color:\s*#1b1b1b/i)
  assert.match(buttonSpanRule, /line-height:\s*18px/)
  assert.match(buttonSpanRule, /text-align:\s*left/)
  assert.match(buttonSpanRule, /font-style:\s*normal/)
  assert.match(buttonSpanRule, /overflow:\s*visible/)
  assert.match(buttonSpanRule, /text-overflow:\s*clip/)
})

test('navigation session and subscription endpoints expose only safe summary data', () => {
  const sessionSource = readFileSync(sessionPath, 'utf8')
  const endpointsSource = readFileSync(subscriptionsEndpointPath, 'utf8')
  const payloadConfigSource = readFileSync(payloadConfigPath, 'utf8')

  assert.match(sessionSource, /collection:\s*["']billing-subscriptions["']/)
  assert.match(sessionSource, /overrideAccess:\s*false/)
  assert.match(sessionSource, /hasActiveSubscription/)
  assert.match(sessionSource, /subscriptionEntitlementStatuses/)
  assert.match(sessionSource, /hasSubscriptionEntitlementStatus/)

  assert.match(endpointsSource, /listSubscriptionPlansEndpoint/)
  assert.match(endpointsSource, /path:\s*['"]\/billing\/subscriptions\/plans['"]/)
  assert.match(endpointsSource, /getSubscriptionPlans/)
  assert.match(endpointsSource, /toPublicSubscriptionPlan/)
  assert.match(endpointsSource, /Omit<SubscriptionPlanDefinition,\s*['"]lookupKey['"]\s*\|\s*['"]yearlyLookupKey['"]>/)
  assert.match(endpointsSource, /getPaymentProviderSettings/)
  assert.match(endpointsSource, /stripeSubscriptionsEnabled/)
  assert.match(payloadConfigSource, /listSubscriptionPlansEndpoint/)
})

test('public subscription plans endpoint returns editable prices without Stripe lookup keys', async () => {
  const response = await listSubscriptionPlansEndpoint.handler({
    payload: {
      findGlobal: async () => ({
        paymentProviders: {
          providerNotice: 'Stripe is live.',
          subscriptionProvider: 'stripe',
        },
        subscriptionPlans: {
          pro: {
            creditsPerMonth: 880,
            monthlyPrice: 59,
            name: 'Pro Plus',
            yearlyPrice: 470.4,
          },
        },
      }),
    },
  } as never)

  const body = await response.json()
  const proPlan = body.plans.find((plan: Record<string, unknown>) => plan.key === 'pro')

  assert.equal(response.status, 200)
  assert.equal(body.stripeSubscriptionsEnabled, true)
  assert.equal(body.paymentProviderNotice, 'Stripe is live.')
  assert.equal(proPlan.monthlyPrice, 59)
  assert.equal(proPlan.yearlyPrice, 470.4)
  assert.equal(proPlan.creditsPerMonth, 880)
  assert.equal(proPlan.name, 'Pro Plus')
  assert.equal('lookupKey' in proPlan, false)
  assert.equal('yearlyLookupKey' in proPlan, false)
})

test('public subscription plans endpoint fails closed when billing settings cannot be read', async () => {
  const response = await listSubscriptionPlansEndpoint.handler({
    payload: {
      findGlobal: async () => {
        throw new Error('site settings unavailable')
      },
    },
  } as never)

  const body = await response.json()

  assert.equal(response.status, 503)
  assert.equal(body.stripeSubscriptionsEnabled, false)
  assert.equal(Array.isArray(body.plans), true)
  assert.equal(body.plans.length, 0)
  assert.match(body.message, /temporarily unavailable/i)
})

test('subscription status helpers separate checkout blocking from paid entitlement and credit grants', () => {
  assert.equal(subscriptionCheckoutBlockingStatuses.includes('incomplete'), true)
  assert.equal(hasSubscriptionEntitlementStatus('active'), true)
  assert.equal(hasSubscriptionEntitlementStatus('past_due'), true)
  assert.equal(hasSubscriptionEntitlementStatus('incomplete'), false)
  assert.equal(hasSubscriptionCreditGrantStatus('trialing'), true)
  assert.equal(hasSubscriptionCreditGrantStatus('past_due'), false)
  assert.equal(hasSubscriptionCreditGrantStatus('incomplete'), false)
})

test('project provides a formal multi-resolution UI matrix audit script', () => {
  const packageSource = readFileSync(packageJsonPath, 'utf8')

  assert.match(packageSource, /"audit:ui-matrix"/)
  assert.equal(existsSync(uiMatrixScriptPath), true)

  const scriptSource = readFileSync(uiMatrixScriptPath, 'utf8')
  assert.match(scriptSource, /2560[\s\S]*1080/)
  assert.match(scriptSource, /3440[\s\S]*1440/)
  assert.match(scriptSource, /\/workbench/)
  assert.match(scriptSource, /\/model-detail/)
  assert.match(scriptSource, /scrollWidth/)
  assert.match(scriptSource, /AUDIT_BASE_URL/)
})
