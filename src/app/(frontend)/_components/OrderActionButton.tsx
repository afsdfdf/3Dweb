'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { apiFetch } from '@/app/(frontend)/_lib/apiFetch'
import { Button } from '@/components/ui/button'

type OrderActionButtonProps = {
  orderId: number
  status: string
}

const nextLabelMap: Record<string, string> = {
  'pending-payment': 'Check payment status',
  paid: 'Move to production',
  'in-production': 'Mark as shipped',
  shipped: 'Complete order',
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
      const response = await apiFetch(`/api/commerce/print-orders/${orderId}/sync`, {
        method: 'POST',
        
      })
      const json = await response.json()

      if (!response.ok) {
        throw new Error(json.message || 'Order sync failed.')
      }

      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Order sync failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button disabled={loading} onClick={handleClick} type="button" variant="secondary">
        {loading ? 'Processing...' : nextLabelMap[status]}
      </Button>
      {error ? (
        <p aria-live="polite" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}
