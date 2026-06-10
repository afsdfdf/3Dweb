'use client'

import { useState } from 'react'

import { apiFetch } from '@/app/(frontend)/_lib/apiFetch'
import { Button } from '@/components/ui/button'

type ManageSubscriptionButtonProps = {
  label?: string
  variant?: 'default' | 'secondary' | 'outline' | 'ghost'
}

export function ManageSubscriptionButton({ label, variant = 'outline' }: ManageSubscriptionButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const openPortal = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await apiFetch('/api/billing/subscriptions/portal', {
        method: 'POST',
        
      })
      const json = await response.json()

      if (!response.ok) {
        throw new Error(json.message || 'Failed to open subscription management.')
      }

      if (json.portalUrl && typeof window !== 'undefined') {
        window.location.assign(json.portalUrl)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open subscription management.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button className="w-full" disabled={loading} onClick={openPortal} type="button" variant={variant}>
        {loading ? 'Opening...' : label || 'Manage subscription'}
      </Button>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  )
}
