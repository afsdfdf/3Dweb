import type { ReactNode } from 'react'

import { AuthModalStage } from '@/components/auth/AuthModalStage'

import type { FooterContent, NavigationItem } from '../_lib/marketing-content'
import { getDefaultFooter, getDefaultSiteSettings } from '../_lib/marketing-content'
import { getCurrentLocale } from '../_lib/locale-server'
import { getCurrentNavUser } from '../_lib/session'
import { FooterBar } from './shell/FooterBar'
import { TopNavBar } from './shell/TopNavBar'

type SiteShellProps = {
  announcement?: null | string
  children: ReactNode
  currentPath?: string
  footer?: FooterContent | null
  mobileChildren?: ReactNode
  navigation?: NavigationItem[] | null
  showAuthEntry?: boolean
  showFooter?: boolean
  showLocaleSwitcher?: boolean
  showUtilityNav?: boolean
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
  user,
}: SiteShellProps) {
  const locale = await getCurrentLocale()
  const navUser = await getCurrentNavUser()
  const defaultSiteSettings = getDefaultSiteSettings(locale)
  const footerContent = { ...getDefaultFooter(locale), ...footer }

  const fixedStageStyle = {
    '--app-stage-scale': 'max(calc(100vw / 1920px), calc(100vh / 1080px))',
  } as React.CSSProperties

  return (
    <>
      {mobileChildren ? <div className="h-screen w-screen overflow-y-auto bg-[#181818] text-[#ededee] md:hidden">{mobileChildren}</div> : null}
      <div className={`${mobileChildren ? 'hidden md:block' : ''} h-screen w-screen overflow-hidden bg-[#181818] text-[#ededee]`} style={fixedStageStyle}>
      <div
        className="absolute left-1/2 top-1/2 h-[1080px] w-[1920px] origin-center bg-[#181818]"
        style={{
          transform: 'translate(-50%, -50%) scale(var(--app-stage-scale))',
        }}
      >
        {announcement ? (
          <div className="border-b border-[#403f46] bg-[#181818]">
            <div className="mx-auto max-w-[1600px] px-4 py-2 text-center text-[10px] uppercase tracking-[0.3em] text-[#8f9199] sm:px-6">
              {announcement}
            </div>
          </div>
        ) : null}

        <TopNavBar
          currentPath={currentPath}
          locale={locale}
          navigation={[]}
          showAuthEntry={showAuthEntry}
          showLocaleSwitcher={showLocaleSwitcher}
          user={
            navUser
              ? {
                  avatarUrl: navUser.avatarUrl,
                  creditsBalance: navUser.creditsBalance,
                  displayName: navUser.displayName,
                  email: navUser.email,
                }
              : user
          }
        />

        <main className="h-[1020px] overflow-hidden">
          <AuthModalStage>{children}</AuthModalStage>
        </main>

        {showFooter ? (
          <FooterBar
            footerContent={footerContent}
            siteDescription={defaultSiteSettings.siteDescription}
            supportEmail={defaultSiteSettings.supportEmail}
          />
        ) : null}
      </div>
    </div>
    </>
  )
}
