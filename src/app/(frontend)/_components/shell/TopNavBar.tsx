import Link from 'next/link'

import { Bell, ShoppingCart } from 'lucide-react'

import { Button } from '@/components/ui/button'

import { Locale } from '../../_lib/locale'
import { LocaleSwitcher } from '../LocaleSwitcher'
import { LogoutButton } from '../LogoutButton'

type TopNavBarProps = {
  currentPath?: string
  locale: Locale
  navigation: { href: string; label: string }[]
  user?: null | {
    email?: string | null
  }
}

const isActivePath = (href: string, currentPath?: string) => {
  if (href === '/') return currentPath === '/'
  return Boolean(currentPath?.startsWith(href))
}

function HeaderBrand() {
  return (
    <Link className="flex min-w-[220px] items-center gap-3" href="/">
      <div className="relative flex size-9 items-center justify-center rounded-full border border-[#c79d4c] bg-[#151515] text-[9px] font-bold uppercase tracking-[0.18em] text-[#f0d188] shadow-[inset_0_0_0_2px_#2a1d0d,0_0_12px_rgba(226,181,97,0.16)]">
        MF
      </div>
      <div className="font-serif text-[16px] font-black uppercase tracking-[0.04em] text-[#f1d99c] [text-shadow:0_1px_0_#4a2b16] sm:text-[17px]">
        MiniForge Tavern
      </div>
    </Link>
  )
}

function HeaderFrameDecoration() {
  return (
    <>
      <div className="pointer-events-none absolute left-[27%] top-1/2 hidden h-10 w-20 -translate-y-1/2 items-center justify-center lg:flex">
        <div className="absolute inset-0 opacity-40 [clip-path:polygon(0_50%,28%_0,100%_0,72%_50%,100%_100%,28%_100%)] bg-[linear-gradient(90deg,transparent,rgba(214,171,89,0.14),transparent)]" />
        <div className="size-2 rotate-45 border border-[#6b5731] bg-[#201b14]" />
      </div>
      <div className="pointer-events-none absolute right-[27%] top-1/2 hidden h-10 w-20 -translate-y-1/2 items-center justify-center lg:flex">
        <div className="absolute inset-0 opacity-40 [clip-path:polygon(0_0,72%_0,100%_50%,72%_100%,0_100%,28%_50%)] bg-[linear-gradient(90deg,transparent,rgba(214,171,89,0.14),transparent)]" />
        <div className="size-2 rotate-45 border border-[#6b5731] bg-[#201b14]" />
      </div>
    </>
  )
}

export function TopNavBar({ currentPath, locale, navigation, user }: TopNavBarProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-[#41331b] bg-[linear-gradient(180deg,#232323_0%,#181818_70%,#141414_100%)] shadow-[0_1px_0_rgba(255,214,141,0.07)]">
      <div className="relative mx-auto grid max-w-[1600px] grid-cols-[minmax(220px,260px)_1fr_minmax(250px,430px)] items-center gap-4 px-4 py-2.5 sm:px-6">
        <HeaderBrand />
        <HeaderFrameDecoration />

        <nav className="flex items-center justify-center gap-7 lg:gap-12" aria-label="Primary navigation">
          {navigation.map((link) => {
            const active = isActivePath(link.href, currentPath)
            return (
              <Link
                className={`relative py-2 text-[12px] uppercase tracking-[0.16em] transition-colors ${
                  active ? 'text-[#fff4c9]' : 'text-[#9f7f3e] hover:text-[#e0bb6a]'
                }`}
                href={link.href || '/'}
                key={`${link.href}-${link.label}`}
              >
                {link.label}
                {active ? <span className="absolute left-1/2 top-full mt-1 h-2 w-2 -translate-x-1/2 rotate-45 border-b border-r border-[#e6bd67]" /> : null}
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center justify-end gap-2 text-[#f0d188]">
          <div className="flex items-center gap-2 rounded-full border border-[#5a4523] bg-[#171717] px-2.5 py-1 text-[12px] text-[#ffe7a8] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <span className="inline-flex size-5 items-center justify-center rounded-full border border-[#b7832d] bg-[#2d220f] text-[9px] font-bold text-[#ffdd88]">
              ✦
            </span>
            <span>560</span>
          </div>
          <button className="flex size-8 items-center justify-center rounded-full border border-[#49381b] bg-[#181818] text-[#dcb664]" type="button">
            <Bell className="size-3.5" />
          </button>
          <button className="flex size-8 items-center justify-center rounded-full border border-[#49381b] bg-[#181818] text-[#dcb664]" type="button">
            <ShoppingCart className="size-3.5" />
          </button>
          <LocaleSwitcher currentLocale={locale} currentPath={currentPath} />
          {user ? (
            <div className="ml-1 flex items-center gap-2 rounded-full border border-[#59411f] bg-[#181818] px-2.5 py-1 text-[12px] text-[#ece1c7]">
              <div className="size-6 rounded-full border border-[#e2c78f] bg-[radial-gradient(circle_at_48%_35%,#f8eee8_0_26%,#eacfc8_27%_40%,transparent_41%),linear-gradient(135deg,#f6d9d0,#eee)]" />
              <span className="max-w-[108px] truncate">{user.email || 'Account'}</span>
            </div>
          ) : null}
          {user ? (
            <>
              <Button asChild className="border border-[#7e5624] bg-[linear-gradient(180deg,#7b5a2c_0%,#473319_100%)] text-[#fff0c2] hover:bg-[linear-gradient(180deg,#8b6833_0%,#533b1d_100%)]" size="sm">
                <Link href="/dashboard">Open workspace</Link>
              </Button>
              <LogoutButton className="border-[#5d4d37] bg-[#1a1b1f] text-[#e3d8be] hover:bg-[#23252a]" variant="outline" />
            </>
          ) : (
            <Button asChild className="border border-[#7e5624] bg-[linear-gradient(180deg,#7b5a2c_0%,#473319_100%)] text-[#fff0c2] hover:bg-[linear-gradient(180deg,#8b6833_0%,#533b1d_100%)]" size="sm">
              <Link href="/login">Log in / Sign up</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
