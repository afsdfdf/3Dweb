import Link from 'next/link'

import { Button } from '@/components/ui/button'

import { Locale } from '../../_lib/locale'
import { LocaleSwitcher } from '../LocaleSwitcher'
import { LogoutButton } from '../LogoutButton'

type TopNavBarProps = {
  currentPath?: string
  locale: Locale
  navigation: { href: string; label: string }[]
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

function HeaderBrand() {
  return (
    <Link className="flex shrink-0 items-center pr-4" href="/">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img alt="Thorns Tavern" className="h-[30px] w-auto object-contain" src="/ui/nav/brand-wordmark.png" />
    </Link>
  )
}

function NavOrnament() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-1/2 hidden h-[58px] -translate-y-1/2 lg:block">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img alt="" aria-hidden="true" className="h-full w-full object-fill opacity-68" src="/ui/nav/nav-ornament.png" />
    </div>
  )
}

function CreditsCounter() {
  return <CreditsCounterValue value={560} />
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

function AuthEntry() {
  return (
    <Link className="relative flex h-[34px] min-w-[168px] items-center justify-center px-4 text-[12px] uppercase tracking-[0.08em] text-[#efe7da]" href="/login">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-fill" src="/ui/nav/auth-pill.png" />
      <span className="relative z-10">Log in / Sign up</span>
    </Link>
  )
}

export function TopNavBar({ currentPath, locale, navigation, showAuthEntry = true, showLocaleSwitcher = true, user }: TopNavBarProps) {
  return (
    <header className="sticky top-0 z-40 h-[60px] overflow-hidden bg-[#1b1b1b]">
      <div className="relative mx-auto flex h-[58px] max-w-[1872px] items-center px-6">
        <HeaderBrand />

        <div
          className="absolute left-1/2 top-0 flex h-[58px] max-w-[970px] -translate-x-1/2 items-center justify-center"
          style={{ width: 'min(970px, calc(100% - 560px))' }}
        >
          <NavOrnament />

          <nav className="relative z-10 flex h-[58px] items-center gap-5" aria-label="Primary navigation">
            {navigation.map((link, index) => {
              const active = isActivePath(link.href, currentPath)
              const widthClass =
                index === 0 ? 'w-[102px]' : index === 1 ? 'w-[156px]' : index === 2 ? 'w-[126px]' : 'w-[108px]'

              return (
                <Link
                  className={`group/navitem relative flex h-[58px] shrink-0 flex-col items-center justify-center ${widthClass} text-[15px] uppercase leading-[22px] transition-colors ${
                    active ? 'font-medium text-white' : 'font-normal text-[rgba(233,175,85,0.58)] hover:text-[#d9b261]'
                  }`}
                  href={link.href || '/'}
                  key={`${link.href}-${link.label}`}
                >
                  <span className="relative z-10">{link.label}</span>
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
        </div>

        <div className="ml-auto flex shrink-0 items-center justify-end">
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
              {showAuthEntry ? <AuthEntry /> : <div />}
            </div>
          )}
        </div>
      </div>

      <div className="h-[2px] w-full bg-[linear-gradient(45deg,rgba(233,175,85,0)_0%,rgba(233,175,85,0.3)_27.335938%,rgba(233,175,85,0.3)_50.716146%,rgba(233,175,85,0.3)_76.559896%,rgba(233,175,85,0)_100%)]" />
    </header>
  )
}
