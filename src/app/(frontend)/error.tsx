'use client'

import { useEffect } from 'react'

export default function FrontendError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Frontend route error:', error)
    // Report to Sentry when configured (import is dynamic so it tree-shakes when DSN absent)
    import('@sentry/nextjs').then(({ captureException }) => captureException(error)).catch(() => undefined)
  }, [error])

  return (
    <div
      style={{
        alignItems: 'center',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        justifyContent: 'center',
        minHeight: '60vh',
        padding: '40px 24px',
        textAlign: 'center',
      }}
    >
      <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Something went wrong</h1>
      <p style={{ color: '#666', maxWidth: '420px' }}>
        We hit an unexpected error loading this page. Please try again — if it keeps happening, come back in a few minutes.
      </p>
      <button
        onClick={reset}
        style={{
          background: '#111',
          borderRadius: '8px',
          color: '#fff',
          cursor: 'pointer',
          padding: '10px 20px',
        }}
        type="button"
      >
        Try again
      </button>
    </div>
  )
}
