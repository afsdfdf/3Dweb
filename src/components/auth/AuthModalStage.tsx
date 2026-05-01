'use client'

import type { CSSProperties, ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

import { AuthFlowCard } from './AuthFlowCard'
import { useAuthModal } from './AuthModalProvider'
import styles from './AuthModalStage.module.css'

export function AuthModalStage({
  children,
  fitViewport = false,
  overlayHeight,
  topOffset = 0,
}: {
  children: ReactNode
  fitViewport?: boolean
  overlayHeight?: string
  topOffset?: number
}) {
  const { closeAuthModal, isAuthModalOpen, mode, redirectTo } = useAuthModal()
  const router = useRouter()
  const stageRef = useRef<HTMLDivElement>(null)
  const [measuredOverlayHeight, setMeasuredOverlayHeight] = useState<string | undefined>(undefined)

  useEffect(() => {
    if (!isAuthModalOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeAuthModal()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [closeAuthModal, isAuthModalOpen])

  useEffect(() => {
    if (!fitViewport) return

    const updateOverlayHeight = () => {
      const stage = stageRef.current
      if (!stage) return

      const rect = stage.getBoundingClientRect()
      const scale = rect.width > 0 && stage.offsetWidth > 0 ? rect.width / stage.offsetWidth : 1
      const visibleHeight = window.innerHeight / Math.max(scale, 0.01)
      setMeasuredOverlayHeight(`${Math.max(360, visibleHeight - topOffset)}px`)
    }

    updateOverlayHeight()
    window.addEventListener('resize', updateOverlayHeight)
    return () => window.removeEventListener('resize', updateOverlayHeight)
  }, [fitViewport, topOffset])

  const resolvedOverlayHeight = measuredOverlayHeight ?? overlayHeight

  return (
    <div
      ref={stageRef}
      className={styles.stage}
      style={
        {
          '--auth-modal-overlay-height': resolvedOverlayHeight,
          '--auth-modal-top-offset': `${topOffset}px`,
        } as CSSProperties
      }
    >
      <div className={[styles.content, isAuthModalOpen ? styles.contentMuted : ''].join(' ')}>{children}</div>

      {isAuthModalOpen ? (
        <div
          aria-modal="true"
          className={[styles.overlay, resolvedOverlayHeight ? styles.overlayConstrained : ''].join(' ')}
          role="dialog"
        >
          <div className={styles.modalShell}>
            <button aria-label="Close login" className={styles.closeButton} onClick={closeAuthModal} type="button">
              ×
            </button>
            <AuthFlowCard
              initialMode={mode}
              onSuccess={() => {
                closeAuthModal()
                if (redirectTo) {
                  router.push(redirectTo)
                } else {
                  router.refresh()
                }
              }}
              redirectTo={redirectTo ?? undefined}
            />
          </div>
        </div>
      ) : null}
    </div>
  )
}
