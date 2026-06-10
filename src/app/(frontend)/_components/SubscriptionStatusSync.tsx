'use client'

import { apiFetch } from '@/app/(frontend)/_lib/apiFetch'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

type SubscriptionStatusSyncProps = {
  enabled?: boolean
  sessionId: string
}

export function SubscriptionStatusSync({ enabled = false, sessionId }: SubscriptionStatusSyncProps) {
  const router = useRouter()
  const [message, setMessage] = useState(enabled ? 'Syncing subscription status...' : '')

  useEffect(() => {
    if (!enabled || !sessionId) return

    let active = true

    const run = async () => {
      try {
        const response = await apiFetch('/api/billing/subscriptions/sync', {
          method: 'POST',
          
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ sessionId }),
        })
        const json = await response.json()

        if (!active) return

        if (!response.ok) {
          throw new Error(json.message || 'Failed to sync subscription status.')
        }

        setMessage('Subscription status synced. Refreshing page...')
        router.refresh()
      } catch (error) {
        if (!active) return
        setMessage(error instanceof Error ? error.message : 'Failed to sync subscription status. Please try again later.')
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
