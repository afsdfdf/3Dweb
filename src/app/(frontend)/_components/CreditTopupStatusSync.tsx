'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

type CreditTopupStatusSyncProps = {
  enabled?: boolean
  sessionId: string
}

export function CreditTopupStatusSync({ enabled = false, sessionId }: CreditTopupStatusSyncProps) {
  const router = useRouter()
  const [message, setMessage] = useState(enabled ? 'Syncing credit purchase...' : '')

  useEffect(() => {
    if (!enabled || !sessionId) return

    let active = true

    const run = async () => {
      try {
        const response = await fetch('/api/billing/credits/sync', {
          body: JSON.stringify({ sessionId }),
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'POST',
        })
        const json = await response.json()

        if (!active) return

        if (!response.ok) {
          throw new Error(json.message || 'Failed to sync credit purchase.')
        }

        setMessage('Credit purchase synced. Refreshing page...')
        router.refresh()
      } catch (error) {
        if (!active) return
        setMessage(error instanceof Error ? error.message : 'Failed to sync credit purchase. Please try again later.')
      }
    }

    void run()

    return () => {
      active = false
    }
  }, [enabled, router, sessionId])

  if (!enabled || !message) {
    return null
  }

  return <p className="text-sm text-muted-foreground">{message}</p>
}
