import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

import { SiteShell } from '../_components/SiteShell'
import { getCurrentUser } from '../_lib/session'

const apiLayers = [
  {
    title: 'Studio',
    text: 'Studio 负责创建任务、提交提示词、上传参考图，并把生成意图转换成可执行任务。',
  },
  {
    title: 'Dashboard',
    text: 'Dashboard 负责查看状态、沉淀资产、推进订单与管理账号，不直接承担后台运维职责。',
  },
  {
    title: 'Admin',
    text: 'Admin 负责运营配置、内容管理、订单干预与高权限操作，与用户工作台严格分离。',
  },
  {
    title: 'API',
    text: 'API 负责稳定的程序集成入口，为外部应用、自动化任务与开发者系统提供访问层。',
  },
]

const apiCapabilities = ['任务提交与结果查询', '模型资产下载与格式分发', '订单与支付状态同步', '用户权限与访问边界控制']

const securityRules = [
  '前台接口只返回当前用户有权限查看的数据。',
  'Studio、Dashboard、Admin 与 API 的入口和职责必须保持分层。',
  '支付状态通过订单流与回调流同步，不在前台任意放开。',
  'Payload Local API 在传入 user 时必须显式设置 overrideAccess: false。',
]

export default async function DevelopersPage() {
  const user = await getCurrentUser()

  return (
    <SiteShell currentPath="/developers" user={user}>
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="max-w-3xl">
          <Badge variant="secondary">开发者 / API</Badge>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">为完整产品站准备的开发者入口</h1>
          <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
            这里不是孤立的展示页，而是围绕真实产品结构整理的接入入口：前台、Studio、Dashboard、Admin 与 API 都要保持清晰分层。
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/generate">进入 Studio</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard">打开工作台</Link>
            </Button>
          </div>
        </div>

        <Separator className="my-8" />

        <section className="grid gap-4 xl:grid-cols-4">
          {apiLayers.map((item) => (
            <Card className="border-border/60 bg-card/80 shadow-sm" key={item.title}>
              <CardHeader>
                <Badge variant="outline">{item.title}</Badge>
                <CardTitle className="mt-3 text-2xl tracking-tight">{item.title}</CardTitle>
                <CardDescription>{item.text}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </section>

        <section className="mt-8 grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
          <Card className="border-border/60 bg-card/80 shadow-sm">
            <CardHeader>
              <Badge variant="secondary">API 能力</Badge>
              <CardTitle className="mt-3 text-2xl tracking-tight">外部系统会接入哪些内容</CardTitle>
              <CardDescription>API 层应当稳定、明确，并与前台工作流形成清晰承接。</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="grid gap-3 text-sm leading-6 text-muted-foreground">
                {apiCapabilities.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/80 shadow-sm">
            <CardHeader>
              <Badge variant="outline">访问控制</Badge>
              <CardTitle className="mt-3 text-2xl tracking-tight">接入时必须遵守的边界</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="grid gap-3 text-sm leading-6 text-muted-foreground">
                {securityRules.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>

        <section className="mt-8">
          <Card className="border-border/60 bg-card/80 shadow-sm">
            <CardHeader>
              <Badge variant="secondary">产品结构</Badge>
              <CardTitle className="mt-3 text-2xl tracking-tight">Studio / Admin / API 的职责拆分</CardTitle>
              <CardDescription>这不是单纯的产品说明，而是后续持续开发与接入时要遵守的结构规则。</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-border/60 bg-muted/40 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Studio</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">负责发起生成与任务配置，是用户进入生产流程的前台工作区。</p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-muted/40 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Admin</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">负责后台运营、全局配置以及需要高权限的内容与订单管理。</p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-muted/40 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">API</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">负责稳定接口协议，不让前台页面与后台逻辑直接耦合在一起。</p>
              </div>
            </CardContent>
          </Card>
        </section>
      </section>
    </SiteShell>
  )
}
