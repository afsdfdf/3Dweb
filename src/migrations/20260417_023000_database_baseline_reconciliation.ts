import { type MigrateDownArgs, type MigrateUpArgs } from './postgresUtils'

export async function up({}: MigrateUpArgs): Promise<void> {
  // Historical SQLite-only baseline reconciliation.
  // The project runtime is now Postgres-only and current schemas are created
  // via Payload's Postgres adapter plus forward-only Postgres migrations.
  // Keeping this migration as a no-op prevents legacy SQLite repair SQL from
  // executing against Supabase/Postgres environments.
}

export async function down({}: MigrateDownArgs): Promise<void> {
  // Historical SQLite-only baseline reconciliation.
  // Intentionally left as a no-op for Postgres-only deployments.
}
