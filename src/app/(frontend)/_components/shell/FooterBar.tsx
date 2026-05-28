import Link from 'next/link'

import { getDefaultFooterLinkGroups, type FooterContent, type FooterLink } from '../../_lib/marketing-content'
import { getFooterBrandLogoSrc, normalizeFooterHref } from './footerSafety'

type FooterBarProps = {
  footerContent: FooterContent
  siteDescription: string
  supportEmail: string
}

function FooterLinkItem({ link }: { link: FooterLink }) {
  const href = normalizeFooterHref(link.href)
  const label = typeof link.label === 'string' ? link.label.trim() : ''

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
