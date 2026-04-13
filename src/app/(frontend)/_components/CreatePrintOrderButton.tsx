'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

type CreatePrintOrderButtonProps = {
  buttonClassName?: string
  modelId: number
  sourceTaskId?: number
}

export function CreatePrintOrderButton({ buttonClassName = 'secondary-button', modelId, sourceTaskId }: CreatePrintOrderButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const createOrder = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/commerce/print-orders', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          materialOption: 'plastic',
          modelId,
          shippingAddress: '本地测试地址（后续可接入真实地址簿）',
          shippingName: '测试收件人',
          shippingPhone: '13800000000',
          sizeOption: 'standard',
          sourceTaskId,
        }),
      })

      const json = await response.json()

      if (!response.ok) {
        throw new Error(json.message || '创建打印订单失败')
      }

      if (json.checkoutUrl && typeof window !== 'undefined') {
        window.location.assign(json.checkoutUrl)
        return
      }

      const orderId = json.order?.id
      router.push(orderId ? `/dashboard/orders/${orderId}` : '/dashboard/orders')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建打印订单失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="button-column">
      <button className={buttonClassName} disabled={loading} onClick={createOrder} type="button">
        {loading ? '正在创建订单…' : '立即下单并支付'}
      </button>
      {error ? <p aria-live="polite" className="error-text">{error}</p> : null}
    </div>
  )
}
