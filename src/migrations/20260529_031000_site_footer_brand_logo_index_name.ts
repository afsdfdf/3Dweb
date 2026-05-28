import { type MigrateDownArgs, type MigrateUpArgs, executeStatements } from '../lib/migrations/postgresUtils'

const upStatements = [
  `CREATE INDEX IF NOT EXISTS site_settings_footer_footer_brand_logo_idx ON site_settings(footer_brand_logo_id)`,
  `DROP INDEX IF EXISTS site_settings_footer_brand_logo_idx`,
]

const downStatements = [
  `CREATE INDEX IF NOT EXISTS site_settings_footer_brand_logo_idx ON site_settings(footer_brand_logo_id)`,
  `DROP INDEX IF EXISTS site_settings_footer_footer_brand_logo_idx`,
]

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await executeStatements(db, upStatements)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await executeStatements(db, downStatements)
}
