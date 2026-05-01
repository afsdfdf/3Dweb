'use client'

import { useAuthModal } from '@/components/auth/AuthModalProvider'
import { OrangeMediumActionButton } from '@/components/ui-lab/action-buttons'

export function PricingLoginButton() {
  const { openAuthModal } = useAuthModal()

  return (
    <div className="flex h-[58px] w-full items-center justify-center">
      <div className="relative h-[36.54px] w-[95.21px]">
        <OrangeMediumActionButton label="Sign In" onClick={() => openAuthModal('login')} type="button" />
      </div>
    </div>
  )
}
