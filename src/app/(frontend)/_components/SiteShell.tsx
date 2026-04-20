import Link from 'next/link'
import type { ReactNode } from 'react'

import { Bell, ShoppingCart } from 'lucide-react'

import { Button } from '@/components/ui/button'

import type { FooterContent, NavigationItem } from '../_lib/marketing-content'
import { getDefaultFooter, getDefaultSiteSettings } from '../_lib/marketing-content'
import { getCurrentLocale } from '../_lib/locale-server'
import { FooterBar } from './shell/FooterBar'
import { TopNavBar } from './shell/TopNavBar'

type SiteShellProps = {
  announcement?: null | string
  children: ReactNode
  currentPath?: string
  footer?: FooterContent | null
  navigation?: NavigationItem[] | null
  showUtilityNav?: boolean
  user?: null | {
    email?: string | null
    role?: string | null
  }
}

const utilityLinks = [
  { href: '/generate', label: 'Studio' },
  { href: '/dashboard/tasks', label: 'Tasks' },
  { href: '/dashboard/library', label: 'Library' },
  { href: '/dashboard/orders', label: 'Orders' },
  { href: '/showcase', label: 'Showcase' },
] as const

export async function SiteShell({
  announcement,
  children,
  currentPath,
  footer,
  navigation,
  showUtilityNav = true,
  user,
}: SiteShellProps) {
  const locale = await getCurrentLocale()
  const defaultSiteSettings = getDefaultSiteSettings(locale)
  const footerContent = { ...getDefaultFooter(locale), ...footer }
  const links = navigation?.length
    ? navigation.map((item) => ({ href: item.href, label: item.label || '' }))
    : [
        { href: '/', label: 'Home' },
        { href: '/generate', label: 'Workbench' },
        { href: '/dashboard', label: 'Account' },
        { href: '/admin', label: 'Admin' },
      ]

  return (
    <div className="min-h-screen bg-[#181818] text-[#ededee]">
      {announcement ? (
        <div className="border-b border-[#403f46] bg-[#181818]">
          <div className="mx-auto max-w-[1600px] px-4 py-2 text-center text-[10px] uppercase tracking-[0.3em] text-[#8f9199] sm:px-6">
            {announcement}
          </div>
        </div>
      ) : null}

      <TopNavBar currentPath={currentPath} locale={locale} navigation={links} user={user} />

      {showUtilityNav ? (
        <div className="border-b border-[#403f46] bg-[#181818]">
          <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-2 px-4 py-3 sm:px-6">
            {utilityLinks.map((link) => (
              <Button
                asChild
                className={`rounded-full px-4 ${
                  currentPath?.startsWith(link.href)
                    ? 'border-[#403f46] bg-[#2b2a32] text-[#ffe7a8]'
                    : 'border-[#403f46] bg-[#2b2a32] text-[#bcb4a1] hover:bg-[#424149] hover:text-[#f0d188]'
                }`}
                key={`${link.href}-${link.label}`}
                size="sm"
                variant="outline"
              >
                <Link href={link.href}>{link.label}</Link>
              </Button>
            ))}
          </div>
        </div>
      ) : null}

      <main>{children}</main>

      <FooterBar
        footerContent={footerContent}
        siteDescription={defaultSiteSettings.siteDescription}
        supportEmail={defaultSiteSettings.supportEmail}
      />
    </div>
  )
}
