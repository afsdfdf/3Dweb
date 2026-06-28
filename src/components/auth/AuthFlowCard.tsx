'use client'

import type { CSSProperties, FormEvent, ReactNode } from 'react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

import { OrangeMediumActionButton, PurpleMediumActionButton } from '@/components/ui-lab/action-buttons'
import { BorderComboFrame1 } from '@/components/ui-lab/border-combo-frame-1'
import { registrationPrivacyMessage } from '@/lib/registrationPrivacy'
import { getSafeInternalRedirect } from '@/lib/safeRedirect'

import styles from '@/components/ui-lab/formal-auth-collections.module.css'

type AuthMode = 'forgot' | 'forgot-success' | 'login' | 'register' | 'reset'

type AuthFlowCardProps = {
  initialMode?: AuthMode
  initialResetToken?: string
  onSuccess?: () => void
  redirectTo?: string
}

type RegistrationVerificationMode = 'email-code' | 'email-link'

const termsAgreementMessage = 'Please agree to the Terms and Privacy Policy.'

const safeRedirect = (value?: null | string) => {
  return getSafeInternalRedirect(value, '/generate')
}

const passwordEyeHiddenSrc = '/ui-lab/auth/password-eye-hidden@2x.png'
const passwordEyeVisibleSrc = '/ui-lab/auth/password-eye-visible@2x.png'

function EyeButton({ onClick, visible }: { onClick: () => void; visible: boolean }) {
  return (
    <button
      aria-label={visible ? 'Hide password' : 'Show password'}
      aria-pressed={visible}
      className={styles.eyeButton}
      onClick={onClick}
      type="button"
    >
      <img
        alt=""
        aria-hidden="true"
        className={styles.eyeIcon}
        decoding="async"
        src={visible ? passwordEyeVisibleSrc : passwordEyeHiddenSrc}
      />
    </button>
  )
}

function AuthPolicyLinks({ className }: { className?: string }) {
  return (
    <span className={className}>
      I have read and agreed to the <span className={styles.linkText}>Terms of Use</span> and{' '}
      <Link className={styles.linkText} href="/privacy-policy">
        Privacy Policy
      </Link>
      .
    </span>
  )
}
function AuthField({
  children,
  className,
  label,
  onChange,
  placeholder,
  type,
  value,
}: {
  children?: ReactNode
  className: string
  label: string
  onChange: (value: string) => void
  placeholder: string
  type: string
  value: string
}) {
  return (
    <label className={[styles.field, className, value ? styles.fieldFilled : ''].join(' ')}>
      <span className={styles.fieldLabel}>{label}</span>
      <input
        className={styles.input}
        onChange={(event) => onChange(event.target.value)}
        placeholder={value ? '' : placeholder}
        type={type}
        value={value}
      />
      {children}
    </label>
  )
}

function AuthScaleFrame({ children, height }: { children: ReactNode; height: number }) {
  return (
    <div
      className={styles.scaleFrame}
      style={
        {
          '--auth-height': `${height}px`,
          '--auth-scale': 1,
          height,
          width: 380,
        } as CSSProperties
      }
    >
      <div className={styles.scaleInner}>{children}</div>
    </div>
  )
}

export function AuthFlowCard({ initialMode = 'login', initialResetToken = '', onSuccess, redirectTo }: AuthFlowCardProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode)
  const [email, setEmail] = useState('')
  const [resetToken, setResetToken] = useState(initialResetToken)
  const [verificationCode, setVerificationCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [message, setMessage] = useState('')
  const [messageTone, setMessageTone] = useState<'error' | 'success' | null>(null)
  const [loading, setLoading] = useState(false)
  const [sendCodeLoading, setSendCodeLoading] = useState(false)
  const [sendCodeCooldown, setSendCodeCooldown] = useState(0)
  const [registrationVerificationMode, setRegistrationVerificationMode] =
    useState<RegistrationVerificationMode>('email-code')

  const resolvedRedirect = safeRedirect(redirectTo)
  const isLogin = mode === 'login'
  const isRegister = mode === 'register'
  const isForgot = mode === 'forgot'
  const isForgotSuccess = mode === 'forgot-success'
  const isReset = mode === 'reset'
  const requiresVerificationCode = registrationVerificationMode === 'email-code'

  useEffect(() => {
    setMode(initialMode)
  }, [initialMode])

  useEffect(() => {
    setResetToken(initialResetToken)
  }, [initialResetToken])

  useEffect(() => {
    if (initialMode !== 'reset' || !initialResetToken || typeof window === 'undefined') return

    const url = new URL(window.location.href)
    if (!url.searchParams.has('token')) return

    url.searchParams.delete('token')
    window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`)
  }, [initialMode, initialResetToken])

  useEffect(() => {
    let alive = true

    const loadAuthSettings = async () => {
      try {
        const response = await fetch('/api/account/auth/settings', {
          headers: { Accept: 'application/json' },
          method: 'GET',
        })
        const json = await response.json().catch(() => null)
        if (!alive || !response.ok) return
        if (json?.registrationVerificationMode === 'email-link' || json?.registrationVerificationMode === 'email-code') {
          setRegistrationVerificationMode(json.registrationVerificationMode)
        }
      } catch {
        // Keep the secure default.
      }
    }

    void loadAuthSettings()

    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    if (sendCodeCooldown <= 0) return

    const timer = window.setTimeout(() => {
      setSendCodeCooldown((value) => Math.max(0, value - 1))
    }, 1000)

    return () => window.clearTimeout(timer)
  }, [sendCodeCooldown])

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

  const handleAgreementChange = (value: boolean) => {
    setAgreed(value)
    if (value && message === termsAgreementMessage) {
      setMessage('')
      setMessageTone(null)
    }
  }

  const completeLogin = async () => {
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

    if (onSuccess) {
      onSuccess()
      return
    }

    if (typeof window !== 'undefined') {
      window.location.assign(resolvedRedirect)
    }
  }

  const handleSendCode = async () => {
    if (!email.trim()) {
      setMessage('Please enter your email first.')
      setMessageTone('error')
      return
    }

    setSendCodeLoading(true)
    setMessage('')
    setMessageTone(null)

    try {
      const response = await fetch('/api/account/auth/send-register-code', {
        body: JSON.stringify({ email }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })
      const json = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(json?.message || 'Unable to send verification code.')
      }

      setSendCodeCooldown(60)
      setMessage(json?.message || 'Please check your email for the verification code.')
      setMessageTone('success')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to send verification code.')
      setMessageTone('error')
    } finally {
      setSendCodeLoading(false)
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setMessage('')
    setMessageTone(null)

    try {
      if (isRegister) {
        if (requiresVerificationCode && !verificationCode.trim()) {
          throw new Error('Please enter the verification code.')
        }

        if (password !== confirmPassword) {
          throw new Error('Passwords do not match.')
        }

        if (!agreed) {
          throw new Error(termsAgreementMessage)
        }

        const registerResp = await fetch('/api/account/auth/register', {
          body: JSON.stringify({
            email,
            password,
            verificationCode: requiresVerificationCode ? verificationCode : undefined,
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

        if (requiresVerificationCode && registerJson?.loginReady === true) {
          setMessage('Registration complete. Signing you in...')
          setMessageTone('success')
          await completeLogin()
          return
        }

        setMessage(registerJson?.message || 'Registration complete. Please check your email to verify the account.')
        setMessageTone('success')
        return
      }

      if (isReset) {
        if (!resetToken.trim()) {
          throw new Error('Reset token is required.')
        }

        if (!password || password.length < 8) {
          throw new Error('Password must be at least 8 characters.')
        }

        if (password !== confirmPassword) {
          throw new Error('Passwords do not match.')
        }

        const resetResp = await fetch('/api/account/auth/reset-password', {
          body: JSON.stringify({
            password,
            token: resetToken,
          }),
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          method: 'POST',
        })

        const resetJson = await resetResp.json().catch(() => ({}))
        if (!resetResp.ok) {
          throw new Error(resetJson?.message || 'Failed to reset password.')
        }

        if (resetJson?.user?.email) {
          setEmail(String(resetJson.user.email))
        }

        await fetch('/api/account/auth/logout', {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          method: 'POST',
        }).catch(() => null)

        setPassword('')
        setConfirmPassword('')
        setResetToken('')
        setMode('login')
        setMessage('Password reset complete. Please sign in with your new password.')
        setMessageTone('success')
        return
      }

      if (isLogin) {
        if (!agreed) {
          throw new Error(termsAgreementMessage)
        }

        await completeLogin()
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
      <AuthScaleFrame height={isRegister ? 662 : 588}>
        <section
          className={[
            styles.panel,
            isRegister ? styles.registerPanel : styles.loginPanel,
            isForgot || isForgotSuccess || isReset ? styles.authForgotPanel : '',
            isReset ? styles.resetPanel : '',
          ].join(' ')}
          style={{ '--panel-height': `${isRegister ? 662 : 588}px` } as CSSProperties}
        >
          <BorderComboFrame1 className={styles.frame} />
          <div className={[styles.registerLogoGroup, isRegister ? '' : styles.loginLogoGroup].join(' ')} aria-hidden="true">
            <span className={styles.registerLogoMark} />
            <span className={styles.registerLogoText} />
          </div>

          <div className={styles.content}>
            {isForgotSuccess ? (
              <>
                <div className={styles.authSuccessState}>
                  <h3 className={styles.authSuccessTitle}>Check Your Email</h3>
                  <p className={styles.authSuccessText}>
                    If that address exists in Thorns Tavern, we have sent a password reset link. Open the email to choose a new password.
                  </p>
                </div>
                <div className={styles.forgotSubmitSlot}>
                  <div className={styles.buttonSlot}>
                    <PurpleMediumActionButton
                      className={[styles.authFlowButton, styles.authFlowButtonSlate].join(' ')}
                      label="Sign In"
                      onClick={() => {
                        setMode('login')
                        resetTransientState()
                      }}
                      type="button"
                    />
                  </div>
                </div>
              </>
            ) : isRegister ? (
              <>
                <AuthField
                  className={styles.registerEmail}
                  label="Email"
                  onChange={setEmail}
                  placeholder="Please enter your email"
                  type="email"
                  value={email}
                />

                {requiresVerificationCode ? (
                  <AuthField
                    className={[styles.codeField, styles.registerCode].join(' ')}
                    label="Verification Code"
                    onChange={setVerificationCode}
                    placeholder="Enter Email Verification Code"
                    type="text"
                    value={verificationCode}
                  >
                    <button
                      className={styles.sendCode}
                      disabled={sendCodeLoading || sendCodeCooldown > 0}
                      onClick={handleSendCode}
                      type="button"
                    >
                      {sendCodeLoading ? 'Sending...' : sendCodeCooldown > 0 ? `${sendCodeCooldown}s` : 'Send Code'}
                    </button>
                  </AuthField>
                ) : null}

                <AuthField
                  className={[
                    styles.registerPassword,
                    requiresVerificationCode ? '' : styles.registerPasswordLinkMode,
                  ].join(' ')}
                  label="Password"
                  onChange={setPassword}
                  placeholder="Please enter your password"
                  type={passwordVisible ? 'text' : 'password'}
                  value={password}
                >
                  <EyeButton visible={passwordVisible} onClick={() => setPasswordVisible((value) => !value)} />
                </AuthField>

                <AuthField
                  className={[
                    styles.registerConfirm,
                    requiresVerificationCode ? '' : styles.registerConfirmLinkMode,
                  ].join(' ')}
                  label="Confirm Password"
                  onChange={setConfirmPassword}
                  placeholder="Please enter your password again"
                  type={confirmPasswordVisible ? 'text' : 'password'}
                  value={confirmPassword}
                >
                  <EyeButton
                    visible={confirmPasswordVisible}
                    onClick={() => setConfirmPasswordVisible((value) => !value)}
                  />
                </AuthField>

                <label
                  className={[
                    styles.terms,
                    styles.registerTerms,
                    requiresVerificationCode ? '' : styles.registerTermsLinkMode,
                    message === termsAgreementMessage ? styles.termsError : '',
                  ].join(' ')}
                >
                  <input
                    checked={agreed}
                    className={styles.checkbox}
                    onChange={(event) => handleAgreementChange(event.target.checked)}
                    type="checkbox"
                  />
                  <AuthPolicyLinks className={styles.registerTermsText} />
                </label>

                <button
                  className={styles.registerSignIn}
                  onClick={() => {
                    setMode('login')
                    resetTransientState()
                  }}
                  type="button"
                >
                  Sign In
                </button>
                <div className={styles.registerSignUpSlot}>
                  <div className={styles.buttonSlot}>
                    <OrangeMediumActionButton
                      className={[styles.authFlowButton, styles.authFlowButtonGold].join(' ')}
                      disabled={loading}
                      label={loading ? 'Processing...' : 'Sign Up'}
                      type="submit"
                    />
                  </div>
                </div>
              </>
            ) : isForgot ? (
              <>
                <p className={styles.forgotIntro}>
                  Enter your email and we will send a password reset link.
                </p>

                <AuthField
                  className={styles.forgotEmail}
                  label="Email"
                  onChange={setEmail}
                  placeholder="Please enter your email"
                  type="email"
                  value={email}
                />

                <div className={styles.forgotSubmitSlot}>
                  <div className={styles.buttonSlot}>
                    <PurpleMediumActionButton
                      className={[styles.authFlowButton, styles.authFlowButtonSlate].join(' ')}
                      disabled={loading}
                      label={loading ? 'Processing...' : 'Submit'}
                      type="submit"
                    />
                  </div>
                </div>

                <button
                  className={styles.forgotSignIn}
                  onClick={() => {
                    setMode('login')
                    resetTransientState()
                  }}
                  type="button"
                >
                  Sign In
                </button>
                <button
                  className={styles.forgotSignUp}
                  onClick={() => {
                    setMode('register')
                    resetTransientState()
                  }}
                  type="button"
                >
                  Sign Up
                </button>
              </>
            ) : isReset ? (
              <>
                <p className={styles.resetIntro}>Choose a new password for your account.</p>

                <AuthField
                  className={styles.resetPassword}
                  label="New Password"
                  onChange={setPassword}
                  placeholder="Please enter your new password"
                  type={passwordVisible ? 'text' : 'password'}
                  value={password}
                >
                  <EyeButton visible={passwordVisible} onClick={() => setPasswordVisible((value) => !value)} />
                </AuthField>

                <AuthField
                  className={styles.resetConfirm}
                  label="Confirm Password"
                  onChange={setConfirmPassword}
                  placeholder="Please enter your password again"
                  type={confirmPasswordVisible ? 'text' : 'password'}
                  value={confirmPassword}
                >
                  <EyeButton
                    visible={confirmPasswordVisible}
                    onClick={() => setConfirmPasswordVisible((value) => !value)}
                  />
                </AuthField>

                <div className={[styles.loginSignInSlot, styles.resetSubmitSlot].join(' ')}>
                  <div className={styles.buttonSlot}>
                    <PurpleMediumActionButton
                      className={[styles.authFlowButton, styles.authFlowButtonSlate].join(' ')}
                      disabled={loading}
                      label={loading ? 'Processing...' : 'Reset'}
                      type="submit"
                    />
                  </div>
                </div>

                <button
                  className={styles.resetSignIn}
                  onClick={() => {
                    setMode('login')
                    resetTransientState()
                  }}
                  type="button"
                >
                  Sign In
                </button>
              </>
            ) : (
              <>
                <AuthField
                  className={styles.loginEmail}
                  label="Email"
                  onChange={setEmail}
                  placeholder="Please enter your email"
                  type="email"
                  value={email}
                />

                <AuthField
                  className={styles.loginPassword}
                  label="Password"
                  onChange={setPassword}
                  placeholder="Please enter your password"
                  type={passwordVisible ? 'text' : 'password'}
                  value={password}
                >
                  <EyeButton visible={passwordVisible} onClick={() => setPasswordVisible((value) => !value)} />
                </AuthField>

                <label
                  className={[
                    styles.terms,
                    styles.loginTerms,
                    message === termsAgreementMessage ? styles.termsError : '',
                  ].join(' ')}
                >
                  <input
                    checked={agreed}
                    className={styles.checkbox}
                    onChange={(event) => handleAgreementChange(event.target.checked)}
                    type="checkbox"
                  />
                  <AuthPolicyLinks />
                </label>

                <div className={styles.loginSignInSlot}>
                  <div className={styles.buttonSlot}>
                    <PurpleMediumActionButton
                      className={[styles.authFlowButton, styles.authFlowButtonSlate].join(' ')}
                      disabled={loading}
                      label={loading ? 'Processing...' : 'Sign In'}
                      type="submit"
                    />
                  </div>
                </div>
                <div className={styles.loginSignUpSlot}>
                  <div className={styles.buttonSlot}>
                    <OrangeMediumActionButton
                      className={[styles.authFlowButton, styles.authFlowButtonGold].join(' ')}
                      label="Sign Up"
                      onClick={() => {
                        setMode('register')
                        resetTransientState()
                      }}
                      type="button"
                    />
                  </div>
                </div>

                <button
                  className={styles.forgot}
                  onClick={() => {
                    setMode('forgot')
                    resetTransientState()
                  }}
                  type="button"
                >
                  Forgot Password
                </button>
              </>
            )}

            <div
              className={[
                styles.authFlowMessage,
                messageTone === 'error' ? styles.authFlowMessageError : '',
                messageTone === 'success' ? styles.authFlowMessageSuccess : '',
              ].join(' ')}
            >
              {message}
            </div>
          </div>
        </section>
      </AuthScaleFrame>
    </form>
  )
}
