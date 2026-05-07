import { type MigrateDownArgs, type MigrateUpArgs, executeStatements } from '../lib/migrations/postgresUtils'

const upStatements = [
  `ALTER TABLE model_bundles ADD COLUMN IF NOT EXISTS hero_image_id integer`,
  `ALTER TABLE _model_bundles_v ADD COLUMN IF NOT EXISTS version_hero_image_id integer`,
  `CREATE INDEX IF NOT EXISTS model_bundles_hero_image_idx ON model_bundles(hero_image_id)`,
  `CREATE INDEX IF NOT EXISTS _model_bundles_v_version_hero_image_idx ON _model_bundles_v(version_hero_image_id)`,
  `
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'model_bundles_hero_image_fk'
      ) THEN
        ALTER TABLE model_bundles
          ADD CONSTRAINT model_bundles_hero_image_fk
          FOREIGN KEY (hero_image_id)
          REFERENCES media(id)
          ON DELETE SET NULL;
      END IF;
    END
    $$;
  `,
  `
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = '_model_bundles_v_version_hero_image_fk'
      ) THEN
        ALTER TABLE _model_bundles_v
          ADD CONSTRAINT _model_bundles_v_version_hero_image_fk
          FOREIGN KEY (version_hero_image_id)
          REFERENCES media(id)
          ON DELETE SET NULL;
      END IF;
    END
    $$;
  `,
]

const downStatements = [
  `ALTER TABLE _model_bundles_v DROP CONSTRAINT IF EXISTS _model_bundles_v_version_hero_image_fk`,
  `ALTER TABLE model_bundles DROP CONSTRAINT IF EXISTS model_bundles_hero_image_fk`,
  `DROP INDEX IF EXISTS _model_bundles_v_version_hero_image_idx`,
  `DROP INDEX IF EXISTS model_bundles_hero_image_idx`,
  `ALTER TABLE _model_bundles_v DROP COLUMN IF EXISTS version_hero_image_id`,
  `ALTER TABLE model_bundles DROP COLUMN IF EXISTS hero_image_id`,
]

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await executeStatements(db, upStatements)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await executeStatements(db, downStatements)
}
