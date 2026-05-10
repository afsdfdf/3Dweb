import { type MigrateDownArgs, type MigrateUpArgs, executeStatements } from '../lib/migrations/postgresUtils'

const upStatements = [
  `ALTER TABLE ai_provider_settings ADD COLUMN IF NOT EXISTS meshy_max_concurrent_tasks numeric DEFAULT 20`,
  `UPDATE ai_provider_settings SET meshy_max_concurrent_tasks = 20 WHERE meshy_max_concurrent_tasks IS NULL`,
  `ALTER TABLE ai_provider_settings ADD COLUMN IF NOT EXISTS image_generation_max_concurrent_tasks numeric DEFAULT 20`,
  `UPDATE ai_provider_settings SET image_generation_max_concurrent_tasks = 20 WHERE image_generation_max_concurrent_tasks IS NULL`,
]

const downStatements = [
  `ALTER TABLE ai_provider_settings DROP COLUMN IF EXISTS image_generation_max_concurrent_tasks`,
  `ALTER TABLE ai_provider_settings DROP COLUMN IF EXISTS meshy_max_concurrent_tasks`,
]

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await executeStatements(db, upStatements)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await executeStatements(db, downStatements)
}
