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
        throw new Error('密码至少需要 8 位。')
      }

      if (password !== confirmPassword) {
        throw new Error('两次输入的密码不一致。')
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
        throw new Error(json.message || '重置密码失败')
      }

      setSuccess('密码已重置成功，正在跳转登录页…')
      setTimeout(() => {
        router.push('/login')
        router.refresh()
      }, 1200)
    } catch (err) {
      setError(err instanceof Error ? err.message : '重置密码失败')
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
          <CardTitle className="text-2xl tracking-tight">设置新密码</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="token">重置 Token</FieldLabel>
              <Input defaultValue={initialToken} id="token" name="token" placeholder="请输入邮件中的 token" required type="text" />
              <FieldDescription>如果你是从邮件链接进入，token 已自动带入。</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="password">新密码</FieldLabel>
              <Input id="password" name="password" placeholder="请输入新密码" required type="password" />
            </Field>
            <Field>
              <FieldLabel htmlFor="confirmPassword">确认新密码</FieldLabel>
              <Input id="confirmPassword" name="confirmPassword" placeholder="请再次输入新密码" required type="password" />
            </Field>
            <FieldError aria-live="polite">{error}</FieldError>
            {success ? <p className="text-sm text-emerald-600">{success}</p> : null}
          </FieldGroup>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button className="w-full" disabled={loading} type="submit">
            {loading ? '提交中…' : '重置密码'}
          </Button>
          <Link className="text-sm text-muted-foreground underline-offset-4 hover:underline" href="/login">
            返回登录
          </Link>
        </CardFooter>
      </Card>
    </form>
  )
}
