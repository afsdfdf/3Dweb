'use client'

import { useState, type ComponentProps } from 'react'

import { Button } from '@/components/ui/button'

import { useLocale } from './LocaleProvider'

type LogoutButtonProps = Pick<ComponentProps<typeof Button>, 'className' | 'size' | 'variant'>

export function LogoutButton({ className, size = 'sm', variant = 'outline' }: LogoutButtonProps) {
  const locale = useLocale()
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
      {loading ? (locale === 'zh' ? '退出中...' : 'Signing out...') : locale === 'zh' ? '退出登录' : 'Sign out'}
    </Button>
  )
}
