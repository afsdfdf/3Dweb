'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { apiFetch } from '@/app/(frontend)/_lib/apiFetch'
import { OrangeMediumActionButton } from '@/components/ui-lab/action-buttons'

type CreditTopupButtonProps = {
  disabled?: boolean
  productId: number
}

export function CreditTopupButton({ disabled = false, productId }: CreditTopupButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const onPurchase = async () => {
    if (disabled) return

    setLoading(true)
    setError('')

    try {
      const response = await apiFetch('/api/billing/credits/checkout', {
        body: JSON.stringify({ productId }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })
      const json = await response.json()

      if (!response.ok) {
        throw new Error(json.message || 'Failed to create credit checkout.')
      }

      if (json.checkoutUrl && typeof window !== 'undefined') {
        window.location.assign(json.checkoutUrl)
        return
      }

      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create credit checkout.')
    } finally {
      setLoading(false)
    }
  }

  const label = disabled ? 'Unavailable' : loading ? 'Redirecting' : 'Buy'

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex h-[58px] w-full items-center justify-center">
        <div className="relative h-[36.54px] w-[95.21px]">
          <OrangeMediumActionButton disabled={disabled || loading} label={label} onClick={onPurchase} type="button" />
        </div>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  )
}
