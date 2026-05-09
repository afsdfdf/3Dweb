import { getCachedPayload } from '@/lib/getCachedPayload'
import type { FooterContent } from './marketing-content'
import { getDefaultFooterLinkGroups, getDefaultHomepageContent, getDefaultSiteSettings } from './marketing-content'
import { getCurrentLocale } from './locale-server'

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

    const supportEmail = siteSettings?.supportEmail || defaultSiteSettings.supportEmail
    const footer = mergeNullableObject<FooterContent>(defaultSiteSettings.footer, siteSettings?.footer)
    const footerLinkGroups = pickArray(footer.linkGroups, getDefaultFooterLinkGroups(supportEmail))

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
      siteSettings: {
        ...defaultSiteSettings,
        ...siteSettings,
        creditPackages: pickArray(siteSettings?.creditPackages, defaultSiteSettings.creditPackages),
        footer: {
          ...footer,
          linkGroups: footerLinkGroups,
        },
        generationPricing: {
          ...defaultSiteSettings.generationPricing,
          ...siteSettings?.generationPricing,
        },
        headerNav: pickArray(siteSettings?.headerNav, defaultSiteSettings.headerNav),
      },
    }
  } catch {
    return {
      homepageContent: defaultHomepageContent,
      siteSettings: defaultSiteSettings,
    }
  }
}
