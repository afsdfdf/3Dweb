import { type MigrateDownArgs, type MigrateUpArgs, executeStatements } from '../lib/migrations/postgresUtils'

const upStatements = [
  `
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_user_notifications_type') THEN
        CREATE TYPE enum_user_notifications_type AS ENUM (
          'generation_completed',
          'generation_failed',
          'order_paid',
          'order_status',
          'credits_purchased',
          'credits_adjusted',
          'subscription_credits',
          'system_notice'
        );
      END IF;
    END
    $$;
  `,
  `
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_user_notifications_severity') THEN
        CREATE TYPE enum_user_notifications_severity AS ENUM ('info', 'success', 'warning', 'critical');
      END IF;
    END
    $$;
  `,
  `
    CREATE TABLE IF NOT EXISTS user_notifications (
      id serial PRIMARY KEY,
      user_id integer NOT NULL REFERENCES users(id) ON DELETE SET NULL,
      type enum_user_notifications_type NOT NULL,
      title varchar NOT NULL,
      body varchar NOT NULL,
      href varchar,
      severity enum_user_notifications_severity DEFAULT 'info' NOT NULL,
      read_at timestamp(3) with time zone,
      source_key varchar,
      source_task_id integer REFERENCES generation_tasks(id) ON DELETE SET NULL,
      source_order_id integer REFERENCES print_orders(id) ON DELETE SET NULL,
      metadata jsonb,
      updated_at timestamp(3) with time zone DEFAULT now() NOT NULL,
      created_at timestamp(3) with time zone DEFAULT now() NOT NULL
    )
  `,
  'CREATE INDEX IF NOT EXISTS user_notifications_user_idx ON user_notifications(user_id)',
  'CREATE INDEX IF NOT EXISTS user_notifications_read_at_idx ON user_notifications(read_at)',
  'CREATE UNIQUE INDEX IF NOT EXISTS user_notifications_source_key_idx ON user_notifications(source_key)',
  'CREATE INDEX IF NOT EXISTS user_notifications_source_task_idx ON user_notifications(source_task_id)',
  'CREATE INDEX IF NOT EXISTS user_notifications_source_order_idx ON user_notifications(source_order_id)',
  'CREATE INDEX IF NOT EXISTS user_notifications_updated_at_idx ON user_notifications(updated_at)',
  'CREATE INDEX IF NOT EXISTS user_notifications_created_at_idx ON user_notifications(created_at)',
  'ALTER TABLE payload_locked_documents_rels ADD COLUMN IF NOT EXISTS user_notifications_id integer',
  'CREATE INDEX IF NOT EXISTS payload_locked_documents_rels_user_notifications_id_idx ON payload_locked_documents_rels(user_notifications_id)',
  `
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'payload_locked_documents_rels_user_notifications_fk'
      ) THEN
        ALTER TABLE payload_locked_documents_rels
          ADD CONSTRAINT payload_locked_documents_rels_user_notifications_fk
          FOREIGN KEY (user_notifications_id)
          REFERENCES user_notifications(id)
          ON DELETE CASCADE;
      END IF;
    END
    $$;
  `,
]

const downStatements = [
  'ALTER TABLE payload_locked_documents_rels DROP CONSTRAINT IF EXISTS payload_locked_documents_rels_user_notifications_fk',
  'DROP INDEX IF EXISTS payload_locked_documents_rels_user_notifications_id_idx',
  'ALTER TABLE payload_locked_documents_rels DROP COLUMN IF EXISTS user_notifications_id',
  'DROP TABLE IF EXISTS user_notifications',
  'DROP TYPE IF EXISTS enum_user_notifications_severity',
  'DROP TYPE IF EXISTS enum_user_notifications_type',
]

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await executeStatements(db, upStatements)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await executeStatements(db, downStatements)
}
