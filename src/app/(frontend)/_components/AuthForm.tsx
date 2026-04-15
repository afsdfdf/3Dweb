'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

type AuthFormProps = {
  mode: 'login' | 'register'
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState('')

  const isRegister = mode === 'register'

  const submit = async (formData: FormData) => {
    setLoading(true)
    setError('')
    setNotice('')

    try {
      if (isRegister) {
        const registerResp = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formData.get('email'),
            fullName: formData.get('fullName'),
            password: formData.get('password'),
            phone: formData.get('phone'),
            role: 'customer',
          }),
        })

        const registerJson = await registerResp.json()
        if (!registerResp.ok) {
          throw new Error(registerJson.message || '注册失败')
        }

        setNotice('注册成功，请先前往邮箱完成验证，然后再登录。')
        return
      }

      const loginResp = await fetch('/api/users/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.get('email'),
          password: formData.get('password'),
        }),
      })

      const loginJson = await loginResp.json()

      if (!loginResp.ok) {
        const message = loginJson.errors?.[0]?.message || loginJson.message || '登录失败'
        if (String(message).includes('unverified') || String(message).includes('未验证')) {
          throw new Error('邮箱尚未验证，请先前往邮箱完成验证。')
        }
        throw new Error(message)
      }

      router.push('/generate')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败')
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
        <CardHeader className="gap-3">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{isRegister ? '创建账号' : '欢迎回来'}</p>
          <CardTitle className="text-2xl tracking-tight">{isRegister ? '注册 MiniForge 账号' : '登录 MiniForge'}</CardTitle>
          <CardDescription>{isRegister ? '注册后可直接进入 Studio 并开始创建任务。' : '登录后可直接回到你的产品工作流。'}</CardDescription>
        </CardHeader>

        <CardContent>
          <FieldGroup>
            {isRegister ? (
              <div className="grid gap-4 md:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="fullName">姓名</FieldLabel>
                  <Input id="fullName" name="fullName" placeholder="请输入你的姓名" type="text" />
                </Field>

                <Field>
                  <FieldLabel htmlFor="phone">手机号</FieldLabel>
                  <Input id="phone" name="phone" placeholder="用于后续打印联系" type="text" />
                  <FieldDescription>后续打印订单会使用这个联系方式。</FieldDescription>
                </Field>
              </div>
            ) : null}

            <Field>
              <FieldLabel htmlFor="email">邮箱</FieldLabel>
              <Input id="email" name="email" placeholder="请输入邮箱" type="email" />
            </Field>

            <Field>
              <FieldLabel htmlFor="password">密码</FieldLabel>
              <Input id="password" name="password" placeholder="请输入密码" type="password" />
            </Field>

            <FieldError aria-live="polite">{error}</FieldError>
            {notice ? <p className="text-sm text-emerald-600">{notice}</p> : null}
          </FieldGroup>
        </CardContent>

        <CardFooter className="flex flex-col items-stretch gap-4">
          <Button className="w-full" disabled={loading} type="submit">
            {loading ? '处理中…' : isRegister ? '注册并进入 Studio' : '登录并进入 Studio'}
          </Button>

          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <span>{isRegister ? '已经有账号？' : '还没有账号？'}</span>
            <Link className="font-medium text-foreground underline-offset-4 hover:underline" href={isRegister ? '/login' : '/register'}>
              {isRegister ? '去登录' : '立即注册'}
            </Link>
          </div>
          {!isRegister ? (
            <div className="text-center text-sm">
              <Link className="font-medium text-foreground underline-offset-4 hover:underline" href="/forgot-password">
                忘记密码？
              </Link>
            </div>
          ) : null}
        </CardFooter>
      </Card>
    </form>
  )
}
