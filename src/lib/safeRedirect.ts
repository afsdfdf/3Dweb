const defaultInternalRedirect = '/account'

export function isSafeInternalRedirect(value?: null | string) {
  if (!value || typeof value !== 'string') return false
  if (value.trim() !== value) return false
  if (!value.startsWith('/')) return false
  if (value.startsWith('//') || value.startsWith('/\\')) return false
  return true
}

export function getSafeInternalRedirect(value?: null | string, fallback: string = defaultInternalRedirect): string {
  if (isSafeInternalRedirect(value) && value) return value
  return fallback
}
