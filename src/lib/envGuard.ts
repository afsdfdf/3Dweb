const MIN_SECRET_LENGTH = 32

const isProduction = () => process.env.NODE_ENV === 'production'

export function getValidatedPayloadSecret() {
  const secret = (process.env.PAYLOAD_SECRET || '').trim()

  if (!secret) {
    throw new Error('PAYLOAD_SECRET is required and cannot be empty.')
  }

  if (secret.length < MIN_SECRET_LENGTH) {
    throw new Error(`PAYLOAD_SECRET must be at least ${MIN_SECRET_LENGTH} characters long.`)
  }

  return secret
}

export function assertRuntimeSecurityGuards() {
  if (isProduction() && process.env.SMTP_SKIP_VERIFY === 'true') {
    throw new Error('SMTP_SKIP_VERIFY=true is not allowed in production.')
  }
}

export function getAllowedDevOrigins() {
  const configured = (process.env.ALLOWED_DEV_ORIGINS || '').trim()

  if (configured) {
    return configured
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  }

  if (isProduction()) {
    return []
  }

  // L-03: Avoid hardcoded private LAN IPs; keep only standard local loopback hosts.
  return ['127.0.0.1', 'localhost']
}

