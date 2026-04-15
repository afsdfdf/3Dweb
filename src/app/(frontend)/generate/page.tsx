import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { defaultGenerationPricing } from '@/lib/taskBilling'

import { GenerateForm } from '../_components/GenerateForm'
import { ModelViewer } from '../_components/ModelViewer'
import { getMarketingSiteData } from '../_lib/marketing'
import { SiteShell } from '../_components/SiteShell'
import { getCurrentUser } from '../_lib/session'

const modeLabel = {
  image: '图生 3D',
  text: '文生 3D',
  hybrid: '图文混合',
} as const

const modeDescription = {
  image: '上传概念图、照片或草图，快速生成可继续编辑与交付的 3D 结果。',
  text: '从角色设定与提示词方向开始，直接在 Studio 中创建生成任务。',
  hybrid: '需要更细致控制时，可同时结合参考图与文本提示。',
} as const

export default async function GeneratePage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: 'hybrid' | 'image' | 'text' }>
}) {
  const [user, query, marketingData] = await Promise.all([getCurrentUser(), searchParams, getMarketingSiteData()])
  const initialMode = query.mode === 'image' || query.mode === 'text' || query.mode === 'hybrid' ? query.mode : 'image'
  const generationPricing = {
    downloadCredits: marketingData.siteSettings.generationPricing.downloadCredits ?? defaultGenerationPricing.downloadCredits,
    hybridCredits: marketingData.siteSettings.generationPricing.hybridCredits ?? defaultGenerationPricing.hybridCredits,
    imageCredits: marketingData.siteSettings.generationPricing.imageCredits ?? defaultGenerationPricing.imageCredits,
    textCredits: marketingData.siteSettings.generationPricing.textCredits ?? defaultGenerationPricing.textCredits,
  }

  return (
    <SiteShell currentPath="/generate" user={user}>
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <Badge variant="secondary">Studio</Badge>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">{modeLabel[initialMode]}</h1>
            <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">{modeDescription[initialMode]}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/dashboard/tasks">任务记录</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard/library">模型库</Link>
            </Button>
          </div>
        </div>

        <Separator className="my-8" />

        {user ? (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
            <GenerateForm generationPricing={generationPricing} initialMode={initialMode} />

            <Card className="overflow-hidden border-border/60 bg-card/80 shadow-xl shadow-black/5">
              <CardHeader className="gap-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">预览</p>
                    <CardTitle className="mt-2 text-2xl tracking-tight">实时预览</CardTitle>
                  </div>
                  <Badge>Studio 在线</Badge>
                </div>
                <CardDescription>提交任务前先确认输入方式、输出格式与质量档位。</CardDescription>
              </CardHeader>

              <CardContent className="flex flex-col gap-4">
                <div className="relative aspect-[4/5] min-h-[420px] overflow-hidden rounded-2xl border border-border/60 bg-black">
                  <ModelViewer accent={initialMode === 'text' ? 'blue' : 'violet'} className="h-full w-full" />
                  <div className="pointer-events-none absolute left-4 top-4 rounded-full bg-background/85 px-3 py-1 text-xs text-foreground shadow-sm">
                    {modeLabel[initialMode]}
                  </div>
                  <div className="pointer-events-none absolute right-4 top-4 rounded-full bg-background/85 px-3 py-1 text-xs text-foreground shadow-sm">
                    GLB / STL / OBJ
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-border/60 bg-muted/40 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">流程</p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">创建任务、查看结果、保存模型，再继续进入订单交付流程。</p>
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-muted/40 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">提示</p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">生成积分由后台统一配置，当前按图生 / 文生 / 图文混合三种模式计费。</p>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="justify-between gap-3">
                <span className="text-sm text-muted-foreground">结果页会同步显示进度、预览与下载入口。</span>
                <Button asChild variant="secondary">
                  <Link href="/dashboard/tasks">查看队列</Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        ) : (
          <Card className="border-border/60 bg-card/80 shadow-xl shadow-black/5">
            <CardHeader className="gap-3">
              <Badge variant="outline">需要登录</Badge>
              <CardTitle className="text-2xl tracking-tight">登录后即可进入 Studio</CardTitle>
              <CardDescription>首页只负责入口，这一页才是真正开始生产流程的工作区。</CardDescription>
            </CardHeader>
            <CardFooter className="flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/login">去登录</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/register">创建账号</Link>
              </Button>
            </CardFooter>
          </Card>
        )}
      </section>
    </SiteShell>
  )
}
