const DEFAULT_APP_URL = 'http://127.0.0.1:3000'

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '')

export function getCanonicalAppURL() {
  const configured = (process.env.CANONICAL_APP_URL || process.env.NEXT_PUBLIC_APP_URL || '').trim()

  if (!configured) {
    return DEFAULT_APP_URL
  }

  try {
    return trimTrailingSlash(new URL(configured).toString())
  } catch {
    return DEFAULT_APP_URL
  }
}

