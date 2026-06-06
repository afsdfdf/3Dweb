import Link from 'next/link'

import { SocialBrandIcon } from '@/components/ui/social-brand-icon'
import { getDefaultFooterLinkGroups, type FooterContent, type FooterLink, type FooterSocialLink } from '../../_lib/marketing-content'
import { getFooterBrandLogoSrc, getVisibleFooterSocialLinks, normalizeFooterHref } from './footerSafety'

type FooterBarProps = {
  footerContent: FooterContent
  siteDescription: string
  supportEmail: string
}

function FooterLinkItem({ link }: { link: FooterLink }) {
  const href = normalizeFooterHref(link.href)
  const label = typeof link.label === 'string' ? link.label.trim() : ''

  if (!href || !label) return null

  const className = "leading-[18px] text-[12px] text-[#9b9da5] transition-colors hover:text-[#f0d188]"
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

function FooterSocialLinkItem({ link }: { link: FooterSocialLink }) {
  return (
    <a
      aria-label={link.label}
      className="inline-flex h-[24px] w-[24px] items-center justify-center border border-dashed border-[#676971] bg-[#1b1b1d] text-[#d2b77b] transition-colors hover:border-[#f0d188] hover:text-[#f0d188]"
      href={link.href}
      rel={link.href.startsWith('http') ? 'noreferrer' : undefined}
      target={link.href.startsWith('http') ? '_blank' : undefined}
      title={link.label}
    >
      <SocialBrandIcon className="h-[14px] w-[14px]" platform={link.platform} />
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
  const socialLinks = getVisibleFooterSocialLinks(footerContent)
  const visibleGroups = linkGroups.slice(0, 2)

  return (
    <footer className="border-t border-[rgba(255,255,255,0.1)] bg-[#181818]">
      <div className="mx-auto grid min-h-[176px] max-w-[1160px] items-start justify-center gap-x-16 gap-y-8 px-[var(--public-page-gutter)] py-10 text-sm md:grid-cols-[220px_190px_260px]">
        <div className="flex min-h-[68px] items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt={brandLogoAlt} className="h-8 w-[161px] object-contain object-left" src={brandLogoSrc} />
          <p className="sr-only">{brandSummary}</p>
        </div>
        {visibleGroups.map((group, groupIndex) => (
          <div key={group.title}>
            <h3 className="text-[20px] font-semibold leading-none tracking-normal text-[#f0d188]">{group.title}</h3>
            {groupIndex === 1 ? (
              <a className="mt-3 block text-xs leading-5 text-[#9b9da5] hover:text-[#f0d188]" href={`mailto:${supportEmail}`}>
                {supportEmail}
              </a>
            ) : null}
            {(group.links || []).length > 0 && groupIndex !== 1 ? (
              <nav aria-label={group.ariaLabel || group.title} className="mt-3 flex flex-col gap-1 text-xs">
                {(group.links || []).map((link) => (
                  <FooterLinkItem key={`${group.title}-${link.href}-${link.label}`} link={link} />
                ))}
              </nav>
            ) : null}
            {groupIndex === 1 && socialLinks.length > 0 ? (
              <nav aria-label="Social media links" className="mt-3 flex flex-wrap gap-2">
                {socialLinks.map((link) => (
                  <FooterSocialLinkItem key={`${link.platform}-${link.href}-${link.label}`} link={link} />
                ))}
              </nav>
            ) : null}
            {groupIndex === 1 ? (
              <p className="mt-3 text-[10px] leading-4 text-[#6f7178]">Copyright 2023-2026 Thorns Tavern. All rights reserved.</p>
            ) : group.helperText ? (
              <p className="sr-only">{group.helperText}</p>
            ) : null}
            {(group.links || []).length > 0 && groupIndex === 1 && socialLinks.length === 0 ? (
              <nav aria-label={group.ariaLabel || group.title} className="mt-3 flex flex-col gap-1 text-xs">
                {(group.links || []).map((link) => (
                  <FooterLinkItem key={`${group.title}-${link.href}-${link.label}`} link={link} />
                ))}
              </nav>
            ) : null}
          </div>
        ))}
      </div>
    </footer>
  )
}
