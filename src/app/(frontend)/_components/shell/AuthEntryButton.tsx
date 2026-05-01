'use client'

import { useAuthModal } from '@/components/auth/AuthModalProvider'

export function AuthEntryButton() {
  const { openAuthModal } = useAuthModal()

  return (
    <button
      className="relative flex h-[34px] min-w-[168px] items-center justify-center px-4 text-[12px] uppercase tracking-[0.08em] text-[#efe7da]"
      onClick={() => openAuthModal('login')}
      type="button"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-fill" src="/ui/nav/auth-pill.png" />
      <span className="relative z-10">Log in / Sign up</span>
    </button>
  )
}
