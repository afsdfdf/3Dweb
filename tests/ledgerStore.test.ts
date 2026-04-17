import assert from 'node:assert/strict'
import test from 'node:test'

import { withLedgerTransaction } from '../src/lib/ledgerStore.ts'

test('withLedgerTransaction uses postgres transaction flow and converts placeholders', async () => {
  const calls: Array<{ args?: unknown[]; sql: string }> = []
  const client = {
    query: async (sql: string, args?: unknown[]) => {
      calls.push({ args, sql })
      return { rows: [{ ok: true }] }
    },
    release: () => undefined,
  }

  const req = {
    payload: {
      db: {
        drizzle: {
          $client: {
            connect: async () => client,
          },
        },
      },
    },
  } as never

  await withLedgerTransaction(req, async (executor) => {
    assert.equal(executor.dialect, 'postgres')
    await executor.execute('SELECT * FROM credits WHERE user_id = ? AND id = ?', [7, 2])
  })

  assert.equal(calls[0]?.sql, 'BEGIN')
  assert.equal(calls[1]?.sql, 'SELECT * FROM credits WHERE user_id = $1 AND id = $2')
  assert.deepEqual(calls[1]?.args, [7, 2])
  assert.equal(calls.at(-1)?.sql, 'COMMIT')
})

test('withLedgerTransaction rolls back postgres transaction on failure', async () => {
  const calls: string[] = []
  const client = {
    query: async (sql: string) => {
      calls.push(sql)
      if (sql === 'SELECT 1') {
        throw new Error('boom')
      }
      return { rows: [] }
    },
    release: () => undefined,
  }

  const req = {
    payload: {
      db: {
        drizzle: {
          $client: {
            connect: async () => client,
          },
        },
      },
    },
  } as never

  await assert.rejects(
    () =>
      withLedgerTransaction(req, async (executor) => {
        await executor.execute('SELECT 1')
      }),
    /boom/,
  )

  assert.deepEqual(calls, ['BEGIN', 'SELECT 1', 'ROLLBACK'])
})
