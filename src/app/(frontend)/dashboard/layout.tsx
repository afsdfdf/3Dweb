import type { ReactNode } from 'react'

import { SiteShell } from '../_components/SiteShell'
import { requireUser } from '../_lib/session'

export default async function DashboardRootLayout({ children }: { children: ReactNode }) {
  const user = await requireUser()

  return (
    <SiteShell currentPath="/dashboard" user={user}>
      {children}
    </SiteShell>
  )
}
