import { redirect } from 'next/navigation'

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
      <section className="auth-minimal-shell">
        <div className="auth-minimal-copy">
          <p className="eyebrow">Register</p>
          <h1>创建账号后开始生成。</h1>
          <p className="section-lead">注册后直接进入 Studio，后续在工作台继续管理模型与订单。</p>
        </div>

        <section className="auth-shell auth-shell-minimal">
          <AuthForm mode="register" />
        </section>
      </section>
    </SiteShell>
  )
}
