import { type MigrateDownArgs, type MigrateUpArgs, executeStatements } from '../lib/migrations/postgresUtils'

const footerLogoAlt = 'Thorns Tavern'
const footerBrandSummary =
  'An AI 3D product platform for character creation, asset management, and print fulfillment.'

const quote = (value: string) => value.replace(/'/g, "''")

const upStatements = [
  `ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS footer_brand_logo_id integer`,
  `ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS footer_brand_logo_alt varchar DEFAULT '${quote(footerLogoAlt)}'`,
  `ALTER TABLE site_settings ALTER COLUMN footer_brand_logo_alt SET DEFAULT '${quote(footerLogoAlt)}'`,
  `UPDATE site_settings SET footer_brand_logo_alt = '${quote(footerLogoAlt)}' WHERE footer_brand_logo_alt IS NULL`,
  `ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS footer_brand_summary varchar DEFAULT '${quote(footerBrandSummary)}'`,
  `ALTER TABLE site_settings ALTER COLUMN footer_brand_summary SET DEFAULT '${quote(footerBrandSummary)}'`,
  `UPDATE site_settings SET footer_brand_summary = '${quote(footerBrandSummary)}' WHERE footer_brand_summary IS NULL`,
  `CREATE INDEX IF NOT EXISTS site_settings_footer_footer_brand_logo_idx ON site_settings(footer_brand_logo_id)`,
  `
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'site_settings_footer_brand_logo_fk'
      ) THEN
        ALTER TABLE site_settings
          ADD CONSTRAINT site_settings_footer_brand_logo_fk
          FOREIGN KEY (footer_brand_logo_id)
          REFERENCES media(id)
          ON DELETE SET NULL;
      END IF;
    END
    $$;
  `,
]

const downStatements = [
  `ALTER TABLE site_settings DROP CONSTRAINT IF EXISTS site_settings_footer_brand_logo_fk`,
  `DROP INDEX IF EXISTS site_settings_footer_footer_brand_logo_idx`,
  `ALTER TABLE site_settings DROP COLUMN IF EXISTS footer_brand_logo_id`,
  `ALTER TABLE site_settings DROP COLUMN IF EXISTS footer_brand_logo_alt`,
  `ALTER TABLE site_settings DROP COLUMN IF EXISTS footer_brand_summary`,
]

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await executeStatements(db, upStatements)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await executeStatements(db, downStatements)
}
