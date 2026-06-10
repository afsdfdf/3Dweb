'use client'

import { apiFetch } from '@/app/(frontend)/_lib/apiFetch'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

type OrderPaymentStatusSyncProps = {
  enabled?: boolean
  orderId: number
}

export function OrderPaymentStatusSync({ enabled = false, orderId }: OrderPaymentStatusSyncProps) {
  const router = useRouter()
  const [message, setMessage] = useState(enabled ? 'Confirming Stripe payment result...' : '')

  useEffect(() => {
    if (!enabled) return

    let active = true

    const run = async () => {
      try {
        const response = await apiFetch(`/api/commerce/print-orders/${orderId}/sync`, {
          
          method: 'POST',
        })
        const json = await response.json()

        if (!active) return

        if (!response.ok) {
          throw new Error(json.message || 'Failed to sync payment status.')
        }

        setMessage('Payment status synced. Refreshing order data...')
        router.refresh()
      } catch (error) {
        if (!active) return
        setMessage(error instanceof Error ? error.message : 'Failed to sync payment status. Please try again later.')
      }
    }

    void run()

    return () => {
      active = false
    }
  }, [enabled, orderId, router])

  if (!enabled || !message) {
    return null
  }

  return (
    <p aria-live="polite" className="text-sm text-muted-foreground">
      {message}
    </p>
  )
}
