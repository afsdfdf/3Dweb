export type DatabaseRuntimeConfig =
  | {
      connectionString: string
      pool: {
        connectionTimeoutMillis: number
        idleTimeoutMillis: number
        max: number
        min: number
      }
      provider: 'postgres'
      ssl:
        | false
        | {
            rejectUnauthorized: boolean
          }
    }
  | {
      provider: 'sqlite'
      url: string
    }

const isTruthy = (value: string | undefined) => ['1', 'true', 'yes', 'on'].includes(String(value || '').toLowerCase())

export function buildAwsRdsConnectionString() {
  const host = process.env.AWS_RDS_HOST || ''
  const database = process.env.AWS_RDS_DB_NAME || process.env.AWS_RDS_DATABASE || ''
  const username = process.env.AWS_RDS_USERNAME || process.env.AWS_RDS_USER || ''
  const password = process.env.AWS_RDS_PASSWORD || ''

  if (!host || !database || !username || !password) {
    return ''
  }

  const port = Number(process.env.AWS_RDS_PORT || 5432)
  const sslmode = process.env.AWS_RDS_SSL_MODE || 'require'

  const url = new URL(`postgresql://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${host}:${port}/${database}`)
  url.searchParams.set('sslmode', sslmode)

  if (process.env.AWS_RDS_SCHEMA) {
    url.searchParams.set('schema', process.env.AWS_RDS_SCHEMA)
  }

  return url.toString()
}

export function readPostgresPoolConfig() {
  return {
    // Migration note:
    // These defaults are safe starting values for AWS RDS-backed deployments.
    // Override them with env vars only when load testing proves a different profile is needed.
    connectionTimeoutMillis: Number(process.env.POSTGRES_POOL_CONNECTION_TIMEOUT_MS || 5000),
    idleTimeoutMillis: Number(process.env.POSTGRES_POOL_IDLE_TIMEOUT_MS || 30000),
    max: Number(process.env.POSTGRES_POOL_MAX || 20),
    min: Number(process.env.POSTGRES_POOL_MIN || 2),
  }
}

export function resolveDatabaseRuntimeConfig(): DatabaseRuntimeConfig {
  const explicitProvider = String(process.env.DATABASE_PROVIDER || process.env.DB_PROVIDER || '').toLowerCase()
  const directUrl = process.env.DATABASE_URL || ''
  const awsRdsUrl = buildAwsRdsConnectionString()
  const connectionString = directUrl || awsRdsUrl
  const shouldUsePostgres =
    explicitProvider === 'postgres' ||
    explicitProvider === 'postgresql' ||
    /^postgres(ql)?:\/\//i.test(connectionString) ||
    Boolean(awsRdsUrl)

  if (shouldUsePostgres && connectionString) {
    const sslDisabled = explicitProvider === 'postgres' || explicitProvider === 'postgresql'
      ? process.env.AWS_RDS_SSL === 'false' || process.env.POSTGRES_SSL === 'false'
      : false
    const rejectUnauthorized = isTruthy(process.env.AWS_RDS_SSL_REJECT_UNAUTHORIZED || process.env.POSTGRES_SSL_REJECT_UNAUTHORIZED)

    return {
      connectionString,
      pool: readPostgresPoolConfig(),
      provider: 'postgres',
      ssl: sslDisabled ? false : { rejectUnauthorized },
    }
  }

  return {
    provider: 'sqlite',
    url: process.env.DATABASE_URL || 'file:./payload.db',
  }
}
