'use client'

import Link from 'next/link'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

import { useLocale } from './LocaleProvider'

export function ForgotPasswordForm() {
  const locale = useLocale()
  const privacyMessage =
    locale === 'zh' ? '如果该邮箱存在，系统已发送重置邮件。' : 'If the email exists, a reset email has been sent.'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const submit = async (formData: FormData) => {
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      await fetch('/api/users/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.get('email'),
        }),
      })

      setSuccess(privacyMessage)
    } catch {
      setError('')
      setSuccess(privacyMessage)
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
          <CardTitle className="text-2xl tracking-tight">{locale === 'zh' ? '发送重置邮件' : 'Send reset email'}</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="email">{locale === 'zh' ? '邮箱' : 'Email'}</FieldLabel>
              <Input
                id="email"
                name="email"
                placeholder={locale === 'zh' ? '请输入注册邮箱' : 'Enter your email'}
                required
                type="email"
              />
            </Field>
            <FieldError aria-live="polite">{error}</FieldError>
            {success ? <p className="text-sm text-emerald-600">{success}</p> : null}
          </FieldGroup>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button className="w-full" disabled={loading} type="submit">
            {loading ? (locale === 'zh' ? '发送中…' : 'Sending...') : locale === 'zh' ? '发送重置邮件' : 'Send reset email'}
          </Button>
          <Link className="text-sm text-muted-foreground underline-offset-4 hover:underline" href="/login">
            {locale === 'zh' ? '返回登录' : 'Back to login'}
          </Link>
        </CardFooter>
      </Card>
    </form>
  )
}
