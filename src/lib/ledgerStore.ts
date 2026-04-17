import type { PayloadRequest } from 'payload'

type QueryResultRow = Record<string, unknown>

export type LedgerQueryResult = {
  rows?: QueryResultRow[]
}

export type LedgerExecutor = {
  dialect: 'postgres' | 'sqlite'
  execute: (sql: string, args?: unknown[]) => Promise<LedgerQueryResult>
}

const toPostgresPlaceholders = (sql: string) => {
  let index = 0
  return sql.replace(/\?/g, () => {
    index += 1
    return `$${index}`
  })
}

async function withSqliteTransaction<T>(rawClient: any, callback: (executor: LedgerExecutor) => Promise<T>) {
  const transaction = await rawClient.transaction('write')

  const executor: LedgerExecutor = {
    dialect: 'sqlite',
    execute: async (sql, args = []) => transaction.execute({ args, sql }),
  }

  try {
    const result = await callback(executor)
    await transaction.commit()
    return result
  } catch (error) {
    await transaction.rollback().catch(() => null)
    throw error
  } finally {
    transaction.close()
  }
}

async function withPostgresTransaction<T>(rawClient: any, callback: (executor: LedgerExecutor) => Promise<T>) {
  const client = await rawClient.connect()

  const executor: LedgerExecutor = {
    dialect: 'postgres',
    execute: async (sql, args = []) => client.query(toPostgresPlaceholders(sql), args),
  }

  try {
    await client.query('BEGIN')
    const result = await callback(executor)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK').catch(() => null)
    throw error
  } finally {
    client.release?.()
  }
}

export async function withLedgerTransaction<T>(req: PayloadRequest, callback: (executor: LedgerExecutor) => Promise<T>) {
  const rawClient = (req.payload.db.drizzle as { $client?: unknown }).$client as any

  if (rawClient && typeof rawClient.transaction === 'function' && typeof rawClient.execute === 'function') {
    return withSqliteTransaction(rawClient, callback)
  }

  if (rawClient && typeof rawClient.connect === 'function') {
    return withPostgresTransaction(rawClient, callback)
  }

  throw new Error('Unsupported ledger database client. Expected sqlite/libsql or postgres pool client.')
}
