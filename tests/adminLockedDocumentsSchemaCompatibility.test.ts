import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'

test('baseline reconciliation remains a Postgres-only no-op', () => {
  const migrationPath = path.join(process.cwd(), 'src/migrations/20260417_023000_database_baseline_reconciliation.ts')
  const source = fs.readFileSync(migrationPath, 'utf8')

  assert.match(source, /Historical SQLite-only baseline reconciliation/)
  assert.doesNotMatch(source, /audit_logs_id/)
})
