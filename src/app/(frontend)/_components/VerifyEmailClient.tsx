'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export function VerifyEmailClient({ token }: { token: string }) {
  const [status, setStatus] = useState<'error' | 'loading' | 'success'>('loading')
  const [message, setMessage] = useState('正在验证邮箱，请稍候…')

  useEffect(() => {
    let active = true

    const run = async () => {
      try {
        const response = await fetch(`/api/users/verify/${token}`, {
          method: 'POST',
        })
        const json = await response.json()

        if (!active) return

        if (!response.ok) {
          throw new Error(json.message || '邮箱验证失败')
        }

        setStatus('success')
        setMessage('邮箱验证成功，现在可以登录 MiniForge。')
      } catch (error) {
        if (!active) return
        setStatus('error')
        setMessage(error instanceof Error ? error.message : '邮箱验证失败')
      }
    }

    if (token) {
      void run()
    } else {
      setStatus('error')
      setMessage('缺少验证 token。')
    }

    return () => {
      active = false
    }
  }, [token])

  return (
    <Card className="w-full max-w-[560px] border-border/60 bg-card/85 shadow-2xl shadow-black/5 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-2xl tracking-tight">{status === 'success' ? '验证成功' : status === 'error' ? '验证失败' : '验证中'}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className={status === 'error' ? 'text-sm text-destructive' : 'text-sm text-muted-foreground'}>{message}</p>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full">
          <Link href="/login">前往登录</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
