'use client'

import { useState, type ComponentProps } from 'react'

import { Button } from '@/components/ui/button'

type LogoutButtonProps = Pick<ComponentProps<typeof Button>, 'className' | 'size' | 'variant'>

export function LogoutButton({ className, size = 'sm', variant = 'outline' }: LogoutButtonProps) {
  const [loading, setLoading] = useState(false)

  return (
    <Button
      className={className}
      disabled={loading}
      onClick={async () => {
        setLoading(true)
        await fetch('/api/platform/session/logout', {
          credentials: 'include',
          method: 'POST',
        })
        window.location.assign('/login')
      }}
      size={size}
      type="button"
      variant={variant}
    >
      {loading ? 'Signing out...' : 'Sign out'}
    </Button>
  )
}
