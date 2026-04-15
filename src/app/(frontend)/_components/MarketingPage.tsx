import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

import type { MarketingPageContent } from '../_lib/marketing-content'
import { getMarketingSiteData } from '../_lib/marketing'
import { getCurrentUser } from '../_lib/session'
import { SiteShell } from './SiteShell'

type MarketingPageProps = {
  page: MarketingPageContent
}

export async function MarketingPage({ page }: MarketingPageProps) {
  const [user, marketing] = await Promise.all([getCurrentUser(), getMarketingSiteData()])
  const { siteSettings } = marketing

  return (
    <SiteShell
      announcement={siteSettings.announcement}
      currentPath={page.currentPath}
      footer={siteSettings.footer}
      navigation={siteSettings.headerNav}
      user={user}
    >
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <Badge variant="secondary">{page.heroEyebrow}</Badge>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">{page.heroTitle}</h1>
            <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">{page.heroText}</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href={page.heroPrimaryCTA.href}>{page.heroPrimaryCTA.label}</Link>
            </Button>
            {page.heroSecondaryCTA ? (
              <Button asChild variant="outline">
                <Link href={page.heroSecondaryCTA.href}>{page.heroSecondaryCTA.label}</Link>
              </Button>
            ) : null}
          </div>
        </div>

        <Separator className="my-8" />

        <section className="grid gap-4 xl:grid-cols-3">
          {page.sections.map((section) => (
            <Card className="border-border/60 bg-card/80 shadow-sm" id={section.id} key={section.id}>
              <CardHeader className="gap-3">
                <Badge variant="outline">{section.eyebrow}</Badge>
                <CardTitle className="text-2xl tracking-tight">{section.title}</CardTitle>
                <CardDescription className="text-sm leading-6">{section.text}</CardDescription>
              </CardHeader>

              <CardContent className="flex flex-col gap-4">
                {section.cards?.length ? (
                  <div className="grid gap-3">
                    {section.cards.map((card) => (
                      <div className="rounded-2xl border border-border/60 bg-muted/30 p-4" key={card.title}>
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="text-base font-medium tracking-tight">{card.title}</h3>
                          {card.note ? <Badge variant="secondary">{card.note}</Badge> : null}
                        </div>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">{card.text}</p>
                      </div>
                    ))}
                  </div>
                ) : null}

                {section.bullets?.length ? (
                  <ul className="grid gap-3">
                    {section.bullets.map((bullet) => (
                      <li className="rounded-2xl border border-border/60 bg-muted/20 px-4 py-3 text-sm leading-6 text-muted-foreground" key={bullet}>
                        {bullet}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </section>
      </section>
    </SiteShell>
  )
}
