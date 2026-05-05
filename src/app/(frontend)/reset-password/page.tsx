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
    redirect('/account')
  }

  return (
    <SiteShell currentPath="/reset-password">
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="mx-auto max-w-2xl">
          <Badge variant="secondary">Reset Password</Badge>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">Set a new sign-in password</h1>
          <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
            Enter the reset token from your email and choose a new password. After the reset succeeds, you can sign in again.
          </p>
        </div>

        <div className="mt-8 flex justify-center">
          <ResetPasswordForm initialToken={query.token || ''} />
        </div>
      </section>
    </SiteShell>
  )
}
