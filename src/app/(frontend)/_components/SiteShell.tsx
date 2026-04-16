import Link from 'next/link'
import type { ReactNode } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

import type { FooterContent, NavigationItem } from '../_lib/marketing-content'
import { getDefaultFooter, getDefaultSiteSettings } from '../_lib/marketing-content'
import { getCurrentLocale } from '../_lib/locale-server'
import { LocaleSwitcher } from './LocaleSwitcher'
import { LogoutButton } from './LogoutButton'

type SiteShellProps = {
  announcement?: null | string
  children: ReactNode
  currentPath?: string
  footer?: FooterContent | null
  navigation?: NavigationItem[] | null
  user?: null | {
    email?: string | null
    role?: string | null
  }
}

const appLinks = {
  en: [
    { href: '/generate', label: 'Studio' },
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/dashboard/tasks', label: 'Tasks' },
    { href: '/dashboard/library', label: 'Library' },
    { href: '/dashboard/orders', label: 'Orders' },
    { href: '/developers', label: 'Developers' },
    { href: '/admin', label: 'Admin' },
  ],
  zh: [
    { href: '/generate', label: 'Studio' },
    { href: '/dashboard', label: '工作台' },
    { href: '/dashboard/tasks', label: '任务' },
    { href: '/dashboard/library', label: '模型' },
    { href: '/dashboard/orders', label: '订单' },
    { href: '/developers', label: '开发者' },
    { href: '/admin', label: '管理后台' },
  ],
} as const

const shellCopy = {
  en: {
    footerLine: 'MiniForge keeps the product site, Studio, Dashboard, Admin, and APIs clearly separated.',
    login: 'Log in',
    navLabel: 'Site navigation',
    openWorkspace: 'Open workspace',
    platformBadge: 'AI 3D platform',
    productLayers: 'Product layers',
    roleAdmin: 'Admin',
    roleCustomer: 'User',
    roleOperator: 'Operator',
    startFree: 'Start free',
  },
  zh: {
    footerLine: 'MiniForge 将产品站、Studio、Dashboard、Admin 与 API 保持清晰分层。',
    login: '登录',
    navLabel: '站点导航',
    openWorkspace: '打开工作台',
    platformBadge: 'AI 3D 平台',
    productLayers: '产品分层',
    roleAdmin: '管理员',
    roleCustomer: '用户',
    roleOperator: '运营',
    startFree: '免费开始',
  },
} as const

export async function SiteShell({
  announcement,
  children,
  currentPath,
  footer,
  navigation,
  user,
}: SiteShellProps) {
  const locale = await getCurrentLocale()
  const copy = shellCopy[locale]
  const defaultSiteSettings = getDefaultSiteSettings(locale)
  const defaultLinks = defaultSiteSettings.headerNav
  const links = navigation?.length ? navigation : defaultLinks
  const footerContent = { ...getDefaultFooter(locale), ...footer }

  const roleLabel = (role?: string | null) => {
    if (role === 'admin') return copy.roleAdmin
    if (role === 'operator') return copy.roleOperator
    return copy.roleCustomer
  }

  const isActivePath = (href: string) => currentPath === href || (href === '/dashboard' && currentPath?.startsWith('/dashboard'))

  return (
    <div className="min-h-screen bg-background text-foreground">
      {announcement ? (
        <div className="border-b border-border/60 bg-muted/50">
          <div className="mx-auto max-w-7xl px-4 py-2 text-xs text-muted-foreground sm:px-6">{announcement}</div>
        </div>
      ) : null}

      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-2xl border border-border/60 bg-muted font-semibold">M</div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{copy.platformBadge}</p>
                <Link className="text-lg font-semibold tracking-tight" href="/" translate="no">
                  MiniForge AI 3D
                </Link>
              </div>
            </div>

            <nav aria-label={copy.navLabel} className="flex flex-wrap items-center gap-2">
              {links.map((link) => (
                <Button asChild key={`${link.href}-${link.label}`} size="sm" variant={currentPath === link.href ? 'secondary' : 'ghost'}>
                  <Link href={link.href || '/'}>{link.label}</Link>
                </Button>
              ))}
            </nav>

            <div className="flex flex-wrap items-center justify-end gap-2">
              <LocaleSwitcher currentLocale={locale} currentPath={currentPath} />
              {user?.role ? <Badge variant="secondary">{roleLabel(user.role)}</Badge> : null}
              {user?.email ? (
                <Badge className="max-w-[220px] truncate" variant="outline">
                  {user.email}
                </Badge>
              ) : null}
              {user ? (
                <>
                  <Button asChild size="sm" variant="secondary">
                    <Link href="/dashboard">{copy.openWorkspace}</Link>
                  </Button>
                  <LogoutButton />
                </>
              ) : (
                <>
                  <Button asChild size="sm" variant="outline">
                    <Link href="/login">{copy.login}</Link>
                  </Button>
                  <Button asChild size="sm">
                    <Link href="/register">{copy.startFree}</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-border/60 bg-muted/30">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-4 py-3 sm:px-6">
            <Badge variant="outline">{copy.productLayers}</Badge>
            {appLinks[locale].map((link) => (
              <Button asChild key={`${link.href}-${link.label}`} size="sm" variant={isActivePath(link.href) ? 'default' : 'ghost'}>
                <Link href={link.href}>{link.label}</Link>
              </Button>
            ))}
          </div>
        </div>
      </header>

      <main>{children}</main>

      <footer className="border-t border-border/60 bg-muted/20">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <div className="grid gap-8 md:grid-cols-2">
            <div className="flex flex-col gap-3">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{footerContent.aboutEyebrow}</p>
              <h3 className="text-xl font-semibold tracking-tight">{footerContent.aboutTitle}</h3>
              <p className="max-w-xl text-sm leading-6 text-muted-foreground">{footerContent.aboutText}</p>
            </div>

            <div className="flex flex-col gap-3">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{footerContent.directionEyebrow}</p>
              <h3 className="text-xl font-semibold tracking-tight">{footerContent.directionTitle}</h3>
              <p className="max-w-xl text-sm leading-6 text-muted-foreground">{footerContent.directionText}</p>
            </div>
          </div>

          <Separator className="my-6" />
          <p className="text-sm text-muted-foreground">{copy.footerLine}</p>
        </div>
      </footer>
    </div>
  )
}
