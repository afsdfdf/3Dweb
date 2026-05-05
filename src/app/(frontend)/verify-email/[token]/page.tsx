import { Badge } from '@/components/ui/badge'
import { VerifyEmailClient } from '../../_components/VerifyEmailClient'
import { SiteShell } from '../../_components/SiteShell'
import { getCurrentUser } from '../../_lib/session'

export default async function VerifyEmailPage({ params }: { params: Promise<{ token: string }> }) {
  const [user, { token }] = await Promise.all([getCurrentUser(), params])

  return (
    <SiteShell currentPath="/verify-email" user={user}>
      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="mx-auto max-w-2xl">
          <Badge variant="secondary">Email Verification</Badge>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">Verifying your email</h1>
          <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
            The system will verify the email token automatically and show the result. After verification succeeds, you can sign in to Thorns Tavern.
          </p>
        </div>

        <div className="mt-8 flex justify-center">
          <VerifyEmailClient token={token} />
        </div>
      </section>
    </SiteShell>
  )
}
