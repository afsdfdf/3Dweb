import type { ReactNode } from 'react'

import { AuthModalStage } from '@/components/auth/AuthModalStage'
import { TopNavigation } from '@/components/ui-lab/top-navigation'
import { getPublicNavigationActiveID, resolvePublicNavigationItems } from '@/lib/publicNavigation'

import type { FooterContent, NavigationItem } from '../_lib/marketing-content'
import { getDefaultFooter, getDefaultSiteSettings } from '../_lib/marketing-content'
import { getCurrentLocale } from '../_lib/locale-server'
import { getCurrentNavUser } from '../_lib/session'
import { FooterBar } from './shell/FooterBar'

type SiteShellProps = {
  announcement?: null | string
  children: ReactNode
  currentPath?: string
  footer?: FooterContent | null
  layoutMode?: 'document' | 'fixed'
  mobileChildren?: ReactNode
  navigation?: NavigationItem[] | null
  siteDescription?: null | string
  showAuthEntry?: boolean
  showFooter?: boolean
  showLocaleSwitcher?: boolean
  showUtilityNav?: boolean
  supportEmail?: null | string
  user?: null | {
    email?: string | null
    role?: string | null
  }
}

export async function SiteShell({
  announcement,
  children,
  currentPath,
  footer,
  layoutMode = 'fixed',
  mobileChildren,
  navigation,
  showAuthEntry = true,
  showFooter = true,
  showLocaleSwitcher = true,
  siteDescription,
  supportEmail,
  user,
}: SiteShellProps) {
  const locale = await getCurrentLocale()
  const navUser = await getCurrentNavUser()
  const defaultSiteSettings = getDefaultSiteSettings(locale)
  const footerContent = { ...getDefaultFooter(locale), ...footer }
  const navigationItems = resolvePublicNavigationItems(navigation)
  const navigationUser = navUser ?? (user ? { email: user.email, role: user.role } : null)

  const fixedStageStyle = {
    '--app-nav-scale': 'calc(100vw / 1920px)',
    '--app-nav-height': 'calc(60px * var(--app-nav-scale))',
    '--app-stage-scale': 'clamp(1, calc(100vw / 2240px), 1.15)',
  } as React.CSSProperties
  void announcement
  void showLocaleSwitcher

  if (layoutMode === 'document') {
    return (
      <div className="min-h-screen overflow-x-hidden bg-[#181818] text-[#ededee]" style={fixedStageStyle}>
        <TopNavigation
          active={getPublicNavigationActiveID(currentPath, navigationItems)}
          className="z-[60]"
          fitViewport
          items={navigationItems}
          showAuthEntry={showAuthEntry}
          user={navigationUser}
        />
        <main className="min-h-[calc(100vh-var(--app-nav-height))] bg-[#181818]">
          <AuthModalStage clipContent={false}>{children}</AuthModalStage>
        </main>

        {showFooter ? (
          <FooterBar
            footerContent={footerContent}
            siteDescription={siteDescription || defaultSiteSettings.siteDescription}
            supportEmail={supportEmail || defaultSiteSettings.supportEmail}
          />
        ) : null}
      </div>
    )
  }

  return (
    <>
      {mobileChildren ? <div className="h-screen w-screen overflow-y-auto bg-[#181818] text-[#ededee] md:hidden">{mobileChildren}</div> : null}
      <div className={`${mobileChildren ? 'hidden md:block' : ''} relative h-screen w-screen overflow-hidden bg-[#181818] text-[#ededee]`} style={fixedStageStyle}>
        <TopNavigation
          active={getPublicNavigationActiveID(currentPath, navigationItems)}
          className="z-[60]"
          fitViewport
          items={navigationItems}
          showAuthEntry={showAuthEntry}
          user={navigationUser}
        />
      <div
        className="absolute left-1/2 h-[1020px] w-[1920px] origin-top bg-[#181818]"
        style={{
          top: 'var(--app-nav-height)',
          transform: 'translateX(-50%) scale(var(--app-stage-scale))',
        }}
      >
        <main className="h-[1020px] overflow-hidden">
          <AuthModalStage>{children}</AuthModalStage>
        </main>

        {showFooter ? (
          <FooterBar
            footerContent={footerContent}
            siteDescription={siteDescription || defaultSiteSettings.siteDescription}
            supportEmail={supportEmail || defaultSiteSettings.supportEmail}
          />
        ) : null}
      </div>
    </div>
    </>
  )
}
