'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

type CreatePrintOrderButtonProps = {
  modelId: number
  sourceTaskId?: number
  variant?: 'default' | 'secondary' | 'outline' | 'ghost'
}

export function CreatePrintOrderButton({
  modelId,
  sourceTaskId,
  variant = 'secondary',
}: CreatePrintOrderButtonProps) {
  const router = useRouter()
  const [expanded, setExpanded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const createOrder = async (formData: FormData) => {
    setLoading(true)
    setError('')

    try {
      const shippingName = String(formData.get('shippingName') || '').trim()
      const shippingPhone = String(formData.get('shippingPhone') || '').trim()
      const shippingAddress = String(formData.get('shippingAddress') || '').trim()

      if (!shippingName || !shippingPhone || !shippingAddress) {
        throw new Error('Shipping name, phone, and address are required.')
      }

      const response = await fetch('/api/commerce/print-orders', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          materialOption: 'plastic',
          modelId,
          shippingAddress,
          shippingName,
          shippingPhone,
          sizeOption: 'standard',
          sourceTaskId,
        }),
      })

      const json = await response.json()

      if (!response.ok) {
        throw new Error(json.message || 'Failed to create print order.')
      }

      if (json.checkoutUrl && typeof window !== 'undefined') {
        window.location.assign(json.checkoutUrl)
        return
      }

      router.push('/account?section=orders')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create print order.')
    } finally {
      setLoading(false)
    }
  }

  if (!expanded) {
    return (
      <Button disabled={loading} onClick={() => setExpanded(true)} type="button" variant={variant}>
        Print and checkout
      </Button>
    )
  }

  return (
    <form
      action={async (formData) => {
        await createOrder(formData)
      }}
      className="grid gap-3 rounded-md border border-border/60 bg-background/70 p-3"
    >
      <Input maxLength={120} name="shippingName" placeholder="Recipient name" required />
      <Input maxLength={80} name="shippingPhone" placeholder="Phone number" required />
      <Textarea maxLength={500} name="shippingAddress" placeholder="Shipping address" required rows={3} />
      {error ? (
        <p aria-live="polite" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button disabled={loading} type="submit" variant={variant}>
          {loading ? 'Creating order...' : 'Create order and pay'}
        </Button>
        <Button disabled={loading} onClick={() => setExpanded(false)} type="button" variant="ghost">
          Cancel
        </Button>
      </div>
    </form>
  )
}
