import { redirect } from 'next/navigation'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import { AuthForm } from '../_components/AuthForm'
import { SiteShell } from '../_components/SiteShell'
import { getCurrentUser } from '../_lib/session'

export default async function RegisterPage() {
  const user = await getCurrentUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <SiteShell currentPath="/register">
      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-6 sm:py-14 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <div className="flex flex-col justify-center gap-6">
          <div className="max-w-2xl">
            <Badge variant="secondary">注册</Badge>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">创建账号后直接开始生成</h1>
            <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
              注册成功后即可进入 Studio，并在工作台中统一管理任务、模型资产、订单与积分账户。
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="border-border/60 bg-card/80 shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl tracking-tight">完整产品链路</CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-6 text-muted-foreground">不是单纯展示页，而是从生成到交付、再到打印履约的完整产品体验。</CardContent>
            </Card>
            <Card className="border-border/60 bg-card/80 shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl tracking-tight">清晰入口分层</CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-6 text-muted-foreground">产品站、Studio、Dashboard、Admin 与 API 保持清晰分层，不互相混杂。</CardContent>
            </Card>
          </div>
        </div>

        <div className="flex items-center justify-center xl:justify-end">
          <AuthForm mode="register" />
        </div>
      </section>
    </SiteShell>
  )
}
