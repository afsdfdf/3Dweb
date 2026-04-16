import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

import { SiteShell } from './_components/SiteShell'
import { getMarketingSiteData } from './_lib/marketing'
import { getCurrentLocale } from './_lib/locale-server'
import { getCurrentUser } from './_lib/session'

type Tone = 'blue' | 'pink' | 'violet'

const toneStyles: Record<Tone, string> = {
  blue: 'from-sky-500/30 via-sky-500/10 to-background',
  pink: 'from-fuchsia-500/30 via-pink-500/10 to-background',
  violet: 'from-violet-500/30 via-indigo-500/10 to-background',
}

export default async function HomePage() {
  const locale = await getCurrentLocale()
  const [user, marketing] = await Promise.all([getCurrentUser(), getMarketingSiteData()])
  const { homepageContent, siteSettings } = marketing
  const featured = homepageContent.featuredWorks.slice(0, 6)

  return (
    <SiteShell
      announcement={siteSettings.announcement}
      currentPath="/"
      footer={siteSettings.footer}
      navigation={siteSettings.headerNav}
      user={user}
    >
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="max-w-3xl">
          <Badge variant="secondary">{homepageContent.hero.eyebrow}</Badge>
          <h1 className="mt-4 max-w-3xl text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
            {homepageContent.hero.title}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
            {homepageContent.hero.subtitle}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button asChild>
              <Link href={homepageContent.hero.primaryCTA.href || '/generate'}>{homepageContent.hero.primaryCTA.label || (locale === 'zh' ? '进入 Studio' : 'Open Studio')}</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={homepageContent.hero.secondaryCTA.href || '/showcase'}>{homepageContent.hero.secondaryCTA.label || (locale === 'zh' ? '查看案例展示' : 'View showcase')}</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href={user ? '/dashboard' : '/register'}>
                {user ? (locale === 'zh' ? '打开工作台' : 'Open workspace') : locale === 'zh' ? '创建账号' : 'Create account'}
              </Link>
            </Button>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {homepageContent.serviceBlocks.map((item, index) => {
            const tone = (featured[index]?.tone || 'violet') as Tone

            return (
              <Card key={item.title} className="overflow-hidden border-border/60 bg-card/80 shadow-xl shadow-black/5">
                <CardHeader className="gap-4">
                  <CardTitle className="text-2xl tracking-tight">{item.title}</CardTitle>
                  <CardDescription className="text-sm leading-6">{item.text}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className={`rounded-2xl border border-border/60 bg-gradient-to-br ${toneStyles[tone]} p-5`}>
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{homepageContent.processSection.eyebrow}</p>
                    <p className="mt-3 text-sm leading-6 text-foreground">{homepageContent.processSteps[index]?.title || homepageContent.entrySection.title}</p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 sm:pb-16">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{homepageContent.introBand.eyebrow}</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{homepageContent.introBand.title}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{homepageContent.introBand.text}</p>
          </div>
          <Button asChild variant="outline">
            <Link href="/showcase">{locale === 'zh' ? '查看更多' : 'See more'}</Link>
          </Button>
        </div>

        <Separator className="my-6" />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {featured.map((item) => (
            <Card key={`${item.category}-${item.title}`} className="overflow-hidden border-border/60 bg-card/80">
              <CardContent className="p-4">
                <div className={`relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br ${toneStyles[(item.tone || 'violet') as Tone]} p-5`}>
                  <div className="absolute left-1/2 top-1/2 size-24 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/50 blur-3xl" />
                  <div className="relative flex aspect-[4/3] items-end">
                    <div>
                      <Badge variant="outline">{item.category}</Badge>
                      <h3 className="mt-3 text-xl font-semibold tracking-tight">{item.title}</h3>
                      <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">{item.summary}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </SiteShell>
  )
}
