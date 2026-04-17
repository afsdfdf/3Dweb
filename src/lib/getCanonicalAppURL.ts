const DEFAULT_APP_URL = 'http://127.0.0.1:3000'

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '')

const isProduction = () => process.env.NODE_ENV === 'production'

function buildCanonicalAppURLError(reason: string) {
  return new Error(
    `Canonical app URL is required in production and must be a valid absolute URL. ${reason} ` +
      'Set CANONICAL_APP_URL or NEXT_PUBLIC_APP_URL to your public application origin.',
  )
}

export function getCanonicalAppURL() {
  const configured = (process.env.CANONICAL_APP_URL || process.env.NEXT_PUBLIC_APP_URL || '').trim()

  if (!configured) {
    if (isProduction()) {
      throw buildCanonicalAppURLError('No canonical URL is configured.')
    }

    return DEFAULT_APP_URL
  }

  try {
    return trimTrailingSlash(new URL(configured).toString())
  } catch {
    if (isProduction()) {
      throw buildCanonicalAppURLError(`Invalid configured value: "${configured}".`)
    }

    return DEFAULT_APP_URL
  }
}
