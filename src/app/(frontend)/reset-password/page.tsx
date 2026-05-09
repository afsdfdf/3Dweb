import { redirect } from 'next/navigation'

import { ResetPasswordForm } from '../_components/ResetPasswordForm'
import { SiteShell } from '../_components/SiteShell'
import { getCurrentUser } from '../_lib/session'
import styles from './page.module.css'

function ResetPasswordStage({ initialToken }: { initialToken: string }) {
  return (
    <section className={styles.resetPage}>
      <div className={styles.authSlot}>
        <ResetPasswordForm initialToken={initialToken} />
      </div>
    </section>
  )
}

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const [user, query] = await Promise.all([getCurrentUser(), searchParams])

  if (user) {
    redirect('/account')
  }

  const initialToken = query.token || ''

  return (
    <SiteShell
      currentPath="/reset-password"
      mobileChildren={<ResetPasswordStage initialToken={initialToken} />}
      showFooter={false}
    >
      <ResetPasswordStage initialToken={initialToken} />
    </SiteShell>
  )
}
