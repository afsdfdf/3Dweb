import type { ReactNode } from 'react'

import { AuthModalStage } from '@/components/auth/AuthModalStage'
import { TopNavigation } from '@/components/ui-lab/top-navigation'
import { getPublicNavigationActiveID, publicNavigationItems } from '@/lib/publicNavigation'

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
  mobileChildren,
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
  const navigationUser = navUser
    ? {
        avatarUrl: navUser.avatarUrl,
        creditsBalance: navUser.creditsBalance,
        displayName: navUser.displayName,
        email: navUser.email,
      }
    : user
      ? { email: user.email }
      : null

  const fixedStageStyle = {
    '--app-stage-scale': 'max(calc(100vw / 1920px), calc((100vh - 60px) / 1020px))',
  } as React.CSSProperties
  void announcement
  void showLocaleSwitcher

  return (
    <>
      {mobileChildren ? <div className="h-screen w-screen overflow-y-auto bg-[#181818] text-[#ededee] md:hidden">{mobileChildren}</div> : null}
      <div className={`${mobileChildren ? 'hidden md:block' : ''} relative h-screen w-screen overflow-hidden bg-[#181818] text-[#ededee]`} style={fixedStageStyle}>
        <TopNavigation
          active={getPublicNavigationActiveID(currentPath)}
          className="absolute left-0 right-0 top-0 z-[60]"
          items={publicNavigationItems}
          showAuthEntry={showAuthEntry}
          user={navigationUser}
        />
      <div
        className="absolute left-1/2 top-[60px] h-[1020px] w-[1920px] origin-top bg-[#181818]"
        style={{
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
