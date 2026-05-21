import { getCachedPayload } from '@/lib/getCachedPayload'
import type { FooterContent } from './marketing-content'
import { getDefaultFooterLinkGroups, getDefaultHomepageContent, getDefaultSiteSettings } from './marketing-content'
import { getCurrentLocale } from './locale-server'

type NullablePartial<T> = { [K in keyof T]?: null | T[K] }
type SiteSettingsInput = {
  creditPackages?: unknown
  footer?: unknown
  generationPricing?: unknown
  headerNav?: unknown
  supportEmail?: unknown
}

const pickArray = <T,>(value: null | T[] | undefined, fallback: T[]) => {
  return Array.isArray(value) && value.length > 0 ? value : fallback
}

const mergeNullableObject = <T extends Record<string, unknown>>(
  fallback: T,
  value: null | undefined | { [K in keyof T]?: null | T[K] },
): T => {
  const merged = { ...fallback }

  if (!value) return merged

  for (const key of Object.keys(value) as Array<keyof T>) {
    const nextValue = value[key]

    if (nextValue !== null && nextValue !== undefined) {
      merged[key] = nextValue
    }
  }

  return merged
}

function mergeSiteSettings(
  defaultSiteSettings: ReturnType<typeof getDefaultSiteSettings>,
  siteSettings: null | undefined | SiteSettingsInput,
) {
  const supportEmail =
    typeof siteSettings?.supportEmail === 'string' && siteSettings.supportEmail
      ? siteSettings.supportEmail
      : defaultSiteSettings.supportEmail
  const footerInput =
    siteSettings?.footer && typeof siteSettings.footer === 'object' && !Array.isArray(siteSettings.footer)
      ? (siteSettings.footer as NullablePartial<FooterContent>)
      : null
  const generationPricingInput =
    siteSettings?.generationPricing && typeof siteSettings.generationPricing === 'object' && !Array.isArray(siteSettings.generationPricing)
      ? siteSettings.generationPricing
      : null
  const footer = mergeNullableObject<FooterContent>(defaultSiteSettings.footer, footerInput)
  const footerLinkGroups = pickArray(footer.linkGroups, getDefaultFooterLinkGroups(supportEmail))

  return {
    ...defaultSiteSettings,
    ...siteSettings,
    supportEmail,
    creditPackages: pickArray(
      Array.isArray(siteSettings?.creditPackages)
        ? (siteSettings.creditPackages as typeof defaultSiteSettings.creditPackages)
        : null,
      defaultSiteSettings.creditPackages,
    ),
    footer: {
      ...footer,
      linkGroups: footerLinkGroups,
    },
    generationPricing: {
      ...defaultSiteSettings.generationPricing,
      ...generationPricingInput,
    },
    headerNav: pickArray(
      Array.isArray(siteSettings?.headerNav)
        ? (siteSettings.headerNav as typeof defaultSiteSettings.headerNav)
        : null,
      defaultSiteSettings.headerNav,
    ),
  }
}

export async function getMarketingSiteSettings() {
  const locale = await getCurrentLocale()
  const defaultSiteSettings = getDefaultSiteSettings(locale)

  try {
    const payload = await getCachedPayload()
    const siteSettings = await payload.findGlobal({
      slug: 'site-settings',
      locale: locale as never,
      overrideAccess: true,
      fallbackLocale: 'en' as never,
    })

    return mergeSiteSettings(defaultSiteSettings, siteSettings)
  } catch {
    return defaultSiteSettings
  }
}

export async function getMarketingSiteData() {
  const locale = await getCurrentLocale()
  const defaultHomepageContent = getDefaultHomepageContent(locale)
  const defaultSiteSettings = getDefaultSiteSettings(locale)

  try {
    const payload = await getCachedPayload()
    const [siteSettings, homepageContent] = await Promise.all([
      payload.findGlobal({
        slug: 'site-settings',
        locale: locale as never,
        overrideAccess: true,
        fallbackLocale: 'en' as never,
      }),
      payload.findGlobal({
        slug: 'homepage-content',
        locale: locale as never,
        fallbackLocale: 'en' as never,
      }),
    ])

    return {
      homepageContent: {
        ...defaultHomepageContent,
        ...homepageContent,
        collectionShelf: {
          ...defaultHomepageContent.collectionShelf,
          ...homepageContent?.collectionShelf,
        },
        entrySection: {
          ...defaultHomepageContent.entrySection,
          ...homepageContent?.entrySection,
        },
        faq: pickArray(homepageContent?.faq, defaultHomepageContent.faq),
        faqSection: {
          ...defaultHomepageContent.faqSection,
          ...homepageContent?.faqSection,
        },
        featuredRail: {
          ...defaultHomepageContent.featuredRail,
          ...homepageContent?.featuredRail,
        },
        featuredWorks: pickArray(homepageContent?.featuredWorks, defaultHomepageContent.featuredWorks),
        hero: {
          ...defaultHomepageContent.hero,
          ...homepageContent?.hero,
          primaryCTA: {
            ...defaultHomepageContent.hero.primaryCTA,
            ...homepageContent?.hero?.primaryCTA,
          },
          secondaryCTA: {
            ...defaultHomepageContent.hero.secondaryCTA,
            ...homepageContent?.hero?.secondaryCTA,
          },
        },
        introBand: {
          ...defaultHomepageContent.introBand,
          ...homepageContent?.introBand,
        },
        processSection: {
          ...defaultHomepageContent.processSection,
          ...homepageContent?.processSection,
        },
        processSteps: pickArray(homepageContent?.processSteps, defaultHomepageContent.processSteps),
        serviceBlocks: pickArray(homepageContent?.serviceBlocks, defaultHomepageContent.serviceBlocks),
        serviceIntro: {
          ...defaultHomepageContent.serviceIntro,
          ...homepageContent?.serviceIntro,
        },
        useCases: pickArray(homepageContent?.useCases, defaultHomepageContent.useCases),
      },
      siteSettings: mergeSiteSettings(defaultSiteSettings, siteSettings),
    }
  } catch {
    return {
      homepageContent: defaultHomepageContent,
      siteSettings: defaultSiteSettings,
    }
  }
}
