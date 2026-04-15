import Link from 'next/link'
import type { ReactNode } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

import type { FooterContent, NavigationItem } from '../_lib/marketing-content'
import { defaultFooter, defaultSiteSettings } from '../_lib/marketing-content'
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

const defaultLinks = defaultSiteSettings.headerNav
const appLinks = [
  { href: '/generate', label: 'Studio' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/dashboard/tasks', label: '任务' },
  { href: '/dashboard/library', label: '模型' },
  { href: '/dashboard/orders', label: '订单' },
  { href: '/developers', label: '开发者' },
  { href: '/admin', label: 'Admin' },
]

const roleLabel = (role?: string | null) => {
  if (role === 'admin') return '管理员'
  if (role === 'operator') return '运营'
  return '用户'
}

export function SiteShell({
  announcement,
  children,
  currentPath,
  footer,
  navigation,
  user,
}: SiteShellProps) {
  const links = navigation?.length ? navigation : defaultLinks
  const footerContent = { ...defaultFooter, ...footer }
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
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">AI 3D 平台</p>
                <Link className="text-lg font-semibold tracking-tight" href="/" translate="no">
                  MiniForge AI 3D
                </Link>
              </div>
            </div>

            <nav aria-label="站点导航" className="flex flex-wrap items-center gap-2">
              {links.map((link) => (
                <Button asChild key={`${link.href}-${link.label}`} size="sm" variant={currentPath === link.href ? 'secondary' : 'ghost'}>
                  <Link href={link.href || '/'}>{link.label}</Link>
                </Button>
              ))}
            </nav>

            <div className="flex flex-wrap items-center justify-end gap-2">
              {user?.role ? <Badge variant="secondary">{roleLabel(user.role)}</Badge> : null}
              {user?.email ? (
                <Badge className="max-w-[220px] truncate" variant="outline">
                  {user.email}
                </Badge>
              ) : null}
              {user ? (
                <>
                  <Button asChild size="sm" variant="secondary">
                    <Link href="/dashboard">打开工作台</Link>
                  </Button>
                  <LogoutButton />
                </>
              ) : (
                <>
                  <Button asChild size="sm" variant="outline">
                    <Link href="/login">登录</Link>
                  </Button>
                  <Button asChild size="sm">
                    <Link href="/register">免费开始</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-border/60 bg-muted/30">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-4 py-3 sm:px-6">
            <Badge variant="outline">产品分层</Badge>
            {appLinks.map((link) => (
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
          <p className="text-sm text-muted-foreground">MiniForge 将产品站、Studio、Dashboard、Admin 与 API 保持清晰分层。</p>
        </div>
      </footer>
    </div>
  )
}
