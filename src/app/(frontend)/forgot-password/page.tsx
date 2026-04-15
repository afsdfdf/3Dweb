import { redirect } from 'next/navigation'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { ForgotPasswordForm } from '../_components/ForgotPasswordForm'
import { SiteShell } from '../_components/SiteShell'
import { getCurrentUser } from '../_lib/session'

export default async function ForgotPasswordPage() {
  const user = await getCurrentUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <SiteShell currentPath="/forgot-password">
      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-6 sm:py-14 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <div className="flex flex-col justify-center gap-6">
          <div className="max-w-2xl">
            <Badge variant="secondary">找回密码</Badge>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">通过邮箱重置你的密码</h1>
            <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
              输入注册邮箱后，系统会向该邮箱发送一封密码重置邮件。你可以通过邮件链接设置新密码。
            </p>
          </div>

          <Card className="border-border/60 bg-card/80 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl tracking-tight">流程说明</CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-6 text-muted-foreground">
              1. 输入邮箱 → 2. 查收邮件 → 3. 打开重置链接 → 4. 设置新密码 → 5. 返回登录
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center justify-center xl:justify-end">
          <ForgotPasswordForm />
        </div>
      </section>
    </SiteShell>
  )
}
