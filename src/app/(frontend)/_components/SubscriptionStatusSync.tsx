'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

type SubscriptionStatusSyncProps = {
  enabled?: boolean
  sessionId: string
}

export function SubscriptionStatusSync({ enabled = false, sessionId }: SubscriptionStatusSyncProps) {
  const router = useRouter()
  const [message, setMessage] = useState(enabled ? '正在同步订阅状态…' : '')

  useEffect(() => {
    if (!enabled || !sessionId) return

    let active = true

    const run = async () => {
      try {
        const response = await fetch('/api/billing/subscriptions/sync', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ sessionId }),
        })
        const json = await response.json()

        if (!active) return

        if (!response.ok) {
          throw new Error(json.message || '订阅状态同步失败')
        }

        setMessage('订阅状态已同步，正在刷新页面…')
        router.refresh()
      } catch (error) {
        if (!active) return
        setMessage(error instanceof Error ? error.message : '订阅状态同步失败，请稍后重试。')
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
