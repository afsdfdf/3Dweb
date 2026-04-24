import { redirect } from 'next/navigation'

import { AuthFlowCard } from '@/components/auth/AuthFlowCard'
import { AuthPageLayout } from '@/components/auth/AuthPageLayout'

import { SiteShell } from '../_components/SiteShell'
import { getCurrentUser } from '../_lib/session'

export default async function ForgotPasswordPage() {
  const user = await getCurrentUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <SiteShell currentPath="/forgot-password" showAuthEntry={false} showFooter={false} showLocaleSwitcher={false} showUtilityNav={false}>
      <AuthPageLayout
        badge="Password Recovery"
        description="Send a reset link to your inbox and restore access without exposing whether a specific email is registered."
        highlights={[
          {
            title: 'Privacy-safe responses',
            description: 'The reset flow keeps responses uniform so account existence is not revealed during recovery.',
          },
          {
            title: 'Fast route back',
            description: 'Open the email, set a new password, and return directly to the sign-in flow.',
          },
        ]}
        title="Reset account access from your email inbox"
      >
        <AuthFlowCard initialMode="forgot" />
      </AuthPageLayout>
    </SiteShell>
  )
}
