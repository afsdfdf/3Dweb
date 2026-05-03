import { type MigrateDownArgs, type MigrateUpArgs, executeStatements } from '../lib/migrations/postgresUtils'

const upStatements = [
  `
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_email_verification_codes_purpose') THEN
        CREATE TYPE enum_email_verification_codes_purpose AS ENUM ('register');
      END IF;
    END
    $$;
  `,
  `
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_security_settings_registration_verification_mode') THEN
        CREATE TYPE enum_security_settings_registration_verification_mode AS ENUM ('email-code', 'email-link');
      END IF;
    END
    $$;
  `,
  `
    CREATE TABLE IF NOT EXISTS email_verification_codes (
      id serial PRIMARY KEY,
      email varchar NOT NULL,
      purpose enum_email_verification_codes_purpose DEFAULT 'register' NOT NULL,
      code_hash varchar NOT NULL,
      expires_at timestamp(3) with time zone NOT NULL,
      consumed_at timestamp(3) with time zone,
      attempts numeric DEFAULT 0 NOT NULL,
      updated_at timestamp(3) with time zone DEFAULT now() NOT NULL,
      created_at timestamp(3) with time zone DEFAULT now() NOT NULL
    )
  `,
  `CREATE INDEX IF NOT EXISTS email_verification_codes_email_idx ON email_verification_codes(email)`,
  `CREATE INDEX IF NOT EXISTS email_verification_codes_purpose_idx ON email_verification_codes(purpose)`,
  `CREATE INDEX IF NOT EXISTS email_verification_codes_expires_at_idx ON email_verification_codes(expires_at)`,
  `CREATE INDEX IF NOT EXISTS email_verification_codes_consumed_at_idx ON email_verification_codes(consumed_at)`,
  `CREATE INDEX IF NOT EXISTS email_verification_codes_updated_at_idx ON email_verification_codes(updated_at)`,
  `CREATE INDEX IF NOT EXISTS email_verification_codes_created_at_idx ON email_verification_codes(created_at)`,
  `
    ALTER TABLE security_settings
      ADD COLUMN IF NOT EXISTS registration_verification_mode enum_security_settings_registration_verification_mode DEFAULT 'email-code'
  `,
  `
    ALTER TABLE security_settings
      ADD COLUMN IF NOT EXISTS registration_code_expires_minutes numeric DEFAULT 10
  `,
  `ALTER TABLE payload_locked_documents_rels ADD COLUMN IF NOT EXISTS email_verification_codes_id integer`,
  `CREATE INDEX IF NOT EXISTS payload_locked_documents_rels_email_verification_codes_i_idx ON payload_locked_documents_rels(email_verification_codes_id)`,
  `
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'payload_locked_documents_rels_email_verification_codes_fk'
      ) THEN
        ALTER TABLE payload_locked_documents_rels
          ADD CONSTRAINT payload_locked_documents_rels_email_verification_codes_fk
          FOREIGN KEY (email_verification_codes_id)
          REFERENCES email_verification_codes(id)
          ON DELETE CASCADE;
      END IF;
    END
    $$;
  `,
]

const downStatements = [
  `ALTER TABLE payload_locked_documents_rels DROP CONSTRAINT IF EXISTS payload_locked_documents_rels_email_verification_codes_fk`,
  `DROP INDEX IF EXISTS payload_locked_documents_rels_email_verification_codes_i_idx`,
  `ALTER TABLE payload_locked_documents_rels DROP COLUMN IF EXISTS email_verification_codes_id`,
  `ALTER TABLE security_settings DROP COLUMN IF EXISTS registration_code_expires_minutes`,
  `ALTER TABLE security_settings DROP COLUMN IF EXISTS registration_verification_mode`,
  `DROP TABLE IF EXISTS email_verification_codes`,
  `DROP TYPE IF EXISTS enum_security_settings_registration_verification_mode`,
  `DROP TYPE IF EXISTS enum_email_verification_codes_purpose`,
]

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await executeStatements(db, upStatements)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await executeStatements(db, downStatements)
}

