import { type MigrateDownArgs, type MigrateUpArgs, executeStatements } from '../lib/migrations/postgresUtils'

const upStatements = [
  `
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_ai_provider_settings_meshy_api_key_mode') THEN
        CREATE TYPE enum_ai_provider_settings_meshy_api_key_mode AS ENUM ('environment', 'payload');
      END IF;
    END
    $$;
  `,
  `
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_ai_provider_settings_meshy_model_type') THEN
        CREATE TYPE enum_ai_provider_settings_meshy_model_type AS ENUM ('standard', 'lowpoly');
      END IF;
    END
    $$;
  `,
  `
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_ai_provider_settings_meshy_topology') THEN
        CREATE TYPE enum_ai_provider_settings_meshy_topology AS ENUM ('triangle', 'quad');
      END IF;
    END
    $$;
  `,
  `
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_ai_provider_settings_meshy_target_formats') THEN
        CREATE TYPE enum_ai_provider_settings_meshy_target_formats AS ENUM ('glb', 'obj', 'fbx', 'stl', 'usdz', '3mf');
      END IF;
    END
    $$;
  `,
  `ALTER TABLE ai_provider_settings ADD COLUMN IF NOT EXISTS meshy_api_key_mode enum_ai_provider_settings_meshy_api_key_mode DEFAULT 'environment'`,
  `ALTER TABLE ai_provider_settings ADD COLUMN IF NOT EXISTS meshy_api_key varchar`,
  `ALTER TABLE ai_provider_settings ADD COLUMN IF NOT EXISTS meshy_hd_texture boolean DEFAULT false`,
  `ALTER TABLE ai_provider_settings ADD COLUMN IF NOT EXISTS meshy_multi_image_enabled boolean DEFAULT true`,
  `ALTER TABLE ai_provider_settings ADD COLUMN IF NOT EXISTS meshy_pricing_text_to3_d_credits numeric DEFAULT 30`,
  `ALTER TABLE ai_provider_settings ADD COLUMN IF NOT EXISTS meshy_pricing_image_to3_d_credits numeric DEFAULT 30`,
  `ALTER TABLE ai_provider_settings ADD COLUMN IF NOT EXISTS meshy_pricing_multi_image_to3_d_credits numeric DEFAULT 30`,
  `ALTER TABLE ai_provider_settings ADD COLUMN IF NOT EXISTS meshy_model_type enum_ai_provider_settings_meshy_model_type DEFAULT 'standard'`,
  `ALTER TABLE ai_provider_settings ADD COLUMN IF NOT EXISTS meshy_topology enum_ai_provider_settings_meshy_topology DEFAULT 'triangle'`,
  `ALTER TABLE ai_provider_settings ADD COLUMN IF NOT EXISTS meshy_target_polycount numeric DEFAULT 30000`,
  `
    CREATE TABLE IF NOT EXISTS ai_provider_settings_meshy_target_formats (
      "order" integer NOT NULL,
      parent_id integer NOT NULL,
      value enum_ai_provider_settings_meshy_target_formats,
      id serial PRIMARY KEY,
      CONSTRAINT ai_provider_settings_meshy_target_formats_parent_fk
        FOREIGN KEY (parent_id)
        REFERENCES ai_provider_settings(id)
        ON DELETE CASCADE
    )
  `,
  `CREATE INDEX IF NOT EXISTS ai_provider_settings_meshy_target_formats_order_idx ON ai_provider_settings_meshy_target_formats("order")`,
  `CREATE INDEX IF NOT EXISTS ai_provider_settings_meshy_target_formats_parent_idx ON ai_provider_settings_meshy_target_formats(parent_id)`,
]

const downStatements = [
  `DROP TABLE IF EXISTS ai_provider_settings_meshy_target_formats`,
  `ALTER TABLE ai_provider_settings DROP COLUMN IF EXISTS meshy_target_polycount`,
  `ALTER TABLE ai_provider_settings DROP COLUMN IF EXISTS meshy_topology`,
  `ALTER TABLE ai_provider_settings DROP COLUMN IF EXISTS meshy_model_type`,
  `ALTER TABLE ai_provider_settings DROP COLUMN IF EXISTS meshy_pricing_multi_image_to3_d_credits`,
  `ALTER TABLE ai_provider_settings DROP COLUMN IF EXISTS meshy_pricing_image_to3_d_credits`,
  `ALTER TABLE ai_provider_settings DROP COLUMN IF EXISTS meshy_pricing_text_to3_d_credits`,
  `ALTER TABLE ai_provider_settings DROP COLUMN IF EXISTS meshy_multi_image_enabled`,
  `ALTER TABLE ai_provider_settings DROP COLUMN IF EXISTS meshy_hd_texture`,
  `ALTER TABLE ai_provider_settings DROP COLUMN IF EXISTS meshy_api_key`,
  `ALTER TABLE ai_provider_settings DROP COLUMN IF EXISTS meshy_api_key_mode`,
  `DROP TYPE IF EXISTS enum_ai_provider_settings_meshy_target_formats`,
  `DROP TYPE IF EXISTS enum_ai_provider_settings_meshy_topology`,
  `DROP TYPE IF EXISTS enum_ai_provider_settings_meshy_model_type`,
  `DROP TYPE IF EXISTS enum_ai_provider_settings_meshy_api_key_mode`,
]

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await executeStatements(db, upStatements)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await executeStatements(db, downStatements)
}
