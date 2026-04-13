import Link from 'next/link'
import type { ReactNode } from 'react'

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
  { href: '/developers', label: 'API' },
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
    <div className="site-shell">
      {announcement ? <div className="announcement-bar">{announcement}</div> : null}

      <header className="topbar topbar-clean">
        <div className="brand-block">
          <div className="brand-mark" aria-hidden="true">M</div>
          <div>
            <p className="eyebrow">AI 3D 角色产品平台</p>
            <Link className="brand-title" href="/" translate="no">
              MiniForge AI 3D
            </Link>
          </div>
        </div>

        <nav aria-label="主导航" className="nav-links topbar-nav">
          {links.map((link) => (
            <Link
              key={`${link.href}-${link.label}`}
              href={link.href || '/'}
              className={currentPath === link.href ? 'nav-link active' : 'nav-link'}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="topbar-actions topbar-actions-compact">
          {user?.role ? <span className="user-badge">{roleLabel(user.role)}</span> : null}
          {user?.email ? <span className="user-badge">{user.email}</span> : null}
          {user ? (
            <>
              <Link className="secondary-button" href="/dashboard">
                打开工作台
              </Link>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link className="secondary-button" href="/login">
                登录
              </Link>
              <Link className="primary-button" href="/register">
                免费开始
              </Link>
            </>
          )}
        </div>
      </header>

      <section className="product-rail product-rail-shell" aria-label="产品入口导航">
        <div className="product-rail-copy">
          <p className="eyebrow">Product Map</p>
          <strong className="product-rail-title">从产品站直接进入 Studio、Dashboard、Admin 与 API。</strong>
        </div>

        <div className="product-rail-links">
          {appLinks.map((link) => (
            <Link
              key={`${link.href}-${link.label}`}
              href={link.href}
              className={isActivePath(link.href) ? 'product-rail-link active' : 'product-rail-link'}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </section>

      {children}

      <footer className="footer-panel footer-panel-clean">
        <div>
          <p className="eyebrow">{footerContent.aboutEyebrow}</p>
          <h3>{footerContent.aboutTitle}</h3>
          <p className="soft-text">{footerContent.aboutText}</p>
        </div>
        <div>
          <p className="eyebrow">{footerContent.directionEyebrow}</p>
          <h3>{footerContent.directionTitle}</h3>
          <p className="soft-text">{footerContent.directionText}</p>
        </div>
      </footer>
    </div>
  )
}
