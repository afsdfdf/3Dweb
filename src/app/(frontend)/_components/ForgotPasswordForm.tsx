'use client'

import Link from 'next/link'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

export function ForgotPasswordForm() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const submit = async (formData: FormData) => {
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/users/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.get('email'),
        }),
      })

      const json = await response.json()
      if (!response.ok) {
        throw new Error(json.message || '发送重置邮件失败')
      }

      setSuccess('如果该邮箱已注册，系统会向其发送一封密码重置邮件。')
    } catch (err) {
      setError(err instanceof Error ? err.message : '发送重置邮件失败')
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
          <CardTitle className="text-2xl tracking-tight">发送重置邮件</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="email">邮箱</FieldLabel>
              <Input id="email" name="email" placeholder="请输入注册邮箱" required type="email" />
            </Field>
            <FieldError aria-live="polite">{error}</FieldError>
            {success ? <p className="text-sm text-emerald-600">{success}</p> : null}
          </FieldGroup>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button className="w-full" disabled={loading} type="submit">
            {loading ? '发送中…' : '发送重置邮件'}
          </Button>
          <Link className="text-sm text-muted-foreground underline-offset-4 hover:underline" href="/login">
            返回登录
          </Link>
        </CardFooter>
      </Card>
    </form>
  )
}
