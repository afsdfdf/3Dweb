import { getCachedPayload } from '@/lib/getCachedPayload'

import type { FormalPageContent, FormalPageSection } from './formal-pages'
import { formalPages } from './formal-pages'
import { getCurrentLocale } from './locale-server'
import type { MarketingCard, MarketingPageContent, MarketingSection } from './marketing-content'
import { getMarketingPages, marketingPages } from './marketing-content'

export type FormalPageKey = keyof typeof formalPages
export type MarketingPageKey = keyof typeof marketingPages

type CTAContent = {
  href: string
  label: string
}

type CMSFormalPage = Partial<Omit<FormalPageContent, 'contactCards' | 'heroPrimaryCTA' | 'heroSecondaryCTA' | 'sections' | 'summaryCards'>> & {
  contactCards?: null | Array<Partial<NonNullable<FormalPageContent['contactCards']>[number]>>
  heroPrimaryCTA?: null | Partial<CTAContent>
  heroSecondaryCTA?: null | Partial<CTAContent>
  pageKey?: null | string
  sections?: null | Array<
    Partial<Omit<FormalPageSection, 'items'>> & {
      items?: null | Array<Partial<NonNullable<FormalPageSection['items']>[number]>>
    }
  >
  summaryCards?: null | Array<Partial<FormalPageContent['summaryCards'][number]>>
}

type CMSMarketingPage = Partial<Omit<MarketingPageContent, 'heroPrimaryCTA' | 'heroSecondaryCTA' | 'sections'>> & {
  heroPrimaryCTA?: null | Partial<CTAContent>
  heroSecondaryCTA?: null | Partial<CTAContent>
  pageKey?: null | string
  sections?: null | Array<
    Partial<Omit<MarketingSection, 'bullets' | 'cards' | 'id'>> & {
      anchorId?: null | string
      bullets?: null | Array<Partial<{ label: string }>>
      cards?: null | Array<Partial<MarketingCard>>
    }
  >
}

type FormalPagesGlobalContent = {
  infoPages?: null | CMSFormalPage[]
  marketingPages?: null | CMSMarketingPage[]
}

const hasText = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0

function pickText(value: unknown, fallback: string) {
  return hasText(value) ? value.trim() : fallback
}

function pickOptionalText(value: unknown) {
  return hasText(value) ? value.trim() : undefined
}

function resolveCTA(fallback: CTAContent, value?: null | Partial<CTAContent>): CTAContent {
  return {
    href: pickText(value?.href, fallback.href),
    label: pickText(value?.label, fallback.label),
  }
}

function resolveOptionalCTA(fallback?: CTAContent, value?: null | Partial<CTAContent>) {
  const sourceLabel = pickOptionalText(value?.label)
  const sourceHref = pickOptionalText(value?.href)

  if (!fallback && (!sourceLabel || !sourceHref)) {
    return undefined
  }

  const resolved = resolveCTA(fallback || { href: sourceHref || '#', label: sourceLabel || 'Learn more' }, value)
  return resolved.href && resolved.label ? resolved : undefined
}

function pickArray<T>(value: null | T[] | undefined, fallback: T[]) {
  return Array.isArray(value) && value.length > 0 ? value : fallback
}

function resolveFormalSections(fallback: FormalPageSection[], value?: null | CMSFormalPage['sections']): FormalPageSection[] {
  const sections = pickArray(value, []).map((section) => {
    const title = pickOptionalText(section.title)
    const body = pickOptionalText(section.body)

    if (!title || !body) return null

    const items = pickArray(section.items, [])
      .map((item) => {
        const itemTitle = pickOptionalText(item.title)
        const itemBody = pickOptionalText(item.body)

        return itemTitle && itemBody ? { body: itemBody, title: itemTitle } : null
      })
      .filter((item): item is { body: string; title: string } => Boolean(item))

    return {
      body,
      ...(items.length > 0 ? { items } : {}),
      title,
    }
  })

  const validSections = sections.filter((section): section is FormalPageSection => Boolean(section))
  return validSections.length > 0 ? validSections : fallback
}

function resolveFormalPage(fallback: FormalPageContent, value?: null | CMSFormalPage): FormalPageContent {
  if (!value) return fallback

  const summaryCards = pickArray(value.summaryCards, [])
    .map((card) => {
      const title = pickOptionalText(card.title)
      const body = pickOptionalText(card.body)

      return title && body ? { body, title } : null
    })
    .filter((card): card is FormalPageContent['summaryCards'][number] => Boolean(card))

  const contactCards = pickArray(value.contactCards, [])
    .map((card) => {
      const title = pickOptionalText(card.title)
      const body = pickOptionalText(card.body)
      const label = pickOptionalText(card.label)

      return title && body && label
        ? {
            body,
            ...(pickOptionalText(card.href) ? { href: pickOptionalText(card.href) } : {}),
            label,
            title,
          }
        : null
    })
    .filter((card): card is NonNullable<FormalPageContent['contactCards']>[number] => Boolean(card))

  return {
    contactCards: contactCards.length > 0 ? contactCards : fallback.contactCards,
    currentPath: pickText(value.currentPath, fallback.currentPath),
    heroEyebrow: pickText(value.heroEyebrow, fallback.heroEyebrow),
    heroPrimaryCTA: resolveCTA(fallback.heroPrimaryCTA, value.heroPrimaryCTA),
    heroSecondaryCTA: resolveOptionalCTA(fallback.heroSecondaryCTA, value.heroSecondaryCTA),
    heroText: pickText(value.heroText, fallback.heroText),
    heroTitle: pickText(value.heroTitle, fallback.heroTitle),
    lastUpdated: pickText(value.lastUpdated, fallback.lastUpdated),
    sections: resolveFormalSections(fallback.sections, value.sections),
    summaryCards: summaryCards.length > 0 ? summaryCards : fallback.summaryCards,
  }
}

function resolveMarketingSections(fallback: MarketingSection[], value?: null | CMSMarketingPage['sections']): MarketingSection[] {
  const sections = pickArray(value, []).map((section) => {
    const id = pickOptionalText(section.anchorId)
    const eyebrow = pickOptionalText(section.eyebrow)
    const title = pickOptionalText(section.title)
    const text = pickOptionalText(section.text)

    if (!id || !eyebrow || !title || !text) return null

    const cards = pickArray(section.cards, [])
      .map((card) => {
        const cardTitle = pickOptionalText(card.title)
        const cardText = pickOptionalText(card.text)

        return cardTitle && cardText
          ? {
              ...(pickOptionalText(card.note) ? { note: pickOptionalText(card.note) } : {}),
              text: cardText,
              title: cardTitle,
            }
          : null
      })
      .filter((card): card is MarketingCard => Boolean(card))

    const bullets = pickArray(section.bullets, [])
      .map((bullet) => pickOptionalText(bullet.label))
      .filter((bullet): bullet is string => Boolean(bullet))

    return {
      ...(bullets.length > 0 ? { bullets } : {}),
      ...(cards.length > 0 ? { cards } : {}),
      eyebrow,
      id,
      text,
      title,
    }
  })

  const validSections = sections.filter((section): section is MarketingSection => Boolean(section))
  return validSections.length > 0 ? validSections : fallback
}

function resolveMarketingPage(fallback: MarketingPageContent, value?: null | CMSMarketingPage): MarketingPageContent {
  if (!value) return fallback

  return {
    currentPath: pickText(value.currentPath, fallback.currentPath),
    heroEyebrow: pickText(value.heroEyebrow, fallback.heroEyebrow),
    heroPrimaryCTA: resolveCTA(fallback.heroPrimaryCTA, value.heroPrimaryCTA),
    heroSecondaryCTA: resolveOptionalCTA(fallback.heroSecondaryCTA, value.heroSecondaryCTA),
    heroText: pickText(value.heroText, fallback.heroText),
    heroTitle: pickText(value.heroTitle, fallback.heroTitle),
    sections: resolveMarketingSections(fallback.sections, value.sections),
  }
}

async function getFormalPagesGlobal() {
  const locale = await getCurrentLocale()

  try {
    const payload = await getCachedPayload()
    return (await payload.findGlobal({
      slug: 'formal-pages',
      locale: locale as never,
      fallbackLocale: 'en' as never,
      overrideAccess: false,
    })) as FormalPagesGlobalContent
  } catch {
    return null
  }
}

export async function getFormalPageContent(pageKey: FormalPageKey): Promise<FormalPageContent> {
  const fallback = formalPages[pageKey]
  const global = await getFormalPagesGlobal()
  const page = global?.infoPages?.find((item) => item?.pageKey === pageKey)

  return resolveFormalPage(fallback, page)
}

export async function getMarketingPageContent(pageKey: MarketingPageKey): Promise<MarketingPageContent> {
  const locale = await getCurrentLocale()
  const fallback = getMarketingPages(locale)[pageKey] || marketingPages[pageKey]
  const global = await getFormalPagesGlobal()
  const page = global?.marketingPages?.find((item) => item?.pageKey === pageKey)

  return resolveMarketingPage(fallback, page)
}
