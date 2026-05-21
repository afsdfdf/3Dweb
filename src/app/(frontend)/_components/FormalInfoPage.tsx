import Link from 'next/link'

import { BorderComboFrame1 } from '@/components/ui-lab/border-combo-frame-1'
import { BorderComboFrame2Variant } from '@/components/ui-lab/border-combo-frame-2'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

import type { FormalPageContent } from '../_lib/formal-pages'
import { getMarketingSiteData } from '../_lib/marketing'
import { getCurrentUser } from '../_lib/session'
import { SiteShell } from './SiteShell'
import { FooterBar } from './shell/FooterBar'

type FormalInfoPageProps = {
  page: FormalPageContent
}

function FormalMobilePage({
  page,
  siteDescription,
  siteSettings,
  supportEmail,
}: {
  page: FormalPageContent
  siteDescription: string
  siteSettings: Awaited<ReturnType<typeof getMarketingSiteData>>['siteSettings']
  supportEmail: string
}) {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#181818_0%,#222225_44%,#181818_100%)]">
      <header className="sticky top-0 z-40 border-b border-[#403f46] bg-[#181818]/95 px-4 py-3 backdrop-blur">
        <Link className="flex h-8 w-[161px] items-center" href="/">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="Thorns Tavern" className="h-8 w-[161px] object-contain" src="/ui/nav/brand-wordmark.png" />
        </Link>
      </header>

      <main className="flex flex-col gap-8 px-4 py-6">
        <BorderComboFrame1 className="bg-[linear-gradient(135deg,rgba(13,13,15,0.96),rgba(47,45,48,0.9))]" style={{ pointerEvents: 'auto' }}>
          <div className="flex flex-col gap-4 p-1">
            <Badge className="w-fit border-[#8d5c25] bg-[#24211c] text-[#f1d99c]" variant="outline">
              {page.heroEyebrow}
            </Badge>
            <h1 className="text-3xl font-semibold leading-tight tracking-tight text-[#f5ead0]">{page.heroTitle}</h1>
            <p className="text-sm leading-6 text-[#b9bac0]">{page.heroText}</p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="sm">
                <Link href={page.heroPrimaryCTA.href}>{page.heroPrimaryCTA.label}</Link>
              </Button>
              {page.heroSecondaryCTA ? (
                <Button asChild className="border-[#5c4a35] bg-[#17181b] text-[#d8d0bf] hover:bg-[#23252b]" size="sm" variant="outline">
                  <Link href={page.heroSecondaryCTA.href}>{page.heroSecondaryCTA.label}</Link>
                </Button>
              ) : null}
            </div>
          </div>
        </BorderComboFrame1>

        <section>
          <p className="text-xs uppercase tracking-[0.24em] text-[#8f7a4a]">{page.heroEyebrow}</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-[#f1e2bc]">Page Summary</h2>
          <div className="mt-4 grid gap-3">
            {page.summaryCards.map((card) => (
              <div className="rounded-[8px] border border-[#403f46] bg-[#18181b] p-4" key={card.title}>
                <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-[#f0d188]">{card.title}</h3>
                <p className="mt-1 text-sm leading-6 text-[#a7a9b0]">{card.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <p className="text-xs uppercase tracking-[0.24em] text-[#8f7a4a]">{page.heroEyebrow}</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-[#f1e2bc]">Details</h2>
          <div className="mt-4 grid gap-4">
            {page.sections.map((section) => (
              <BorderComboFrame1 className="bg-[#1c1c20]" key={section.title} style={{ pointerEvents: 'auto' }}>
                <div className="p-1">
                  <h3 className="text-xl font-semibold tracking-tight text-[#f1e2bc]">{section.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#a7a9b0]">{section.body}</p>
                  {section.items?.length ? (
                    <div className="mt-4 flex flex-col gap-3">
                      <Separator className="bg-[#403f46]" />
                      {section.items.map((item) => (
                        <div className="rounded-[8px] border border-[#403f46] bg-[#18181b] p-4" key={item.title}>
                          <h4 className="text-sm font-semibold text-[#f1d99c]">{item.title}</h4>
                          <p className="mt-1 text-sm leading-6 text-[#9b9da5]">{item.body}</p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              </BorderComboFrame1>
            ))}
          </div>
        </section>

        {page.contactCards?.length ? (
          <section>
            <p className="text-xs uppercase tracking-[0.24em] text-[#8f7a4a]">Next steps</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-[#f1e2bc]">Helpful Links</h2>
            <div className="mt-4 grid gap-4">
              {page.contactCards.map((card) => (
                <BorderComboFrame2Variant className="bg-[#1c1c20]" key={card.title} style={{ pointerEvents: 'auto' }}>
                  <div className="flex flex-col gap-4 p-1">
                    <div>
                      <h3 className="text-xl font-semibold tracking-tight text-[#f1e2bc]">{card.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-[#a7a9b0]">{card.body}</p>
                    </div>
                    {card.href ? (
                      <Button asChild className="w-fit border-[#5c4a35] bg-[#17181b] text-[#d8d0bf] hover:bg-[#23252b]" size="sm" variant="outline">
                        <Link href={card.href}>{card.label}</Link>
                      </Button>
                    ) : (
                      <Badge variant="secondary">{card.label}</Badge>
                    )}
                  </div>
                </BorderComboFrame2Variant>
              ))}
            </div>
          </section>
        ) : null}
      </main>

      <FooterBar footerContent={siteSettings.footer} siteDescription={siteDescription} supportEmail={supportEmail} />
    </div>
  )
}

export async function FormalInfoPage({ page }: FormalInfoPageProps) {
  const [user, marketing] = await Promise.all([getCurrentUser(), getMarketingSiteData()])
  const { siteSettings } = marketing
  const siteDescription = siteSettings.siteDescription || 'An AI 3D product platform for character creation, asset management, and print fulfillment.'
  const supportEmail = siteSettings.supportEmail || 'support@example.com'

  return (
    <SiteShell
      announcement={siteSettings.announcement}
      currentPath={page.currentPath}
      footer={siteSettings.footer}
      navigation={siteSettings.headerNav}
      showFooter={false}
      mobileChildren={<FormalMobilePage page={page} siteDescription={siteDescription} siteSettings={siteSettings} supportEmail={supportEmail} />}
      user={user}
    >
      <div className="h-[1020px] overflow-y-auto bg-[radial-gradient(circle_at_50%_4%,rgba(155,112,45,0.16),transparent_24%),linear-gradient(180deg,#181818_0%,#222225_42%,#181818_100%)]">
        <section className="mx-auto max-w-[var(--content-page-max-width)] px-[var(--content-page-gutter)] pb-6 pt-10">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_440px]">
            <BorderComboFrame1
              className="min-h-[360px] bg-[radial-gradient(circle_at_12%_14%,rgba(240,209,136,0.12),transparent_22%),linear-gradient(135deg,rgba(13,13,15,0.96),rgba(47,45,48,0.9))] shadow-[0_20px_52px_rgba(0,0,0,0.36)]"
              style={{ pointerEvents: 'auto' }}
            >
              <div className="flex min-h-[292px] flex-col justify-center px-2 py-1">
                <Badge className="w-fit border-[#8d5c25] bg-[#24211c] text-[#f1d99c]" variant="outline">
                  {page.heroEyebrow}
                </Badge>
                <h1 className="mt-5 max-w-[var(--content-subject-max-width)] text-5xl font-semibold leading-tight tracking-tight text-[#f5ead0]">{page.heroTitle}</h1>
                <p className="mt-5 max-w-[var(--content-subject-max-width)] text-base leading-7 text-[#b9bac0]">{page.heroText}</p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Button asChild>
                    <Link href={page.heroPrimaryCTA.href}>{page.heroPrimaryCTA.label}</Link>
                  </Button>
                  {page.heroSecondaryCTA ? (
                    <Button asChild className="border-[#5c4a35] bg-[#17181b] text-[#d8d0bf] hover:bg-[#23252b]" variant="outline">
                      <Link href={page.heroSecondaryCTA.href}>{page.heroSecondaryCTA.label}</Link>
                    </Button>
                  ) : null}
                </div>
              </div>
            </BorderComboFrame1>

            <BorderComboFrame1 className="min-h-[360px] bg-[#1b1b1f] shadow-[0_20px_52px_rgba(0,0,0,0.28)]" style={{ pointerEvents: 'auto' }}>
              <div className="flex min-h-[292px] flex-col gap-3 px-1 py-1">
                <Badge className="w-fit border-[#8d5c25] text-[#f0d188]" variant="outline">
                  Updated {page.lastUpdated}
                </Badge>
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight text-[#f1e2bc]">Page Summary</h2>
                  <p className="mt-2 text-sm leading-6 text-[#a7a9b0]">
                  A concise reference for how this page applies to the Thorns Tavern product workflow.
                  </p>
                </div>
                {page.summaryCards.map((card) => (
                  <div className="flex flex-col gap-1 rounded-[8px] border border-[#403f46] bg-[#18181b] p-4" key={card.title}>
                    <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-[#f0d188]">{card.title}</h2>
                    <p className="text-sm leading-6 text-[#a7a9b0]">{card.body}</p>
                  </div>
                ))}
              </div>
            </BorderComboFrame1>
          </div>
        </section>

        <section className="mx-auto max-w-[var(--content-page-max-width)] px-[var(--content-page-gutter)] py-6">
          <div className="mb-5 flex items-end justify-between border-b border-[#403f46] pb-4">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-[#8f7a4a]">{page.heroEyebrow}</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight text-[#f1e2bc]">Details</h2>
            </div>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {page.sections.map((section) => (
              <BorderComboFrame1 className="min-h-[300px] bg-[#1c1c20]" key={section.title} style={{ pointerEvents: 'auto' }}>
                <div className="min-h-[232px] p-1">
                  <h2 className="text-2xl font-semibold tracking-tight text-[#f1e2bc]">{section.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-[#a7a9b0]">{section.body}</p>
                {section.items?.length ? (
                  <div className="mt-4 flex flex-col gap-4">
                    <Separator className="bg-[#403f46]" />
                    <div className="grid gap-3">
                      {section.items.map((item) => (
                        <div className="flex flex-col gap-1 rounded-[8px] border border-[#403f46] bg-[#18181b] p-4" key={item.title}>
                          <h3 className="text-sm font-semibold text-[#f1d99c]">{item.title}</h3>
                          <p className="text-sm leading-6 text-[#9b9da5]">{item.body}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
                </div>
              </BorderComboFrame1>
            ))}
          </div>
        </section>

        {page.contactCards?.length ? (
          <section className="mx-auto max-w-[var(--content-page-max-width)] px-[var(--content-page-gutter)] py-6">
            <div className="mb-5 flex items-end justify-between border-b border-[#403f46] pb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-[#8f7a4a]">Next steps</p>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight text-[#f1e2bc]">Helpful Links</h2>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {page.contactCards.map((card) => (
                <BorderComboFrame2Variant className="min-h-[260px] bg-[#1c1c20]" key={card.title} style={{ pointerEvents: 'auto' }}>
                  <div className="flex min-h-[124px] flex-col justify-between gap-5 p-1">
                    <div>
                      <h2 className="text-xl font-semibold tracking-tight text-[#f1e2bc]">{card.title}</h2>
                      <p className="mt-2 text-sm leading-6 text-[#a7a9b0]">{card.body}</p>
                    </div>
                    {card.href ? (
                      <Button asChild className="w-fit border-[#5c4a35] bg-[#17181b] text-[#d8d0bf] hover:bg-[#23252b]" variant="outline">
                        <Link href={card.href}>{card.label}</Link>
                      </Button>
                    ) : (
                      <Badge variant="secondary">{card.label}</Badge>
                    )}
                  </div>
                </BorderComboFrame2Variant>
              ))}
            </div>
          </section>
        ) : null}

        <FooterBar
          footerContent={siteSettings.footer}
          siteDescription={siteDescription}
          supportEmail={supportEmail}
        />
      </div>
    </SiteShell>
  )
}
