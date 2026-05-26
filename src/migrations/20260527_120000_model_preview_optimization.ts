import { type MigrateDownArgs, type MigrateUpArgs, executeStatements } from '../lib/migrations/postgresUtils'

const upStatements = [
  `
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_models_viewer_optimization_status') THEN
        CREATE TYPE enum_models_viewer_optimization_status AS ENUM (
          'none',
          'pending',
          'running',
          'succeeded',
          'failed',
          'skipped'
        );
      END IF;
    END
    $$;
  `,
  `
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_models_viewer_optimization_mode') THEN
        CREATE TYPE enum_models_viewer_optimization_mode AS ENUM ('conservative', 'small');
      END IF;
    END
    $$;
  `,
  `
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_model_optimization_jobs_status') THEN
        CREATE TYPE enum_model_optimization_jobs_status AS ENUM (
          'pending',
          'running',
          'succeeded',
          'failed',
          'skipped'
        );
      END IF;
    END
    $$;
  `,
  `
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_model_optimization_jobs_mode') THEN
        CREATE TYPE enum_model_optimization_jobs_mode AS ENUM ('conservative', 'small');
      END IF;
    END
    $$;
  `,
  `ALTER TABLE models ADD COLUMN IF NOT EXISTS viewer_optimization_status enum_models_viewer_optimization_status DEFAULT 'none'`,
  `ALTER TABLE models ADD COLUMN IF NOT EXISTS viewer_optimization_mode enum_models_viewer_optimization_mode`,
  `ALTER TABLE models ADD COLUMN IF NOT EXISTS viewer_optimization_source_file_id integer`,
  `ALTER TABLE models ADD COLUMN IF NOT EXISTS viewer_optimization_preview_file_id integer`,
  `ALTER TABLE models ADD COLUMN IF NOT EXISTS viewer_optimization_source_size_mb numeric`,
  `ALTER TABLE models ADD COLUMN IF NOT EXISTS viewer_optimization_output_size_mb numeric`,
  `ALTER TABLE models ADD COLUMN IF NOT EXISTS viewer_optimization_reduction_percent numeric`,
  `ALTER TABLE models ADD COLUMN IF NOT EXISTS viewer_optimization_attempts numeric DEFAULT 0`,
  `ALTER TABLE models ADD COLUMN IF NOT EXISTS viewer_optimization_last_error varchar`,
  `ALTER TABLE models ADD COLUMN IF NOT EXISTS viewer_optimization_started_at timestamp(3) with time zone`,
  `ALTER TABLE models ADD COLUMN IF NOT EXISTS viewer_optimization_completed_at timestamp(3) with time zone`,
  `
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'models_viewer_optimization_source_file_fk'
      ) THEN
        ALTER TABLE models
          ADD CONSTRAINT models_viewer_optimization_source_file_fk
          FOREIGN KEY (viewer_optimization_source_file_id)
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
        SELECT 1 FROM pg_constraint WHERE conname = 'models_viewer_optimization_preview_file_fk'
      ) THEN
        ALTER TABLE models
          ADD CONSTRAINT models_viewer_optimization_preview_file_fk
          FOREIGN KEY (viewer_optimization_preview_file_id)
          REFERENCES media(id)
          ON DELETE SET NULL;
      END IF;
    END
    $$;
  `,
  'CREATE INDEX IF NOT EXISTS models_viewer_optimization_source_file_idx ON models(viewer_optimization_source_file_id)',
  'CREATE INDEX IF NOT EXISTS models_viewer_optimization_preview_file_idx ON models(viewer_optimization_preview_file_id)',
  `
    CREATE INDEX IF NOT EXISTS models_viewer_optimization_status_idx
    ON models(viewer_optimization_status)
    WHERE viewer_optimization_status IN ('pending', 'running', 'failed')
  `,
  `
    CREATE TABLE IF NOT EXISTS model_optimization_jobs (
      id serial PRIMARY KEY,
      job_key varchar NOT NULL,
      model_id integer NOT NULL REFERENCES models(id) ON DELETE SET NULL,
      source_file_id integer NOT NULL REFERENCES media(id) ON DELETE SET NULL,
      output_file_id integer REFERENCES media(id) ON DELETE SET NULL,
      status enum_model_optimization_jobs_status DEFAULT 'pending' NOT NULL,
      mode enum_model_optimization_jobs_mode DEFAULT 'conservative' NOT NULL,
      attempts numeric DEFAULT 0,
      source_url varchar,
      output_path varchar,
      output_url varchar,
      source_size_mb numeric,
      output_size_mb numeric,
      reduction_percent numeric,
      worker_run_id varchar,
      lease_owner varchar,
      lease_expires_at timestamp(3) with time zone,
      started_at timestamp(3) with time zone,
      completed_at timestamp(3) with time zone,
      last_error varchar,
      metrics jsonb,
      updated_at timestamp(3) with time zone DEFAULT now() NOT NULL,
      created_at timestamp(3) with time zone DEFAULT now() NOT NULL
    )
  `,
  'CREATE UNIQUE INDEX IF NOT EXISTS model_optimization_jobs_job_key_idx ON model_optimization_jobs(job_key)',
  'CREATE INDEX IF NOT EXISTS model_optimization_jobs_model_idx ON model_optimization_jobs(model_id)',
  'CREATE INDEX IF NOT EXISTS model_optimization_jobs_source_file_idx ON model_optimization_jobs(source_file_id)',
  'CREATE INDEX IF NOT EXISTS model_optimization_jobs_output_file_idx ON model_optimization_jobs(output_file_id)',
  'CREATE INDEX IF NOT EXISTS model_optimization_jobs_status_idx ON model_optimization_jobs(status)',
  'CREATE INDEX IF NOT EXISTS model_optimization_jobs_worker_run_id_idx ON model_optimization_jobs(worker_run_id)',
  'CREATE INDEX IF NOT EXISTS model_optimization_jobs_lease_expires_at_idx ON model_optimization_jobs(lease_expires_at)',
  'CREATE INDEX IF NOT EXISTS model_optimization_jobs_updated_at_idx ON model_optimization_jobs(updated_at)',
  'CREATE INDEX IF NOT EXISTS model_optimization_jobs_created_at_idx ON model_optimization_jobs(created_at)',
  `
    CREATE INDEX IF NOT EXISTS model_optimization_jobs_pending_status_idx
    ON model_optimization_jobs(status, updated_at)
    WHERE status IN ('pending', 'running')
  `,
  `
    CREATE INDEX IF NOT EXISTS model_optimization_jobs_active_lease_idx
    ON model_optimization_jobs(status, lease_expires_at)
    WHERE status = 'running'
  `,
  'ALTER TABLE payload_locked_documents_rels ADD COLUMN IF NOT EXISTS model_optimization_jobs_id integer',
  'CREATE INDEX IF NOT EXISTS payload_locked_documents_rels_model_optimization_jobs_id_idx ON payload_locked_documents_rels(model_optimization_jobs_id)',
  `
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'payload_locked_documents_rels_model_optimization_jobs_fk'
      ) THEN
        ALTER TABLE payload_locked_documents_rels
          ADD CONSTRAINT payload_locked_documents_rels_model_optimization_jobs_fk
          FOREIGN KEY (model_optimization_jobs_id)
          REFERENCES model_optimization_jobs(id)
          ON DELETE CASCADE;
      END IF;
    END
    $$;
  `,
]

const downStatements = [
  'ALTER TABLE payload_locked_documents_rels DROP CONSTRAINT IF EXISTS payload_locked_documents_rels_model_optimization_jobs_fk',
  'DROP INDEX IF EXISTS payload_locked_documents_rels_model_optimization_jobs_id_idx',
  'ALTER TABLE payload_locked_documents_rels DROP COLUMN IF EXISTS model_optimization_jobs_id',
  'DROP INDEX IF EXISTS model_optimization_jobs_active_lease_idx',
  'DROP INDEX IF EXISTS model_optimization_jobs_pending_status_idx',
  'DROP TABLE IF EXISTS model_optimization_jobs',
  'DROP INDEX IF EXISTS models_viewer_optimization_status_idx',
  'DROP INDEX IF EXISTS models_viewer_optimization_preview_file_idx',
  'DROP INDEX IF EXISTS models_viewer_optimization_source_file_idx',
  'ALTER TABLE models DROP CONSTRAINT IF EXISTS models_viewer_optimization_preview_file_fk',
  'ALTER TABLE models DROP CONSTRAINT IF EXISTS models_viewer_optimization_source_file_fk',
  'ALTER TABLE models DROP COLUMN IF EXISTS viewer_optimization_completed_at',
  'ALTER TABLE models DROP COLUMN IF EXISTS viewer_optimization_started_at',
  'ALTER TABLE models DROP COLUMN IF EXISTS viewer_optimization_last_error',
  'ALTER TABLE models DROP COLUMN IF EXISTS viewer_optimization_attempts',
  'ALTER TABLE models DROP COLUMN IF EXISTS viewer_optimization_reduction_percent',
  'ALTER TABLE models DROP COLUMN IF EXISTS viewer_optimization_output_size_mb',
  'ALTER TABLE models DROP COLUMN IF EXISTS viewer_optimization_source_size_mb',
  'ALTER TABLE models DROP COLUMN IF EXISTS viewer_optimization_preview_file_id',
  'ALTER TABLE models DROP COLUMN IF EXISTS viewer_optimization_source_file_id',
  'ALTER TABLE models DROP COLUMN IF EXISTS viewer_optimization_mode',
  'ALTER TABLE models DROP COLUMN IF EXISTS viewer_optimization_status',
  'DROP TYPE IF EXISTS enum_model_optimization_jobs_mode',
  'DROP TYPE IF EXISTS enum_model_optimization_jobs_status',
  'DROP TYPE IF EXISTS enum_models_viewer_optimization_mode',
  'DROP TYPE IF EXISTS enum_models_viewer_optimization_status',
]

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await executeStatements(db, upStatements)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await executeStatements(db, downStatements)
}
