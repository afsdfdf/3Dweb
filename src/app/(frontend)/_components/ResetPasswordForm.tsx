'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

export function ResetPasswordForm({ initialToken }: { initialToken?: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const submit = async (formData: FormData) => {
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const password = String(formData.get('password') || '')
      const confirmPassword = String(formData.get('confirmPassword') || '')

      if (!password || password.length < 8) {
        throw new Error('Password must be at least 8 characters.')
      }

      if (password !== confirmPassword) {
        throw new Error('Passwords do not match.')
      }

      const response = await fetch('/api/users/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password,
          token: formData.get('token'),
        }),
      })

      const json = await response.json()
      if (!response.ok) {
        throw new Error(json.message || 'Failed to reset password.')
      }

      setSuccess('Password reset complete. Redirecting to login...')
      setTimeout(() => {
        router.push('/login')
        router.refresh()
      }, 1200)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      action={async (formData) => {
        await submit(formData)
      }}
      className="w-full max-w-[560px]"
    >
      <Card className="border-border/60 bg-card/85 shadow-2xl shadow-black/5 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-2xl tracking-tight">Set a new password</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="token">Reset token</FieldLabel>
              <Input
                defaultValue={initialToken}
                id="token"
                name="token"
                placeholder="Paste the token from your email"
                required
                type="text"
              />
              <FieldDescription>If you opened the email link directly, the token is usually prefilled.</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="password">New password</FieldLabel>
              <Input id="password" name="password" placeholder="Enter a new password" required type="password" />
            </Field>
            <Field>
              <FieldLabel htmlFor="confirmPassword">Confirm password</FieldLabel>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                placeholder="Enter the password again"
                required
                type="password"
              />
            </Field>
            <FieldError aria-live="polite">{error}</FieldError>
            {success ? <p className="text-sm text-emerald-600">{success}</p> : null}
          </FieldGroup>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button className="w-full" disabled={loading} type="submit">
            {loading ? 'Submitting...' : 'Reset password'}
          </Button>
          <Link className="text-sm text-muted-foreground underline-offset-4 hover:underline" href="/login">
            Back to login
          </Link>
        </CardFooter>
      </Card>
    </form>
  )
}
