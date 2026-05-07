'use client'

import { AuthFlowCard } from '@/components/auth/AuthFlowCard'

export function ResetPasswordForm({ initialToken }: { initialToken?: string }) {
  return <AuthFlowCard initialMode="reset" initialResetToken={initialToken || ''} redirectTo="/generate" />
}
