import { notFound } from 'next/navigation'

import { AuthFlowCard } from '@/components/auth/AuthFlowCard'
import { SiteShell } from '../_components/SiteShell'

export default async function TestAuthPreviewPage() {
  if (process.env.NODE_ENV === 'production') {
    notFound()
  }

  return (
    <SiteShell currentPath="/login">
      <section className="min-h-[calc(100vh-76px)] bg-[radial-gradient(circle_at_14%_28%,rgba(86,98,112,0.24),transparent_30%),radial-gradient(circle_at_56%_12%,rgba(98,70,36,0.18),transparent_26%),radial-gradient(circle_at_50%_100%,rgba(255,255,255,0.06),transparent_34%),linear-gradient(180deg,#17181b_0%,#212327_55%,#31343a_100%)] px-8 py-8">
        <div className="mx-auto flex min-h-[calc(100vh-140px)] max-w-[1200px] items-center justify-center">
          <AuthFlowCard />
        </div>
      </section>
    </SiteShell>
  )
}
