import pg from 'pg'

import { resolveDatabaseRuntimeConfig } from '@/lib/databaseRuntimeConfig'

const { Pool } = pg

function buildPoolConfig(config: Extract<ReturnType<typeof resolveDatabaseRuntimeConfig>, { provider: 'postgres' }>) {
  const parsed = new URL(config.connectionString)
  return {
    connectionTimeoutMillis: config.pool.connectionTimeoutMillis,
    database: parsed.pathname.replace(/^\//, '') || 'postgres',
    host: parsed.hostname,
    idleTimeoutMillis: config.pool.idleTimeoutMillis,
    max: config.pool.max,
    min: config.pool.min,
    password: decodeURIComponent(parsed.password),
    port: Number(parsed.port || 5432),
    ssl: config.ssl,
    user: decodeURIComponent(parsed.username),
  }
}

const globalForPool = globalThis as typeof globalThis & {
  __thornstavernPostgresPool?: pg.Pool
}

export function getPostgresPool() {
  const config = resolveDatabaseRuntimeConfig()

  if (config.provider !== 'postgres') {
    throw new Error('Postgres runtime is not enabled. Set DATABASE_PROVIDER=postgres and provide DATABASE_URL.')
  }

  if (!globalForPool.__thornstavernPostgresPool) {
    globalForPool.__thornstavernPostgresPool = new Pool(buildPoolConfig(config))
  }

  return globalForPool.__thornstavernPostgresPool
}

export async function queryPostgres<T extends pg.QueryResultRow = pg.QueryResultRow>(text: string, values: unknown[] = []) {
  return getPostgresPool().query<T>(text, values)
}
