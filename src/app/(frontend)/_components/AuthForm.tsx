'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

type AuthFormProps = {
  mode: 'login' | 'register'
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const isRegister = mode === 'register'

  const submit = async (formData: FormData) => {
    setLoading(true)
    setError('')

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
        throw new Error(loginJson.errors?.[0]?.message || loginJson.message || '登录失败')
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
      className="panel auth-card auth-card-minimal"
    >
      <div className="auth-form-head">
        <p className="eyebrow">{isRegister ? '创建账号' : '欢迎回来'}</p>
        <h2>{isRegister ? '注册 MiniForge 账号' : '登录 MiniForge'}</h2>
        <p className="soft-text">
          {isRegister ? '注册后直接进入 Studio。' : '登录后直接回到工作流。'}
        </p>
      </div>

      <div className="form-grid">
        {isRegister ? (
          <>
            <label>
              姓名
              <input name="fullName" placeholder="请输入你的姓名" type="text" />
            </label>
            <label>
              手机号
              <input name="phone" placeholder="用于后续打印联系" type="text" />
            </label>
          </>
        ) : null}

        <label className="full-width">
          邮箱
          <input name="email" placeholder="请输入邮箱" type="email" />
        </label>

        <label className="full-width">
          密码
          <input name="password" placeholder="请输入密码" type="password" />
        </label>
      </div>

      {error ? <p aria-live="polite" className="error-text">{error}</p> : null}

      <div className="button-column auth-form-actions">
        <button className="primary-button" disabled={loading} type="submit">
          {loading ? '处理中…' : isRegister ? '注册并进入 Studio' : '登录并进入 Studio'}
        </button>
      </div>

      <div className="auth-form-footer">
        <span className="muted-text">{isRegister ? '已经有账号？' : '还没有账号？'}</span>
        <Link href={isRegister ? '/login' : '/register'}>{isRegister ? '去登录' : '立即注册'}</Link>
      </div>
    </form>
  )
}
