/**
 * Next.js instrumentation hook. Required for @sentry/nextjs v8+ — the
 * server/edge Sentry configs are only loaded through this register()
 * call; the sentry.*.config.ts files are not picked up automatically.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('../sentry.server.config')
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('../sentry.edge.config')
  }
}
