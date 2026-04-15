import { redirect } from 'next/navigation'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import { AuthForm } from '../_components/AuthForm'
import { SiteShell } from '../_components/SiteShell'
import { getCurrentUser } from '../_lib/session'

export default async function LoginPage() {
  const user = await getCurrentUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <SiteShell currentPath="/login">
      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-6 sm:py-14 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <div className="flex flex-col justify-center gap-6">
          <div className="max-w-2xl">
            <Badge variant="secondary">登录</Badge>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">登录后继续进入工作流</h1>
            <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
              登录后可继续查看任务、模型、订单与积分，并直接回到 Studio 开始新的生成流程。
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="border-border/60 bg-card/80 shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl tracking-tight">继续当前任务</CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-6 text-muted-foreground">进入结果页、模型库与订单中心，继续处理你已经创建的资产。</CardContent>
            </Card>
            <Card className="border-border/60 bg-card/80 shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl tracking-tight">回到 Studio</CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-6 text-muted-foreground">从图生 3D、文生 3D 或图文混合模式继续发起新的生成任务。</CardContent>
            </Card>
          </div>
        </div>

        <div className="flex items-center justify-center xl:justify-end">
          <AuthForm mode="login" />
        </div>
      </section>
    </SiteShell>
  )
}
