'use client'

import { useRouter } from 'next/navigation'
import { useState, type ComponentProps } from 'react'

import { Button } from '@/components/ui/button'

type LogoutButtonProps = Pick<ComponentProps<typeof Button>, 'className' | 'size' | 'variant'>

export function LogoutButton({ className, size = 'sm', variant = 'outline' }: LogoutButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  return (
    <Button
      className={className}
      disabled={loading}
      onClick={async () => {
        setLoading(true)
        await fetch('/api/users/logout', {
          credentials: 'include',
          method: 'POST',
        })
        router.push('/login')
        router.refresh()
      }}
      size={size}
      type="button"
      variant={variant}
    >
      {loading ? '退出中...' : '退出登录'}
    </Button>
  )
}
