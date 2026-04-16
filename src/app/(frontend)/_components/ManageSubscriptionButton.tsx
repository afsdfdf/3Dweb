'use client'

import { useState } from 'react'

import { Button } from '@/components/ui/button'

import { useLocale } from './LocaleProvider'

type ManageSubscriptionButtonProps = {
  label?: string
  variant?: 'default' | 'secondary' | 'outline' | 'ghost'
}

export function ManageSubscriptionButton({ label, variant = 'outline' }: ManageSubscriptionButtonProps) {
  const locale = useLocale()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const resolvedLabel = label || (locale === 'zh' ? '管理订阅' : 'Manage subscription')

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
        throw new Error(json.message || (locale === 'zh' ? '打开订阅管理失败' : 'Failed to open subscription management'))
      }

      if (json.portalUrl && typeof window !== 'undefined') {
        window.location.assign(json.portalUrl)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : locale === 'zh' ? '打开订阅管理失败' : 'Failed to open subscription management')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button className="w-full" disabled={loading} onClick={openPortal} type="button" variant={variant}>
        {loading ? (locale === 'zh' ? '正在打开…' : 'Opening...') : resolvedLabel}
      </Button>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  )
}
