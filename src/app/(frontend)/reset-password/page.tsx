import { redirect } from 'next/navigation'

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
    <SiteShell currentPath="/reset-password" showFooter={false}>
      <section className="flex h-[960px] items-center justify-center px-4">
        <ResetPasswordForm initialToken={query.token || ''} />
      </section>
    </SiteShell>
  )
}
