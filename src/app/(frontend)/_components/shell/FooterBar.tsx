import Link from 'next/link'

import type { FooterContent } from '../../_lib/marketing-content'

type FooterBarProps = {
  footerContent: FooterContent
  siteDescription: string
  supportEmail: string
}

export function FooterBar({ footerContent, siteDescription, supportEmail }: FooterBarProps) {
  const informationLinks = [
    { href: '/about', label: 'About' },
    { href: '/privacy-policy', label: 'Privacy Policy' },
    { href: '/refund-policy', label: 'Refund Policy' },
  ]
  const customerLinks = [
    { href: '/contact', label: 'Contact' },
    { href: '/shipping-policy', label: 'Shipping Policy' },
    { href: `mailto:${supportEmail}`, label: supportEmail },
  ]

  return (
    <footer className="border-t border-[#403f46] bg-[#333333]">
      <div className="mx-auto grid max-w-[1600px] gap-8 px-4 py-12 text-sm sm:px-6 md:grid-cols-[1.2fr_1fr_1fr]">
        <div className="flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="Thorns Tavern" className="h-8 w-[161px] object-contain" src="/ui/nav/brand-wordmark.png" />
          <div>
            <p className="mt-1 text-[#8e9097]">{siteDescription}</p>
          </div>
        </div>
        <div>
          <h3 className="text-xs uppercase tracking-[0.24em] text-[#f0d188]">Information</h3>
          <nav aria-label="Footer information" className="mt-4 flex flex-col gap-2">
            {informationLinks.map((link) => (
              <Link className="leading-6 text-[#9b9da5] transition-colors hover:text-[#f0d188]" href={link.href} key={link.href}>
                {link.label}
              </Link>
            ))}
          </nav>
          <p className="mt-4 leading-6 text-[#7f8188]">{footerContent.directionTitle}</p>
        </div>
        <div>
          <h3 className="text-xs uppercase tracking-[0.24em] text-[#f0d188]">Help customers</h3>
          <nav aria-label="Footer customer help" className="mt-4 flex flex-col gap-2">
            {customerLinks.map((link) => (
              <Link className="leading-6 text-[#9b9da5] transition-colors hover:text-[#f0d188]" href={link.href} key={link.href}>
                {link.label}
              </Link>
            ))}
          </nav>
          <p className="mt-4 leading-6 text-[#7f8188]">{footerContent.aboutText}</p>
        </div>
      </div>
    </footer>
  )
}
