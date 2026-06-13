import { type MigrateDownArgs, type MigrateUpArgs, executeStatements } from '../lib/migrations/postgresUtils'

const upStatements = [
  `ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS subscription_plans_starter_yearly_price numeric DEFAULT 182.4`,
  `ALTER TABLE site_settings ALTER COLUMN subscription_plans_starter_yearly_price SET DEFAULT 182.4`,
  `UPDATE site_settings SET subscription_plans_starter_yearly_price = 182.4 WHERE subscription_plans_starter_yearly_price IS NULL`,
  `ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS subscription_plans_pro_yearly_price numeric DEFAULT 470.4`,
  `ALTER TABLE site_settings ALTER COLUMN subscription_plans_pro_yearly_price SET DEFAULT 470.4`,
  `UPDATE site_settings SET subscription_plans_pro_yearly_price = 470.4 WHERE subscription_plans_pro_yearly_price IS NULL`,
  `ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS subscription_plans_studio_yearly_price numeric DEFAULT 950.4`,
  `ALTER TABLE site_settings ALTER COLUMN subscription_plans_studio_yearly_price SET DEFAULT 950.4`,
  `UPDATE site_settings SET subscription_plans_studio_yearly_price = 950.4 WHERE subscription_plans_studio_yearly_price IS NULL`,
  `
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_billing_checkouts_billing_cycle') THEN
        CREATE TYPE enum_billing_checkouts_billing_cycle AS ENUM ('monthly', 'yearly');
      END IF;
    END
    $$;
  `,
  `
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_billing_checkouts_status') THEN
        CREATE TYPE enum_billing_checkouts_status AS ENUM ('open', 'completed', 'expired', 'failed');
      END IF;
    END
    $$;
  `,
  `
    CREATE TABLE IF NOT EXISTS billing_checkouts (
      id serial PRIMARY KEY,
      user_id integer NOT NULL REFERENCES users(id) ON DELETE SET NULL,
      plan_key varchar NOT NULL,
      billing_cycle enum_billing_checkouts_billing_cycle DEFAULT 'monthly' NOT NULL,
      status enum_billing_checkouts_status DEFAULT 'open' NOT NULL,
      open_lock_key varchar,
      stripe_checkout_session_id varchar,
      stripe_customer_id varchar,
      stripe_price_id varchar,
      checkout_url varchar,
      expires_at timestamp(3) with time zone,
      completed_at timestamp(3) with time zone,
      failed_reason varchar,
      metadata jsonb,
      updated_at timestamp(3) with time zone DEFAULT now() NOT NULL,
      created_at timestamp(3) with time zone DEFAULT now() NOT NULL
    )
  `,
  `CREATE INDEX IF NOT EXISTS billing_checkouts_user_idx ON billing_checkouts(user_id)`,
  `CREATE INDEX IF NOT EXISTS billing_checkouts_status_idx ON billing_checkouts(status)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS billing_checkouts_open_lock_key_idx ON billing_checkouts(open_lock_key)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS billing_checkouts_stripe_checkout_session_id_idx ON billing_checkouts(stripe_checkout_session_id)`,
  `CREATE INDEX IF NOT EXISTS billing_checkouts_expires_at_idx ON billing_checkouts(expires_at)`,
  `CREATE INDEX IF NOT EXISTS billing_checkouts_updated_at_idx ON billing_checkouts(updated_at)`,
  `CREATE INDEX IF NOT EXISTS billing_checkouts_created_at_idx ON billing_checkouts(created_at)`,
  `ALTER TABLE payload_locked_documents_rels ADD COLUMN IF NOT EXISTS billing_checkouts_id integer`,
  `CREATE INDEX IF NOT EXISTS payload_locked_documents_rels_billing_checkouts_id_idx ON payload_locked_documents_rels(billing_checkouts_id)`,
  `
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'payload_locked_documents_rels_billing_checkouts_fk'
      ) THEN
        ALTER TABLE payload_locked_documents_rels
          ADD CONSTRAINT payload_locked_documents_rels_billing_checkouts_fk
          FOREIGN KEY (billing_checkouts_id)
          REFERENCES billing_checkouts(id)
          ON DELETE CASCADE;
      END IF;
    END
    $$;
  `,
]

const downStatements = [
  `ALTER TABLE payload_locked_documents_rels DROP CONSTRAINT IF EXISTS payload_locked_documents_rels_billing_checkouts_fk`,
  `DROP INDEX IF EXISTS payload_locked_documents_rels_billing_checkouts_id_idx`,
  `ALTER TABLE payload_locked_documents_rels DROP COLUMN IF EXISTS billing_checkouts_id`,
  `DROP TABLE IF EXISTS billing_checkouts`,
  `DROP TYPE IF EXISTS enum_billing_checkouts_status`,
  `DROP TYPE IF EXISTS enum_billing_checkouts_billing_cycle`,
  `ALTER TABLE site_settings DROP COLUMN IF EXISTS subscription_plans_studio_yearly_price`,
  `ALTER TABLE site_settings DROP COLUMN IF EXISTS subscription_plans_pro_yearly_price`,
  `ALTER TABLE site_settings DROP COLUMN IF EXISTS subscription_plans_starter_yearly_price`,
]

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await executeStatements(db, upStatements)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await executeStatements(db, downStatements)
}
