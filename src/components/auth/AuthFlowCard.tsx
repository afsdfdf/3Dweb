'use client'

import type { FormEvent } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'

import { FrameButton } from '@/components/ui/frame-button'
import { registrationPrivacyMessage } from '@/lib/registrationPrivacy'

import { AuthCardShell } from './AuthCardShell'
import styles from './auth-runtime.module.css'

type AuthMode = 'forgot' | 'forgot-success' | 'login' | 'register'

type AuthFlowCardProps = {
  initialMode?: AuthMode
  redirectTo?: string
}

const safeRedirect = (value?: null | string) => {
  if (!value || typeof value !== 'string') return '/generate'
  return value.startsWith('/') ? value : '/generate'
}

export function AuthFlowCard({ initialMode = 'login', redirectTo }: AuthFlowCardProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode)
  const [email, setEmail] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [message, setMessage] = useState('')
  const [messageTone, setMessageTone] = useState<'error' | 'success' | null>(null)
  const [loading, setLoading] = useState(false)

  const resolvedRedirect = safeRedirect(redirectTo)
  const isLogin = mode === 'login'
  const isRegister = mode === 'register'
  const isForgot = mode === 'forgot'
  const isForgotSuccess = mode === 'forgot-success'

  const waitForSession = async () => {
    for (let attempt = 0; attempt < 8; attempt += 1) {
      try {
        const response = await fetch('/api/account/auth/me', {
          credentials: 'include',
          headers: { Accept: 'application/json' },
          method: 'GET',
        })
        const json = await response.json().catch(() => null)
        if (response.ok && json?.authenticated && json?.user) return true
      } catch {
        // Ignore session propagation race
      }

      await new Promise((resolve) => setTimeout(resolve, 250))
    }

    return false
  }

  const resetTransientState = () => {
    setMessage('')
    setMessageTone(null)
    setLoading(false)
  }

  const handleSendCode = () => {
    setMessage('Verification is completed by email after sign up in the current flow.')
    setMessageTone('success')
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setMessage('')
    setMessageTone(null)

    try {
      if (isRegister) {
        if (!verificationCode.trim()) {
          throw new Error('Please enter the verification code.')
        }

        if (password !== confirmPassword) {
          throw new Error('Passwords do not match.')
        }

        if (!agreed) {
          throw new Error('I have read and agreed to the Terms of Use and Privacy Policy.')
        }

        const registerResp = await fetch('/api/account/auth/register', {
          body: JSON.stringify({
            email,
            password,
          }),
          headers: { 'Content-Type': 'application/json' },
          method: 'POST',
        })

        const registerJson = await registerResp.json().catch(() => ({}))
        if (!registerResp.ok) {
          const rawMessage = String(registerJson?.message || registerJson?.errors?.[0]?.message || '')
          if (rawMessage.toLowerCase().includes('exist') || rawMessage.includes('duplicate')) {
            throw new Error('This field is invalid: Email')
          }
          throw new Error(registerJson?.message || 'Registration failed.')
        }

        setMessage('Registration complete. Please check your email to verify the account.')
        setMessageTone('success')
        return
      }

      if (isLogin) {
        const loginResp = await fetch('/api/account/auth/login', {
          body: JSON.stringify({
            email,
            password,
          }),
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          method: 'POST',
        })

        const loginJson = await loginResp.json().catch(() => ({}))
        if (!loginResp.ok) {
          throw new Error(loginJson?.message || 'Login failed.')
        }

        await waitForSession()

        if (typeof window !== 'undefined') {
          window.location.assign(resolvedRedirect)
        }
        return
      }

      if (isForgot) {
        const forgotResp = await fetch('/api/account/auth/forgot-password', {
          body: JSON.stringify({ email }),
          headers: { 'Content-Type': 'application/json' },
          method: 'POST',
        })

        if (!forgotResp.ok) {
          const forgotJson = await forgotResp.json().catch(() => ({}))
          throw new Error(forgotJson?.message || 'Unable to send reset email.')
        }

        setMode('forgot-success')
      }
    } catch (error) {
      const fallbackMessage =
        error instanceof Error && error.message
          ? error.message
          : isRegister
            ? registrationPrivacyMessage
            : 'Action failed.'
      setMessage(fallbackMessage)
      setMessageTone('error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <AuthCardShell
        actionButton={
          isLogin ? (
            <div className={styles.actionStack}>
              <FrameButton disabled={loading} fullWidth type="submit" variant="slate">
                {loading ? 'Processing...' : 'Sign In'}
              </FrameButton>
              <FrameButton
                fullWidth
                onClick={() => {
                  setMode('register')
                  resetTransientState()
                }}
                type="button"
                variant="gold"
              >
                Sign Up
              </FrameButton>
            </div>
          ) : isRegister ? (
            <div className={styles.actionStack}>
              <FrameButton disabled={loading} fullWidth type="submit" variant="gold">
                {loading ? 'Processing...' : 'Sign Up'}
              </FrameButton>
            </div>
          ) : (
            <FrameButton
              disabled={loading}
              fullWidth
              onClick={
                isForgotSuccess
                  ? () => {
                      setMode('login')
                      resetTransientState()
                    }
                  : undefined
              }
              type={isForgotSuccess ? 'button' : 'submit'}
              variant="slate"
            >
              {loading ? 'Processing...' : isForgot ? 'Submit' : 'Sign In'}
            </FrameButton>
          )
        }
        footerLink={
          isForgot ? (
            <button
              className={styles.footerLink}
              onClick={() => {
                setMode('login')
                resetTransientState()
              }}
              type="button"
            >
              Back to Sign In
            </button>
          ) : isRegister ? (
            <button
              className={styles.footerLink}
              onClick={() => {
                setMode('login')
                resetTransientState()
              }}
              type="button"
            >
              Sign In
            </button>
          ) : (
            <button
              className={styles.footerLink}
              onClick={() => {
                setMode('forgot')
                resetTransientState()
              }}
              type="button"
            >
              Forgot Password
            </button>
          )
        }
      >
        {isForgotSuccess ? (
          <div className={styles.successState}>
            <h3 className={styles.successTitle}>Check Your Email</h3>
            <p className={styles.successText}>
              If that address exists in Thorns Tavern, we have sent a password reset link. Open the email to choose a new password.
            </p>
          </div>
        ) : (
          <>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Email</span>
              <input
                className={styles.input}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Please enter your email"
                type="email"
                value={email}
              />
            </label>

            {isRegister ? (
              <label className={styles.field}>
                <span className={styles.fieldLabel}>Verification Code</span>
                <div className={styles.codeRow}>
                  <input
                    className={styles.codeInput}
                    onChange={(event) => setVerificationCode(event.target.value)}
                    placeholder="Enter Email Verification Code"
                    type="text"
                    value={verificationCode}
                  />
                  <button className={styles.codeButton} onClick={handleSendCode} type="button">
                    Send Code
                  </button>
                </div>
              </label>
            ) : null}

            {(isLogin || isRegister) ? (
              <label className={styles.field}>
                <span className={styles.fieldLabel}>Password</span>
                <div className={styles.inputWithIcon}>
                  <input
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Please enter your password"
                    type="password"
                    value={password}
                  />
                  <EyeOff className="text-[#f6d49e]" size={16} />
                </div>
              </label>
            ) : null}

            {isRegister ? (
              <label className={styles.field}>
                <span className={styles.fieldLabel}>Confirm Password</span>
                <div className={styles.inputWithIcon}>
                  <input
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Please enter your password again"
                    type="password"
                    value={confirmPassword}
                  />
                  <Eye className="text-[#f6d49e]" size={16} />
                </div>
              </label>
            ) : null}

            {(isLogin || isRegister) ? (
              <label className={styles.checkboxRow}>
                <button
                  className={`${styles.checkbox} ${agreed ? styles.checkboxChecked : ''}`}
                  onClick={() => setAgreed((value) => !value)}
                  type="button"
                />
                <span className={styles.checkboxText}>I have read and agreed to the Terms of Use and Privacy Policy.</span>
              </label>
            ) : null}

            <div className={`${styles.message} ${messageTone === 'error' ? styles.messageError : ''} ${messageTone === 'success' ? styles.messageSuccess : ''}`}>
              {message}
            </div>
          </>
        )}
      </AuthCardShell>
    </form>
  )
}
