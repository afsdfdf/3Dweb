'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export function VerifyEmailClient({ token }: { token: string }) {
  const [status, setStatus] = useState<'error' | 'loading' | 'success'>('loading')
  const [message, setMessage] = useState('Verifying your email. Please wait...')

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
          throw new Error(json.message || 'Email verification failed.')
        }

        setStatus('success')
        setMessage('Email verified. You can now sign in to Thorns Tavern.')
      } catch (error) {
        if (!active) return
        setStatus('error')
        setMessage(error instanceof Error ? error.message : 'Email verification failed.')
      }
    }

    if (token) {
      void run()
    } else {
      setStatus('error')
      setMessage('Verification token is missing.')
    }

    return () => {
      active = false
    }
  }, [token])

  const title = status === 'success' ? 'Verification complete' : status === 'error' ? 'Verification failed' : 'Verifying'

  return (
    <Card className="w-full max-w-[560px] border-border/60 bg-card/85 shadow-2xl shadow-black/5 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-2xl tracking-tight">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className={status === 'error' ? 'text-sm text-destructive' : 'text-sm text-muted-foreground'}>{message}</p>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full">
          <Link href="/login">Go to login</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
