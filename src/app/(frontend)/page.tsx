import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

import { SiteShell } from './_components/SiteShell'
import { getMarketingSiteData } from './_lib/marketing'
import { getCurrentUser } from './_lib/session'

type Tone = 'blue' | 'pink' | 'violet'

const entryCards = [
  {
    href: '/generate?mode=image',
    eyebrow: '图像转 3D',
    title: '图生 3D',
    text: '上传参考图后直接进入 Studio，快速开始完整的生成流程。',
  },
  {
    href: '/generate?mode=text',
    eyebrow: '文本转 3D',
    title: '文生 3D',
    text: '从角色设定、物件描述或风格提示词开始，直接创建任务。',
  },
] as const

const toneStyles: Record<Tone, string> = {
  blue: 'from-sky-500/30 via-sky-500/10 to-background',
  pink: 'from-fuchsia-500/30 via-pink-500/10 to-background',
  violet: 'from-violet-500/30 via-indigo-500/10 to-background',
}

export default async function HomePage() {
  const [user, marketing] = await Promise.all([getCurrentUser(), getMarketingSiteData()])
  const { homepageContent, siteSettings } = marketing
  const previewWorks = homepageContent.featuredWorks.slice(0, 6)

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
          <Badge variant="secondary">{siteSettings.siteName}</Badge>
          <h1 className="mt-4 max-w-2xl text-balance text-4xl font-semibold tracking-tight sm:text-5xl">直接开始生成 3D</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
            首页保持极简，只保留清晰入口、简洁导航与底部作品预览，让真正的工作流留在 Studio 与 Dashboard。
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button asChild>
              <Link href="/generate?mode=image">开始图生 3D</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/generate?mode=text">开始文生 3D</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href={user ? '/dashboard' : '/register'}>{user ? '进入工作台' : '注册账号'}</Link>
            </Button>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {entryCards.map((item, index) => (
            <Card key={item.title} className="overflow-hidden border-border/60 bg-card/80 shadow-xl shadow-black/5">
              <CardHeader className="gap-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{item.eyebrow}</p>
                    <CardTitle className="mt-3 text-3xl tracking-tight">{item.title}</CardTitle>
                  </div>
                  <Badge variant={index === 0 ? 'secondary' : 'outline'}>{index === 0 ? '主入口' : '快速模式'}</Badge>
                </div>
                <CardDescription className="max-w-xl text-sm leading-6">{item.text}</CardDescription>
              </CardHeader>

              <CardContent>
                <div
                  className={`relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br ${index === 0 ? toneStyles.violet : toneStyles.blue} p-6`}
                >
                  <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.45),transparent_60%)]" />
                  <div className="relative flex min-h-40 flex-col justify-between gap-6">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">Studio</Badge>
                      <Badge variant="outline">GLB / STL / OBJ</Badge>
                    </div>
                    <div className="flex max-w-sm flex-col gap-2">
                      <p className="text-lg font-medium">
                        {index === 0 ? '适合从草图、立绘与照片参考开始。' : '适合从提示词、风格方向与角色设定开始。'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {index === 0
                          ? '上传后可直接提交任务，再进入结果页、模型库与订单流程继续处理。'
                          : '先用文本驱动生成，再进入模型管理与交付流程。'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="justify-between gap-4">
                <span className="text-sm text-muted-foreground">{index === 0 ? '参考图优先流程' : '提示词优先流程'}</span>
                <Button asChild variant="secondary">
                  <Link href={item.href}>进入入口</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 sm:pb-16">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">作品预览</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">底部只放近期作品</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">不再堆叠过长的营销说明，只展示作品方向与可交付质感。</p>
          </div>
          <Button asChild variant="outline">
            <Link href="/showcase">查看更多</Link>
          </Button>
        </div>

        <Separator className="my-6" />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {previewWorks.map((item) => {
            const tone = (item.tone || 'violet') as Tone

            return (
              <Card key={`${item.category}-${item.title}`} className="overflow-hidden border-border/60 bg-card/80">
                <CardContent className="p-4">
                  <div className={`relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br ${toneStyles[tone]} p-5`}>
                    <div className="absolute left-1/2 top-1/2 size-24 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/50 blur-3xl" />
                    <div className="absolute inset-x-6 bottom-6 top-6 rounded-full border border-white/40" />
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
            )
          })}
        </div>
      </section>
    </SiteShell>
  )
}
