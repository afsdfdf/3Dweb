'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

import { useLocale } from './LocaleProvider'

export function ResetPasswordForm({ initialToken }: { initialToken?: string }) {
  const locale = useLocale()
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
        throw new Error(locale === 'zh' ? '密码至少需要 8 位。' : 'Password must be at least 8 characters.')
      }

      if (password !== confirmPassword) {
        throw new Error(locale === 'zh' ? '两次输入的密码不一致。' : 'Passwords do not match.')
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
        throw new Error(json.message || (locale === 'zh' ? '重置密码失败' : 'Failed to reset password'))
      }

      setSuccess(locale === 'zh' ? '密码已重置成功，正在跳转登录页…' : 'Password reset complete. Redirecting to login...')
      setTimeout(() => {
        router.push('/login')
        router.refresh()
      }, 1200)
    } catch (err) {
      setError(err instanceof Error ? err.message : locale === 'zh' ? '重置密码失败' : 'Failed to reset password')
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
          <CardTitle className="text-2xl tracking-tight">{locale === 'zh' ? '设置新密码' : 'Set a new password'}</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="token">{locale === 'zh' ? '重置 Token' : 'Reset token'}</FieldLabel>
              <Input
                defaultValue={initialToken}
                id="token"
                name="token"
                placeholder={locale === 'zh' ? '请输入邮件中的 token' : 'Paste the token from your email'}
                required
                type="text"
              />
              <FieldDescription>
                {locale === 'zh' ? '如果你是从邮件链接进入，token 通常会自动带入。' : 'If you opened the email link directly, the token is usually prefilled.'}
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="password">{locale === 'zh' ? '新密码' : 'New password'}</FieldLabel>
              <Input
                id="password"
                name="password"
                placeholder={locale === 'zh' ? '请输入新密码' : 'Enter a new password'}
                required
                type="password"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="confirmPassword">{locale === 'zh' ? '确认新密码' : 'Confirm password'}</FieldLabel>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                placeholder={locale === 'zh' ? '请再次输入新密码' : 'Enter the password again'}
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
            {loading ? (locale === 'zh' ? '提交中…' : 'Submitting...') : locale === 'zh' ? '重置密码' : 'Reset password'}
          </Button>
          <Link className="text-sm text-muted-foreground underline-offset-4 hover:underline" href="/login">
            {locale === 'zh' ? '返回登录' : 'Back to login'}
          </Link>
        </CardFooter>
      </Card>
    </form>
  )
}
