import { type MigrateDownArgs, type MigrateUpArgs, executeStatements } from '../lib/migrations/postgresUtils'

const upStatements = [
  `ALTER TABLE model_bundles_locales ADD COLUMN IF NOT EXISTS hero_marketing_eyebrow varchar`,
  `ALTER TABLE model_bundles_locales ADD COLUMN IF NOT EXISTS hero_marketing_title varchar`,
  `ALTER TABLE model_bundles_locales ADD COLUMN IF NOT EXISTS hero_marketing_subtitle varchar`,
  `ALTER TABLE model_bundles_locales ADD COLUMN IF NOT EXISTS hero_marketing_slogan varchar`,
  `ALTER TABLE model_bundles_locales ADD COLUMN IF NOT EXISTS hero_marketing_selling_point_one varchar`,
  `ALTER TABLE model_bundles_locales ADD COLUMN IF NOT EXISTS hero_marketing_selling_point_two varchar`,
  `ALTER TABLE model_bundles_locales ADD COLUMN IF NOT EXISTS hero_marketing_selling_point_three varchar`,
  `ALTER TABLE _model_bundles_v_locales ADD COLUMN IF NOT EXISTS version_hero_marketing_eyebrow varchar`,
  `ALTER TABLE _model_bundles_v_locales ADD COLUMN IF NOT EXISTS version_hero_marketing_title varchar`,
  `ALTER TABLE _model_bundles_v_locales ADD COLUMN IF NOT EXISTS version_hero_marketing_subtitle varchar`,
  `ALTER TABLE _model_bundles_v_locales ADD COLUMN IF NOT EXISTS version_hero_marketing_slogan varchar`,
  `ALTER TABLE _model_bundles_v_locales ADD COLUMN IF NOT EXISTS version_hero_marketing_selling_point_one varchar`,
  `ALTER TABLE _model_bundles_v_locales ADD COLUMN IF NOT EXISTS version_hero_marketing_selling_point_two varchar`,
  `ALTER TABLE _model_bundles_v_locales ADD COLUMN IF NOT EXISTS version_hero_marketing_selling_point_three varchar`,
]

const downStatements = [
  `ALTER TABLE _model_bundles_v_locales DROP COLUMN IF EXISTS version_hero_marketing_selling_point_three`,
  `ALTER TABLE _model_bundles_v_locales DROP COLUMN IF EXISTS version_hero_marketing_selling_point_two`,
  `ALTER TABLE _model_bundles_v_locales DROP COLUMN IF EXISTS version_hero_marketing_selling_point_one`,
  `ALTER TABLE _model_bundles_v_locales DROP COLUMN IF EXISTS version_hero_marketing_slogan`,
  `ALTER TABLE _model_bundles_v_locales DROP COLUMN IF EXISTS version_hero_marketing_subtitle`,
  `ALTER TABLE _model_bundles_v_locales DROP COLUMN IF EXISTS version_hero_marketing_title`,
  `ALTER TABLE _model_bundles_v_locales DROP COLUMN IF EXISTS version_hero_marketing_eyebrow`,
  `ALTER TABLE model_bundles_locales DROP COLUMN IF EXISTS hero_marketing_selling_point_three`,
  `ALTER TABLE model_bundles_locales DROP COLUMN IF EXISTS hero_marketing_selling_point_two`,
  `ALTER TABLE model_bundles_locales DROP COLUMN IF EXISTS hero_marketing_selling_point_one`,
  `ALTER TABLE model_bundles_locales DROP COLUMN IF EXISTS hero_marketing_slogan`,
  `ALTER TABLE model_bundles_locales DROP COLUMN IF EXISTS hero_marketing_subtitle`,
  `ALTER TABLE model_bundles_locales DROP COLUMN IF EXISTS hero_marketing_title`,
  `ALTER TABLE model_bundles_locales DROP COLUMN IF EXISTS hero_marketing_eyebrow`,
]

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await executeStatements(db, upStatements)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await executeStatements(db, downStatements)
}
