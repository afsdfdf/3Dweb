'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { Button } from '@/components/ui/button'

type OrderActionButtonProps = {
  orderId: number
  status: string
}

const nextLabelMap: Record<string, string> = {
  'pending-payment': '检查支付结果',
  paid: '推进到生产中',
  'in-production': '推进到已发货',
  shipped: '完成订单',
}

export function OrderActionButton({ orderId, status }: OrderActionButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!nextLabelMap[status]) {
    return null
  }

  const handleClick = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/commerce/print-orders/${orderId}/sync`, {
        method: 'POST',
        credentials: 'include',
      })
      const json = await response.json()

      if (!response.ok) {
        throw new Error(json.message || '订单同步失败')
      }

      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : '订单同步失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button disabled={loading} onClick={handleClick} type="button" variant="secondary">
        {loading ? '处理中…' : nextLabelMap[status]}
      </Button>
      {error ? (
        <p aria-live="polite" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}
