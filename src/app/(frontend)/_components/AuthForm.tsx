'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { registrationPrivacyMessage } from '@/lib/registrationPrivacy'

import { useLocale } from './LocaleProvider'

type AuthFormProps = {
  mode: 'login' | 'register'
}

export function AuthForm({ mode }: AuthFormProps) {
  const locale = useLocale()
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState('')

  const isRegister = mode === 'register'

  const copy = {
    en: {
      create: 'Create account',
      ctaLogin: 'Log in and open Studio',
      ctaRegister: 'Create account',
      email: 'Email',
      enterEmail: 'Enter your email',
      enterName: 'Enter your name',
      enterPassword: 'Enter your password',
      forgot: 'Forgot password?',
      fullName: 'Name',
      haveAccount: 'Already have an account?',
      loading: 'Processing...',
      loginFailed: 'Login failed',
      loginTitle: 'Sign in to MiniForge',
      loginWelcome: 'Welcome back',
      needAccount: 'Need an account?',
      password: 'Password',
      phone: 'Phone',
      phoneHelp: 'Used later for print fulfillment contact.',
      phonePlaceholder: 'Used for later print contact',
      registerFailed: 'Registration failed',
      registerNotice: 'Registration complete. Please verify your email before logging in.',
      registerTitle: 'Create a MiniForge account',
      registerText: 'Create an account to enter Studio and start building tasks.',
      signIn: 'Sign in',
      unverified: 'Your email is not verified yet. Please verify it before logging in.',
      welcomeBack: 'Return to your product workflow after signing in.',
    },
    zh: {
      create: '创建账号',
      ctaLogin: '登录并进入 Studio',
      ctaRegister: '注册并进入 Studio',
      email: '邮箱',
      enterEmail: '请输入邮箱',
      enterName: '请输入你的姓名',
      enterPassword: '请输入密码',
      forgot: '忘记密码？',
      fullName: '姓名',
      haveAccount: '已经有账号？',
      loading: '处理中…',
      loginFailed: '登录失败',
      loginTitle: '登录 MiniForge',
      loginWelcome: '欢迎回来',
      needAccount: '还没有账号？',
      password: '密码',
      phone: '手机号',
      phoneHelp: '后续打印订单会使用这个联系方式。',
      phonePlaceholder: '用于后续打印联系',
      registerFailed: '注册失败',
      registerNotice: '注册成功，请先前往邮箱完成验证，然后再登录。',
      registerTitle: '注册 MiniForge 账号',
      registerText: '注册后可直接进入 Studio 并开始创建任务。',
      signIn: '去登录',
      unverified: '邮箱尚未验证，请先前往邮箱完成验证。',
      welcomeBack: '登录后可直接回到你的产品工作流。',
    },
  }[locale]

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
          const rawMessage = String(registerJson?.message || registerJson?.errors?.[0]?.message || '')
          if (rawMessage.toLowerCase().includes('exist') || rawMessage.includes('已存在') || rawMessage.includes('duplicate')) {
            throw new Error(registrationPrivacyMessage)
          }

          throw new Error(registerJson.message || copy.registerFailed)
        }

        setNotice(copy.registerNotice)
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
        const message = loginJson.errors?.[0]?.message || loginJson.message || copy.loginFailed
        if (String(message).includes('unverified') || String(message).includes('未验证')) {
          throw new Error(copy.unverified)
        }
        throw new Error(message)
      }

      router.push('/generate')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : locale === 'zh' ? '操作失败' : 'Action failed')
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
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{isRegister ? copy.create : copy.loginWelcome}</p>
          <CardTitle className="text-2xl tracking-tight">{isRegister ? copy.registerTitle : copy.loginTitle}</CardTitle>
          <CardDescription>{isRegister ? copy.registerText : copy.welcomeBack}</CardDescription>
        </CardHeader>

        <CardContent>
          <FieldGroup>
            {isRegister ? (
              <div className="grid gap-4 md:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="fullName">{copy.fullName}</FieldLabel>
                  <Input id="fullName" name="fullName" placeholder={copy.enterName} type="text" />
                </Field>

                <Field>
                  <FieldLabel htmlFor="phone">{copy.phone}</FieldLabel>
                  <Input id="phone" name="phone" placeholder={copy.phonePlaceholder} type="text" />
                  <FieldDescription>{copy.phoneHelp}</FieldDescription>
                </Field>
              </div>
            ) : null}

            <Field>
              <FieldLabel htmlFor="email">{copy.email}</FieldLabel>
              <Input id="email" name="email" placeholder={copy.enterEmail} type="email" />
            </Field>

            <Field>
              <FieldLabel htmlFor="password">{copy.password}</FieldLabel>
              <Input id="password" name="password" placeholder={copy.enterPassword} type="password" />
            </Field>

            <FieldError aria-live="polite">{error}</FieldError>
            {notice ? <p className="text-sm text-emerald-600">{notice}</p> : null}
          </FieldGroup>
        </CardContent>

        <CardFooter className="flex flex-col items-stretch gap-4">
          <Button className="w-full" disabled={loading} type="submit">
            {loading ? copy.loading : isRegister ? copy.ctaRegister : copy.ctaLogin}
          </Button>

          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <span>{isRegister ? copy.haveAccount : copy.needAccount}</span>
            <Link className="font-medium text-foreground underline-offset-4 hover:underline" href={isRegister ? '/login' : '/register'}>
              {isRegister ? copy.signIn : copy.create}
            </Link>
          </div>
          {!isRegister ? (
            <div className="text-center text-sm">
              <Link className="font-medium text-foreground underline-offset-4 hover:underline" href="/forgot-password">
                {copy.forgot}
              </Link>
            </div>
          ) : null}
        </CardFooter>
      </Card>
    </form>
  )
}
