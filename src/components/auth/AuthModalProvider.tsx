'use client'

import type { ReactNode } from 'react'
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'

import { getSafeInternalRedirect, isSafeInternalRedirect } from '@/lib/safeRedirect'

type AuthModalMode = 'forgot' | 'login' | 'register'

type AuthModalContextValue = {
  closeAuthModal: () => void
  isAuthModalOpen: boolean
  mode: AuthModalMode
  openAuthModal: (mode?: AuthModalMode, options?: { redirectTo?: null | string }) => void
  redirectTo: null | string
}

const AuthModalContext = createContext<AuthModalContextValue | null>(null)
let didWarnMissingAuthModalProvider = false

function openAuthCompatibilityRoute(mode: AuthModalMode = 'login', redirectTo?: null | string) {
  if (typeof window === 'undefined') return

  const pathname = mode === 'register' ? '/register' : mode === 'forgot' ? '/forgot-password' : '/login'
  const url = new URL(pathname, window.location.origin)
  const safeRedirect = getSafeInternalRedirect(
    redirectTo,
    `${window.location.pathname}${window.location.search}`,
  )
  if (safeRedirect && safeRedirect !== pathname) {
    url.searchParams.set('redirect', safeRedirect)
  }

  window.location.href = `${url.pathname}${url.search}`
}

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const lastLocationKeyRef = useRef<null | string>(null)
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
    if (!pathname) return

    const search = window.location.search
    const locationKey = `${pathname}${search}`
    const previousLocationKey = lastLocationKeyRef.current
    lastLocationKeyRef.current = locationKey

    const params = new URLSearchParams(search)
    const authMode = params.get('auth')
    const animationFrame = window.requestAnimationFrame(() => {
      if (authMode === 'login' || authMode === 'register' || authMode === 'forgot') {
        const nextRedirect = params.get('redirect')
        openAuthModal(authMode, {
          redirectTo: isSafeInternalRedirect(nextRedirect) ? nextRedirect : null,
        })
        return
      }

      if (previousLocationKey !== null && previousLocationKey !== locationKey) {
        closeAuthModal()
      }
    })

    return () => window.cancelAnimationFrame(animationFrame)
  }, [closeAuthModal, openAuthModal, pathname])

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
  useEffect(() => {
    if (context || process.env.NODE_ENV === 'production' || didWarnMissingAuthModalProvider) return

    didWarnMissingAuthModalProvider = true
    console.warn('useAuthModal was used outside AuthModalProvider. Falling back to auth routes.')
  }, [context])

  if (!context) {
    return {
      closeAuthModal: () => {},
      isAuthModalOpen: false,
      mode: 'login',
      openAuthModal: (mode = 'login', options) => openAuthCompatibilityRoute(mode, options?.redirectTo),
      redirectTo: null,
    } satisfies AuthModalContextValue
  }

  return context
}
