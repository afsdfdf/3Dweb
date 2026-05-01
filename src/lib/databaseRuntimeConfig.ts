export type DatabaseRuntimeConfig = {
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

const isTruthy = (value: string | undefined) => ['1', 'true', 'yes', 'on'].includes(String(value || '').toLowerCase())

function readDirectPostgresUrl() {
  return (
    process.env.DATABASE_URL ||
    process.env.SUPABASE_DB_URL ||
    process.env.SUPABASE_DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    ''
  )
}

export function readPostgresPoolConfig() {
  return {
    // Migration note:
    // These defaults are safe starting values for Supabase/Postgres deployments.
    // Override them with env vars only when load testing proves a different profile is needed.
    connectionTimeoutMillis: Number(process.env.POSTGRES_POOL_CONNECTION_TIMEOUT_MS || 5000),
    idleTimeoutMillis: Number(process.env.POSTGRES_POOL_IDLE_TIMEOUT_MS || 30000),
    max: Number(process.env.POSTGRES_POOL_MAX || 20),
    min: Number(process.env.POSTGRES_POOL_MIN || 2),
  }
}

export function resolveDatabaseRuntimeConfig(): DatabaseRuntimeConfig {
  const explicitProvider = String(process.env.DATABASE_PROVIDER || process.env.DB_PROVIDER || '').toLowerCase()
  const directUrl = readDirectPostgresUrl()
  const connectionString = directUrl
  const shouldUsePostgres =
    explicitProvider === 'postgres' ||
    explicitProvider === 'postgresql' ||
    /^postgres(ql)?:\/\//i.test(connectionString)

  if (shouldUsePostgres && connectionString) {
    const sslDisabled = explicitProvider === 'postgres' || explicitProvider === 'postgresql'
      ? process.env.POSTGRES_SSL === 'false'
      : false
    const rejectUnauthorized = isTruthy(process.env.POSTGRES_SSL_REJECT_UNAUTHORIZED)

    return {
      connectionString,
      pool: readPostgresPoolConfig(),
      provider: 'postgres',
      ssl: sslDisabled ? false : { rejectUnauthorized },
    }
  }

  throw new Error(
    'Postgres runtime is required. Set DATABASE_PROVIDER=postgres and provide a valid DATABASE_URL. ' +
      'SQLite fallback has been removed from this project runtime.',
  )
}
