import { type MigrateDownArgs, type MigrateUpArgs, executeStatements } from '../lib/migrations/postgresUtils'

const upStatements = [
  `
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_generation_tasks_task_type') THEN
        CREATE TYPE enum_generation_tasks_task_type AS ENUM ('model-generation', 'image-generation');
      END IF;
    END
    $$;
  `,
  `ALTER TABLE generation_tasks ADD COLUMN IF NOT EXISTS task_type enum_generation_tasks_task_type DEFAULT 'model-generation'`,
  `
    UPDATE generation_tasks
    SET task_type = 'image-generation'
    WHERE task_type IS DISTINCT FROM 'image-generation'
      AND (
        task_code LIKE 'IMG-%'
        OR provider IN ('gemini-official', 'gemini-third-party', 'openai-compatible')
        OR parameter_snapshot->'imageGeneration'->>'taskType' = 'image-generation'
      )
  `,
  `UPDATE generation_tasks SET task_type = 'model-generation' WHERE task_type IS NULL`,
  `ALTER TABLE generation_tasks ALTER COLUMN task_type SET DEFAULT 'model-generation'`,
  `ALTER TABLE generation_tasks ALTER COLUMN task_type SET NOT NULL`,
  `ALTER TABLE ai_provider_settings ADD COLUMN IF NOT EXISTS image_generation_default_prompt varchar`,
]

const downStatements = [
  `ALTER TABLE ai_provider_settings DROP COLUMN IF EXISTS image_generation_default_prompt`,
  `ALTER TABLE generation_tasks DROP COLUMN IF EXISTS task_type`,
  `DROP TYPE IF EXISTS enum_generation_tasks_task_type`,
]

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await executeStatements(db, upStatements)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await executeStatements(db, downStatements)
}
