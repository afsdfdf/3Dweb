import { type MigrateDownArgs, type MigrateUpArgs, executeStatements } from '../lib/migrations/postgresUtils'

const defaults = {
  buttonAriaLabel: 'Open subscription offers',
  buttonLabel: 'SUB',
  eyebrow: 'NEW USER',
  offerText: '30% OFF',
}

const quote = (value: string) => value.replace(/'/g, "''")

const upStatements = [
  `ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS navigation_promotion_enabled boolean DEFAULT true`,
  `ALTER TABLE site_settings ALTER COLUMN navigation_promotion_enabled SET DEFAULT true`,
  `UPDATE site_settings SET navigation_promotion_enabled = true WHERE navigation_promotion_enabled IS NULL`,
  `ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS navigation_promotion_eyebrow varchar DEFAULT '${quote(defaults.eyebrow)}'`,
  `ALTER TABLE site_settings ALTER COLUMN navigation_promotion_eyebrow SET DEFAULT '${quote(defaults.eyebrow)}'`,
  `UPDATE site_settings SET navigation_promotion_eyebrow = '${quote(defaults.eyebrow)}' WHERE navigation_promotion_eyebrow IS NULL`,
  `ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS navigation_promotion_offer_text varchar DEFAULT '${quote(defaults.offerText)}'`,
  `ALTER TABLE site_settings ALTER COLUMN navigation_promotion_offer_text SET DEFAULT '${quote(defaults.offerText)}'`,
  `UPDATE site_settings SET navigation_promotion_offer_text = '${quote(defaults.offerText)}' WHERE navigation_promotion_offer_text IS NULL`,
  `ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS navigation_promotion_button_label varchar DEFAULT '${quote(defaults.buttonLabel)}'`,
  `ALTER TABLE site_settings ALTER COLUMN navigation_promotion_button_label SET DEFAULT '${quote(defaults.buttonLabel)}'`,
  `UPDATE site_settings SET navigation_promotion_button_label = '${quote(defaults.buttonLabel)}' WHERE navigation_promotion_button_label IS NULL`,
  `ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS navigation_promotion_button_aria_label varchar DEFAULT '${quote(defaults.buttonAriaLabel)}'`,
  `ALTER TABLE site_settings ALTER COLUMN navigation_promotion_button_aria_label SET DEFAULT '${quote(defaults.buttonAriaLabel)}'`,
  `UPDATE site_settings SET navigation_promotion_button_aria_label = '${quote(defaults.buttonAriaLabel)}' WHERE navigation_promotion_button_aria_label IS NULL`,
]

const downStatements = [
  `ALTER TABLE site_settings DROP COLUMN IF EXISTS navigation_promotion_button_aria_label`,
  `ALTER TABLE site_settings DROP COLUMN IF EXISTS navigation_promotion_button_label`,
  `ALTER TABLE site_settings DROP COLUMN IF EXISTS navigation_promotion_offer_text`,
  `ALTER TABLE site_settings DROP COLUMN IF EXISTS navigation_promotion_eyebrow`,
  `ALTER TABLE site_settings DROP COLUMN IF EXISTS navigation_promotion_enabled`,
]

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await executeStatements(db, upStatements)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await executeStatements(db, downStatements)
}
