import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

test('baseline reconciliation keeps audit_logs relation column repair for admin lock documents', () => {
  const migrationPath = path.join(process.cwd(), 'src/migrations/20260417_023000_database_baseline_reconciliation.ts')
  const source = fs.readFileSync(migrationPath, 'utf8')

  assert.match(source, /audit_logs_id/)
})
