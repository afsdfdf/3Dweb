import { redirect } from 'next/navigation'

import { AuthFlowCard } from '@/components/auth/AuthFlowCard'
import { AuthPageLayout } from '@/components/auth/AuthPageLayout'

import { SiteShell } from '../_components/SiteShell'
import { getCurrentUser } from '../_lib/session'

export default async function RegisterPage() {
  const user = await getCurrentUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <SiteShell currentPath="/register" showAuthEntry={false} showFooter={false} showLocaleSwitcher={false} showUtilityNav={false}>
      <AuthPageLayout
        badge="Create Account"
        description="Open a MiniForge account to enter Studio, manage generated assets, and move from prototype to fulfillment inside one connected platform."
        highlights={[
          {
            title: 'Single product path',
            description: 'From generation to delivery, the same account keeps your tasks, assets, credits, and operational history together.',
          },
          {
            title: 'Production-ready structure',
            description: 'Website, Studio, Dashboard, Admin, and platform APIs stay aligned behind a single identity layer.',
          },
        ]}
        title="Create an account and start building immediately"
      >
        <AuthFlowCard initialMode="register" />
      </AuthPageLayout>
    </SiteShell>
  )
}
