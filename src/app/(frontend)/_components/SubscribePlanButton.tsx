'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { Button } from '@/components/ui/button'

import { useLocale } from './LocaleProvider'

type SubscribePlanButtonProps = {
  disabled?: boolean
  planKey: 'starter' | 'pro' | 'studio'
}

export function SubscribePlanButton({ disabled = false, planKey }: SubscribePlanButtonProps) {
  const locale = useLocale()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const onSubscribe = async () => {
    if (disabled) return

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/billing/subscriptions/checkout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planKey }),
      })

      const json = await response.json()

      if (!response.ok) {
        throw new Error(json.message || (locale === 'zh' ? '创建订阅结算失败' : 'Failed to create subscription checkout'))
      }

      if (json.checkoutUrl && typeof window !== 'undefined') {
        window.location.assign(json.checkoutUrl)
        return
      }

      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : locale === 'zh' ? '创建订阅结算失败' : 'Failed to create subscription checkout')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button className="w-full" disabled={disabled || loading} onClick={onSubscribe} type="button">
        {disabled ? (locale === 'zh' ? '暂未启用' : 'Unavailable') : loading ? (locale === 'zh' ? '正在跳转结算...' : 'Redirecting to checkout...') : locale === 'zh' ? '立即订阅' : 'Subscribe now'}
      </Button>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  )
}
