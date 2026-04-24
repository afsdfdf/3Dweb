import { redirect } from 'next/navigation'

import { AuthFlowCard } from '@/components/auth/AuthFlowCard'
import { AuthPageLayout } from '@/components/auth/AuthPageLayout'

import { SiteShell } from '../_components/SiteShell'
import { getCurrentUser } from '../_lib/session'

const safeRedirect = (value?: null | string) => {
  if (!value || typeof value !== 'string') return '/dashboard/tasks'
  return value.startsWith('/') ? value : '/dashboard/tasks'
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>
}) {
  const query = await searchParams
  const fallbackRedirect = safeRedirect(query.redirect)
  const user = await getCurrentUser()

  if (user) {
    redirect(fallbackRedirect)
  }

  return (
    <SiteShell currentPath="/login" showAuthEntry={false} showFooter={false} showLocaleSwitcher={false} showUtilityNav={false}>
      <AuthPageLayout
        badge="Account Access"
        description="Sign in to reopen active generation jobs, review your model library, and jump back into Studio without losing momentum."
        highlights={[
          {
            title: 'Resume active work',
            description: 'Pick up tasks, results, orders, and saved models from the same place you left them.',
          },
          {
            title: 'Return to Studio fast',
            description: 'Go straight from authentication into image-to-3D, text-to-3D, or hybrid generation flows.',
          },
        ]}
        title="Sign in and return to your production workflow"
      >
        <AuthFlowCard initialMode="login" redirectTo={fallbackRedirect} />
      </AuthPageLayout>
    </SiteShell>
  )
}
