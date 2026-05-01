import Link from 'next/link'

import { publicNavigationItems } from '@/lib/publicNavigation'

import { AuthEntryButton } from './AuthEntryButton'
import { Locale } from '../../_lib/locale'

type TopNavBarProps = {
  currentPath?: string
  locale: Locale
  navigation?: readonly { href: string; label: string }[]
  showAuthEntry?: boolean
  showLocaleSwitcher?: boolean
  user?: null | {
    avatarUrl?: string | null
    creditsBalance?: number | null
    displayName?: string | null
    email?: string | null
  }
}

const isActivePath = (href: string, currentPath?: string) => {
  if (href === '/') return currentPath === '/'
  return Boolean(currentPath?.startsWith(href))
}

const NAV_ITEM_WIDTH_CLASS = 'w-[132px]'
const STANDARD_NAVIGATION = publicNavigationItems

function HeaderBrand() {
  return (
    <Link className="absolute left-[48px] top-[14px] flex h-8 w-[161px] items-center" href="/">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img alt="Thorns Tavern" className="h-8 w-[161px] object-contain" src="/ui/nav/brand-wordmark.png" />
    </Link>
  )
}

function NavOrnament() {
  return (
    <div className="pointer-events-none absolute left-[460px] top-[1px] h-[58px] w-[1000px]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img alt="" aria-hidden="true" className="h-[58px] w-[1000px] object-contain opacity-68" src="/ui/nav/nav-ornament.png" />
    </div>
  )
}

function CreditsCounterValue({
  value,
}: {
  value: null | number
}) {
  return (
    <div className="flex items-center gap-1 text-[12px] font-semibold text-[#f4d48a]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img alt="" aria-hidden="true" className="h-[26px] w-[26px] object-contain" src="/ui/nav/credits-badge.png" />
      {typeof value === 'number' ? <span>{value}</span> : null}
    </div>
  )
}

function IconAction({
  alt,
  src,
}: {
  alt: string
  src: string
}) {
  return (
    <button className="flex h-5 w-5 items-center justify-center bg-transparent" type="button">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img alt={alt} className="h-[18px] w-[18px] object-contain opacity-86" src={src} />
    </button>
  )
}

export function TopNavBar({ currentPath, locale, navigation, showAuthEntry = true, showLocaleSwitcher = true, user }: TopNavBarProps) {
  void locale
  void navigation
  void showLocaleSwitcher

  const links = STANDARD_NAVIGATION

  return (
    <header className="relative z-40 h-[60px] w-[1920px] overflow-hidden bg-[#1b1b1b]">
      <div className="relative h-[60px] w-[1920px] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt="" aria-hidden="true" className="pointer-events-none absolute inset-0 h-[60px] w-[1920px] object-contain" src="/ui/nav/nav-divider.png" />
        <HeaderBrand />

        <NavOrnament />

        <nav className="absolute left-[460px] top-0 z-10 flex h-[58px] w-[1000px] items-center justify-center gap-5" aria-label="Primary navigation">
          {links.map((link) => {
            const active = isActivePath(link.href, currentPath)

            return (
              <Link
                className={`group/navitem relative flex h-[58px] shrink-0 flex-col items-center justify-center ${NAV_ITEM_WIDTH_CLASS} text-[15px] uppercase leading-[22px] transition-colors ${
                  active ? 'font-medium text-white' : 'font-normal text-[rgba(233,175,85,0.58)] hover:text-[#d9b261]'
                }`}
                href={link.href || '/'}
                key={`${link.href}-${link.label}`}
              >
                <span className="relative z-10 max-w-full truncate px-2">{link.label}</span>
                <span
                  aria-hidden="true"
                  className={`pointer-events-none absolute bottom-[12px] left-1/2 h-[10px] w-[48px] -translate-x-1/2 rounded-full bg-[#e9af55] blur-[6px] transition-opacity duration-150 ${
                    active ? 'opacity-100' : 'opacity-0 group-hover/navitem:opacity-100'
                  }`}
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt=""
                  aria-hidden="true"
                  className={`pointer-events-none absolute bottom-[4px] left-1/2 h-[10px] w-[16px] -translate-x-1/2 object-contain transition-opacity duration-150 ${
                    active ? 'opacity-100' : 'opacity-0 group-hover/navitem:opacity-100'
                  }`}
                  src="/ui/nav/active-chevron.png"
                />
              </Link>
            )
          })}
        </nav>

        <div className="absolute right-[48px] top-[10px] flex h-10 items-center justify-end">
          {user ? (
            <div className="grid grid-cols-[76px_24px_24px_40px_minmax(0,1fr)] items-center justify-items-start gap-x-3">
              <CreditsCounterValue value={typeof user.creditsBalance === 'number' ? Math.max(0, Number(user.creditsBalance)) : null} />
              <IconAction alt="Notifications" src="/ui/nav/icon-bell.png" />
              <IconAction alt="Cart" src="/ui/nav/icon-cart.png" />
              {user.avatarUrl ? (
                <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-[#2b2b2b]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img alt={user.displayName || user.email || 'Account avatar'} className="h-full w-full object-cover" src={user.avatarUrl} />
                </div>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img alt="" aria-hidden="true" className="h-10 w-10 object-contain opacity-88" src="/ui/nav/avatar-disc.png" />
              )}
              <span className="max-w-[140px] truncate text-[12px] text-white">{user.displayName || user.email || 'Account'}</span>
            </div>
          ) : (
            <div className="grid grid-cols-[76px_24px_24px_40px_168px] items-center justify-items-start gap-x-3">
              <div />
              <IconAction alt="Notifications" src="/ui/nav/icon-bell.png" />
              <IconAction alt="Cart" src="/ui/nav/icon-cart.png" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img alt="" aria-hidden="true" className="h-10 w-10 object-contain opacity-88" src="/ui/nav/avatar-disc.png" />
              {showAuthEntry ? <AuthEntryButton /> : <div />}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
