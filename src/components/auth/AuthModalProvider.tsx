'use client'

import type { ReactNode } from 'react'
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

type AuthModalMode = 'forgot' | 'login' | 'register'

type AuthModalContextValue = {
  closeAuthModal: () => void
  isAuthModalOpen: boolean
  mode: AuthModalMode
  openAuthModal: (mode?: AuthModalMode, options?: { redirectTo?: null | string }) => void
  redirectTo: null | string
}

const AuthModalContext = createContext<AuthModalContextValue | null>(null)

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [mode, setMode] = useState<AuthModalMode>('login')
  const [redirectTo, setRedirectTo] = useState<null | string>(null)

  const openAuthModal = useCallback((nextMode: AuthModalMode = 'login', options?: { redirectTo?: null | string }) => {
    setMode(nextMode)
    setRedirectTo(options?.redirectTo ?? null)
    setIsAuthModalOpen(true)
  }, [])

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false)
    setRedirectTo(null)
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const authMode = params.get('auth')
    if (authMode !== 'login' && authMode !== 'register' && authMode !== 'forgot') return

    const nextRedirect = params.get('redirect')
    openAuthModal(authMode, {
      redirectTo: nextRedirect?.startsWith('/') ? nextRedirect : null,
    })
  }, [openAuthModal])

  const value = useMemo(
    () => ({
      closeAuthModal,
      isAuthModalOpen,
      mode,
      openAuthModal,
      redirectTo,
    }),
    [closeAuthModal, isAuthModalOpen, mode, openAuthModal, redirectTo],
  )

  return <AuthModalContext.Provider value={value}>{children}</AuthModalContext.Provider>
}

export function useAuthModal() {
  const context = useContext(AuthModalContext)
  if (!context) {
    throw new Error('useAuthModal must be used within AuthModalProvider')
  }

  return context
}
