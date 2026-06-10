'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { apiFetch } from '@/app/(frontend)/_lib/apiFetch'
import { OrangeMediumActionButton } from '@/components/ui-lab/action-buttons'

type SubscribePlanButtonProps = {
  disabled?: boolean
  planKey: 'starter' | 'pro' | 'studio'
}

export function SubscribePlanButton({ disabled = false, planKey }: SubscribePlanButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const onSubscribe = async () => {
    if (disabled) return

    setLoading(true)
    setError('')

    try {
      const response = await apiFetch('/api/billing/subscriptions/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planKey }),
      })

      const json = await response.json()

      if (!response.ok) {
        throw new Error(json.message || 'Failed to create subscription checkout')
      }

      if (json.checkoutUrl && typeof window !== 'undefined') {
        window.location.assign(json.checkoutUrl)
        return
      }

      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create subscription checkout')
    } finally {
      setLoading(false)
    }
  }

  const label = disabled ? 'Unavailable' : loading ? 'Redirecting' : 'Subscribe'

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex h-[58px] w-full items-center justify-center">
        <div className="relative h-[36.54px] w-[95.21px]">
          <OrangeMediumActionButton disabled={disabled || loading} label={label} onClick={onSubscribe} type="button" />
        </div>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  )
}
