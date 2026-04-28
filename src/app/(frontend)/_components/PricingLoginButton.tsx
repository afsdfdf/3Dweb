'use client'

import { useRouter } from 'next/navigation'

import { OrangeMediumActionButton } from '@/components/ui-lab/action-buttons'

export function PricingLoginButton() {
  const router = useRouter()

  return (
    <div className="flex h-[58px] w-full items-center justify-center">
      <div className="relative h-[36.54px] w-[95.21px]">
        <OrangeMediumActionButton label="Sign In" onClick={() => router.push('/login')} type="button" />
      </div>
    </div>
  )
}
