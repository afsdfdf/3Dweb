import { redirect } from 'next/navigation'

import { Badge } from '@/components/ui/badge'
import { ResetPasswordForm } from '../_components/ResetPasswordForm'
import { SiteShell } from '../_components/SiteShell'
import { getCurrentUser } from '../_lib/session'

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const [user, query] = await Promise.all([getCurrentUser(), searchParams])

  if (user) {
    redirect('/dashboard')
  }

  return (
    <SiteShell currentPath="/reset-password">
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="mx-auto max-w-2xl">
          <Badge variant="secondary">重置密码</Badge>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">设置新的登录密码</h1>
          <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
            请输入邮件中的重置 token，并设置一个新的密码。重置成功后将自动返回登录页。
          </p>
        </div>

        <div className="mt-8 flex justify-center">
          <ResetPasswordForm initialToken={query.token || ''} />
        </div>
      </section>
    </SiteShell>
  )
}
