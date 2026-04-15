'use client'

import { useState } from 'react'

import { Button } from '@/components/ui/button'

type ManageSubscriptionButtonProps = {
  label?: string
  variant?: 'default' | 'secondary' | 'outline' | 'ghost'
}

export function ManageSubscriptionButton({
  label = '管理订阅',
  variant = 'outline',
}: ManageSubscriptionButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const openPortal = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/billing/subscriptions/portal', {
        method: 'POST',
        credentials: 'include',
      })
      const json = await response.json()

      if (!response.ok) {
        throw new Error(json.message || '打开订阅管理失败')
      }

      if (json.portalUrl && typeof window !== 'undefined') {
        window.location.assign(json.portalUrl)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '打开订阅管理失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button className="w-full" disabled={loading} onClick={openPortal} type="button" variant={variant}>
        {loading ? '正在打开…' : label}
      </Button>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  )
}
