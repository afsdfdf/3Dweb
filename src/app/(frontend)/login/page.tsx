import { redirect } from 'next/navigation'

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
      <section className="auth-minimal-shell">
        <div className="auth-minimal-copy">
          <p className="eyebrow">Login</p>
          <h1>登录进入工作台。</h1>
          <p className="section-lead">登录后继续任务、模型、订单和积分流程。</p>
        </div>

        <section className="auth-shell auth-shell-minimal">
          <AuthForm mode="login" />
        </section>
      </section>
    </SiteShell>
  )
}
