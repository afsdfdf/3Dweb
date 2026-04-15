'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

type OrderPaymentStatusSyncProps = {
  enabled?: boolean
  orderId: number
}

export function OrderPaymentStatusSync({ enabled = false, orderId }: OrderPaymentStatusSyncProps) {
  const router = useRouter()
  const [message, setMessage] = useState(enabled ? '正在确认 Stripe 支付结果…' : '')

  useEffect(() => {
    if (!enabled) return

    let active = true

    const run = async () => {
      try {
        const response = await fetch(`/api/commerce/print-orders/${orderId}/sync`, {
          credentials: 'include',
          method: 'POST',
        })
        const json = await response.json()

        if (!active) return

        if (!response.ok) {
          throw new Error(json.message || '支付状态同步失败')
        }

        setMessage('支付状态已同步，正在刷新订单详情…')
        router.refresh()
      } catch (error) {
        if (!active) return
        setMessage(error instanceof Error ? error.message : '支付状态同步失败，请稍后重试。')
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
