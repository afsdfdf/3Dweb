import type { MigrateDownArgs, MigrateUpArgs } from '../lib/migrations/postgresUtils'

// Pricing columns are created by 20260501_053500_meshy_unified_flow_settings.
// Keep this migration as a no-op so databases that have already recorded it
// remain compatible, while rollback never drops columns owned by the earlier
// unified Meshy settings migration.

export async function up({ db }: MigrateUpArgs): Promise<void> {
  void db
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  void db
}
