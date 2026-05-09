import Link from 'next/link'

import { AuthModalStage } from '@/components/auth/AuthModalStage'
import { TopNavigation } from '@/components/ui-lab/top-navigation'
import { Badge } from '@/components/ui/badge'
import { getPublicNavigationActiveID, publicNavigationItems } from '@/lib/publicNavigation'

import { VerifyEmailClient } from '../../_components/VerifyEmailClient'
import { FooterBar } from '../../_components/shell/FooterBar'
import { getMarketingSiteData } from '../../_lib/marketing'
import { getCurrentNavUser } from '../../_lib/session'

type VerifyEmailStageProps = {
  footerContent: Awaited<ReturnType<typeof getMarketingSiteData>>['siteSettings']['footer']
  siteDescription: string
  supportEmail: string
  token: string
}

function VerifyEmailStage({ footerContent, siteDescription, supportEmail, token }: VerifyEmailStageProps) {
  return (
    <>
      <main className="mx-auto flex min-h-[calc(100vh-260px)] w-full max-w-5xl flex-col justify-center px-4 py-10 sm:px-6 sm:py-14">
        <section className="w-full">
          <div className="mx-auto max-w-2xl">
            <Badge className="border-[#8d5c25] bg-[#24211c] text-[#f1d99c]" variant="outline">
              Email Verification
            </Badge>
            <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-tight text-[#f5ead0] sm:text-5xl">Verifying your email</h1>
            <p className="mt-4 text-base leading-7 text-[#b9bac0] sm:text-lg">
              The system will verify the email token automatically and show the result. After verification succeeds, you can sign in to Thorns Tavern.
            </p>
          </div>

          <div className="mt-8 flex justify-center">
            <VerifyEmailClient token={token} />
          </div>
        </section>
      </main>

      <FooterBar footerContent={footerContent} siteDescription={siteDescription} supportEmail={supportEmail} />
    </>
  )
}

export default async function VerifyEmailPage({ params }: { params: Promise<{ token: string }> }) {
  const [navUser, marketing, { token }] = await Promise.all([getCurrentNavUser(), getMarketingSiteData(), params])
  const { siteSettings } = marketing
  const siteDescription = siteSettings.siteDescription || 'An AI 3D product platform for character creation, asset management, and print fulfillment.'
  const supportEmail = siteSettings.supportEmail || 'support@example.com'

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#181818] text-[#ededee]">
      <AuthModalStage>
        <TopNavigation active={getPublicNavigationActiveID('/verify-email')} className="sticky top-0 z-[80] hidden md:block" items={publicNavigationItems} user={navUser} />
        <header className="sticky top-0 z-40 flex items-center justify-between border-b border-[#403f46] bg-[#181818]/95 px-4 py-3 backdrop-blur md:hidden">
          <Link className="flex h-8 w-[161px] items-center" href="/" aria-label="Thorns Tavern home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="Thorns Tavern" className="h-8 w-[161px] object-contain" src="/ui/nav/brand-wordmark.png" />
          </Link>
          <Link className="text-xs font-semibold uppercase tracking-[0.16em] text-[#f0d188]" href="/login">
            Login
          </Link>
        </header>
        <VerifyEmailStage footerContent={siteSettings.footer} siteDescription={siteDescription} supportEmail={supportEmail} token={token} />
      </AuthModalStage>
    </div>
  )
}
