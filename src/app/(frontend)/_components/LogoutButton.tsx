'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function LogoutButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  return (
    <button
      className="ghost-button"
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
      type="button"
    >
      {loading ? '退出中...' : '退出登录'}
    </button>
  )
}
