import Link from 'next/link'

import { isGuestReadableMedia } from '@/lib/mediaVisibility'
import { getDefaultFooterLinkGroups, type FooterContent, type FooterLink } from '../../_lib/marketing-content'

type FooterBarProps = {
  footerContent: FooterContent
  siteDescription: string
  supportEmail: string
}

type FooterImageLike = {
  publicAccess?: boolean | null
  purpose?: null | string
  thumbnailURL?: null | string
  url?: null | string
}

const defaultFooterLogoSrc = '/ui/nav/brand-wordmark.png'
const controlCharacters = /[\u0000-\u001F\u007F]/

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function getTrimmedText(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeFooterImageURL(value: unknown): null | string {
  const trimmed = getTrimmedText(value)
  if (!trimmed || controlCharacters.test(trimmed) || trimmed.startsWith('//')) return null
  if (trimmed.startsWith('/')) return trimmed

  try {
    const parsed = new URL(trimmed)

    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return null
    }

    if (
      (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') &&
      parsed.pathname.startsWith('/api/media/file/')
    ) {
      return `${parsed.pathname}${parsed.search}`
    }

    if (
      parsed.hostname.endsWith('.supabase.co') &&
      parsed.pathname.startsWith('/storage/v1/object/') &&
      !parsed.pathname.startsWith('/storage/v1/object/public/')
    ) {
      return null
    }

    return parsed.toString()
  } catch {
    return null
  }
}

export function getFooterBrandLogoSrc(footerContent: FooterContent) {
  const brandLogo = footerContent.brandLogo
  if (!isRecord(brandLogo)) return defaultFooterLogoSrc

  if (('publicAccess' in brandLogo || 'purpose' in brandLogo) && !isGuestReadableMedia(brandLogo as FooterImageLike)) {
    return defaultFooterLogoSrc
  }

  return normalizeFooterImageURL(brandLogo.thumbnailURL || brandLogo.url) || defaultFooterLogoSrc
}

function normalizeFooterHref(value: string) {
  const href = value.trim()
  if (!href) return null
  if (href.startsWith('/') || href.startsWith('#')) return href

  try {
    const parsed = new URL(href)
    return ['http:', 'https:', 'mailto:'].includes(parsed.protocol) ? parsed.toString() : null
  } catch {
    return null
  }
}

function FooterLinkItem({ link }: { link: FooterLink }) {
  const href = normalizeFooterHref(link.href)
  const label = link.label.trim()

  if (!href || !label) return null

  const className = "leading-6 text-[#9b9da5] transition-colors hover:text-[#f0d188]"
  if (href.startsWith('/') || href.startsWith('#')) {
    return (
      <Link className={className} href={href}>
        {label}
      </Link>
    )
  }

  return (
    <a className={className} href={href} rel={href.startsWith('http') ? 'noreferrer' : undefined} target={href.startsWith('http') ? '_blank' : undefined}>
      {label}
    </a>
  )
}

export function FooterBar({ footerContent, siteDescription, supportEmail }: FooterBarProps) {
  const linkGroups =
    Array.isArray(footerContent.linkGroups) && footerContent.linkGroups.length > 0
      ? footerContent.linkGroups
      : getDefaultFooterLinkGroups(supportEmail)
  const brandLogoSrc = getFooterBrandLogoSrc(footerContent)
  const brandLogoAlt = footerContent.brandLogoAlt?.trim() || 'Thorns Tavern'
  const brandSummary = footerContent.brandSummary?.trim() || siteDescription

  return (
    <footer className="border-t border-[#403f46] bg-[#333333]">
      <div className="mx-auto grid max-w-[var(--public-page-max-width)] gap-8 px-[var(--public-page-gutter)] py-12 text-sm md:grid-cols-[1.2fr_repeat(2,minmax(0,1fr))]">
        <div className="flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt={brandLogoAlt} className="h-8 w-[161px] object-contain" src={brandLogoSrc} />
          <div>
            <p className="mt-1 text-[#8e9097]">{brandSummary}</p>
          </div>
        </div>
        {linkGroups.slice(0, 4).map((group) => (
          <div key={group.title}>
            <h3 className="text-xs uppercase tracking-[0.24em] text-[#f0d188]">{group.title}</h3>
            <nav aria-label={group.ariaLabel || group.title} className="mt-4 flex flex-col gap-2">
              {(group.links || []).map((link) => (
                <FooterLinkItem key={`${group.title}-${link.href}-${link.label}`} link={link} />
              ))}
            </nav>
            {group.helperText ? <p className="mt-4 leading-6 text-[#7f8188]">{group.helperText}</p> : null}
          </div>
        ))}
      </div>
    </footer>
  )
}
