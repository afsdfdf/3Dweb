'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { Button } from '@/components/ui/button'

type SubscribePlanButtonProps = {
  planKey: 'starter' | 'pro' | 'studio'
}

export function SubscribePlanButton({ planKey }: SubscribePlanButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const onSubscribe = async () => {
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
        throw new Error(json.message || '创建订阅结算失败')
      }

      if (json.checkoutUrl && typeof window !== 'undefined') {
        window.location.assign(json.checkoutUrl)
        return
      }

      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建订阅结算失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button className="w-full" disabled={loading} onClick={onSubscribe} type="button">
        {loading ? '正在跳转结算…' : '立即订阅'}
      </Button>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  )
}
