import { type MigrateDownArgs, type MigrateUpArgs, executeStatements } from '../lib/migrations/postgresUtils'

const upStatements = [
  `ALTER TYPE enum_generation_tasks_provider ADD VALUE IF NOT EXISTS 'openai-compatible'`,
  `ALTER TYPE enum_ai_provider_settings_image_generation_default_provider ADD VALUE IF NOT EXISTS 'openai-compatible'`,
  `ALTER TABLE ai_provider_settings ADD COLUMN IF NOT EXISTS image_generation_open_a_i_compatible_base_u_r_l varchar DEFAULT 'https://api.openai.com/v1'`,
  `ALTER TABLE ai_provider_settings ADD COLUMN IF NOT EXISTS image_generation_open_a_i_compatible_model varchar DEFAULT 'gpt-image-1'`,
  `ALTER TABLE ai_provider_settings ADD COLUMN IF NOT EXISTS image_generation_open_a_i_compatible_api_key varchar`,
  `ALTER TABLE ai_provider_settings ADD COLUMN IF NOT EXISTS image_generation_open_a_i_compatible_size varchar DEFAULT '1024x1024'`,
]

const downStatements = [
  `ALTER TABLE ai_provider_settings DROP COLUMN IF EXISTS image_generation_open_a_i_compatible_size`,
  `ALTER TABLE ai_provider_settings DROP COLUMN IF EXISTS image_generation_open_a_i_compatible_api_key`,
  `ALTER TABLE ai_provider_settings DROP COLUMN IF EXISTS image_generation_open_a_i_compatible_model`,
  `ALTER TABLE ai_provider_settings DROP COLUMN IF EXISTS image_generation_open_a_i_compatible_base_u_r_l`,
]

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await executeStatements(db, upStatements)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await executeStatements(db, downStatements)
}
