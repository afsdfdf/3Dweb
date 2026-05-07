import { type MigrateDownArgs, type MigrateUpArgs, executeStatements } from '../lib/migrations/postgresUtils'

const bundleTypeValues = "'starter', 'theme-pack', 'character-pack', 'terrain-pack', 'event-pack', 'monthly-release', 'showcase'"
const licenseTypeValues = "'personal', 'commercial', 'editorial', 'custom'"
const ctaModeValues = "'free', 'login-required', 'paid', 'coming-soon'"

const upStatements = [
  `
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_model_bundles_bundle_type') THEN
        EXECUTE $ddl$CREATE TYPE enum_model_bundles_bundle_type AS ENUM (${bundleTypeValues})$ddl$;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_model_bundles_license_type') THEN
        EXECUTE $ddl$CREATE TYPE enum_model_bundles_license_type AS ENUM (${licenseTypeValues})$ddl$;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_model_bundles_cta_mode') THEN
        EXECUTE $ddl$CREATE TYPE enum_model_bundles_cta_mode AS ENUM (${ctaModeValues})$ddl$;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum__model_bundles_v_version_bundle_type') THEN
        EXECUTE $ddl$CREATE TYPE enum__model_bundles_v_version_bundle_type AS ENUM (${bundleTypeValues})$ddl$;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum__model_bundles_v_version_license_type') THEN
        EXECUTE $ddl$CREATE TYPE enum__model_bundles_v_version_license_type AS ENUM (${licenseTypeValues})$ddl$;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum__model_bundles_v_version_cta_mode') THEN
        EXECUTE $ddl$CREATE TYPE enum__model_bundles_v_version_cta_mode AS ENUM (${ctaModeValues})$ddl$;
      END IF;
    END
    $$;
  `,
  `ALTER TABLE model_bundles ADD COLUMN IF NOT EXISTS bundle_type enum_model_bundles_bundle_type DEFAULT 'theme-pack'`,
  `ALTER TABLE model_bundles ADD COLUMN IF NOT EXISTS technical_specs_print_ready boolean DEFAULT false`,
  `ALTER TABLE model_bundles ADD COLUMN IF NOT EXISTS technical_specs_textured boolean DEFAULT false`,
  `ALTER TABLE model_bundles ADD COLUMN IF NOT EXISTS license_type enum_model_bundles_license_type DEFAULT 'personal'`,
  `ALTER TABLE model_bundles ADD COLUMN IF NOT EXISTS cta_mode enum_model_bundles_cta_mode DEFAULT 'free'`,
  `ALTER TABLE model_bundles ADD COLUMN IF NOT EXISTS cta_price_credits numeric DEFAULT 0`,
  `ALTER TABLE model_bundles_locales ADD COLUMN IF NOT EXISTS subtitle varchar`,
  `ALTER TABLE model_bundles_locales ADD COLUMN IF NOT EXISTS badge_label varchar`,
  `ALTER TABLE model_bundles_locales ADD COLUMN IF NOT EXISTS included_summary varchar`,
  `ALTER TABLE model_bundles_locales ADD COLUMN IF NOT EXISTS technical_specs_model_count_label varchar`,
  `ALTER TABLE model_bundles_locales ADD COLUMN IF NOT EXISTS technical_specs_supported_formats_label varchar`,
  `ALTER TABLE model_bundles_locales ADD COLUMN IF NOT EXISTS technical_specs_scale_label varchar`,
  `ALTER TABLE model_bundles_locales ADD COLUMN IF NOT EXISTS technical_specs_asset_readiness_label varchar`,
  `ALTER TABLE model_bundles_locales ADD COLUMN IF NOT EXISTS technical_specs_technical_notes varchar`,
  `ALTER TABLE model_bundles_locales ADD COLUMN IF NOT EXISTS license_summary varchar`,
  `ALTER TABLE model_bundles_locales ADD COLUMN IF NOT EXISTS cta_primary_label varchar`,
  `ALTER TABLE model_bundles_locales ADD COLUMN IF NOT EXISTS cta_secondary_label varchar`,
  `ALTER TABLE model_bundles_locales ADD COLUMN IF NOT EXISTS release_notes varchar`,
  `ALTER TABLE _model_bundles_v ADD COLUMN IF NOT EXISTS version_bundle_type enum__model_bundles_v_version_bundle_type DEFAULT 'theme-pack'`,
  `ALTER TABLE _model_bundles_v ADD COLUMN IF NOT EXISTS version_technical_specs_print_ready boolean DEFAULT false`,
  `ALTER TABLE _model_bundles_v ADD COLUMN IF NOT EXISTS version_technical_specs_textured boolean DEFAULT false`,
  `ALTER TABLE _model_bundles_v ADD COLUMN IF NOT EXISTS version_license_type enum__model_bundles_v_version_license_type DEFAULT 'personal'`,
  `ALTER TABLE _model_bundles_v ADD COLUMN IF NOT EXISTS version_cta_mode enum__model_bundles_v_version_cta_mode DEFAULT 'free'`,
  `ALTER TABLE _model_bundles_v ADD COLUMN IF NOT EXISTS version_cta_price_credits numeric DEFAULT 0`,
  `ALTER TABLE _model_bundles_v_locales ADD COLUMN IF NOT EXISTS version_subtitle varchar`,
  `ALTER TABLE _model_bundles_v_locales ADD COLUMN IF NOT EXISTS version_badge_label varchar`,
  `ALTER TABLE _model_bundles_v_locales ADD COLUMN IF NOT EXISTS version_included_summary varchar`,
  `ALTER TABLE _model_bundles_v_locales ADD COLUMN IF NOT EXISTS version_technical_specs_model_count_label varchar`,
  `ALTER TABLE _model_bundles_v_locales ADD COLUMN IF NOT EXISTS version_technical_specs_supported_formats_label varchar`,
  `ALTER TABLE _model_bundles_v_locales ADD COLUMN IF NOT EXISTS version_technical_specs_scale_label varchar`,
  `ALTER TABLE _model_bundles_v_locales ADD COLUMN IF NOT EXISTS version_technical_specs_asset_readiness_label varchar`,
  `ALTER TABLE _model_bundles_v_locales ADD COLUMN IF NOT EXISTS version_technical_specs_technical_notes varchar`,
  `ALTER TABLE _model_bundles_v_locales ADD COLUMN IF NOT EXISTS version_license_summary varchar`,
  `ALTER TABLE _model_bundles_v_locales ADD COLUMN IF NOT EXISTS version_cta_primary_label varchar`,
  `ALTER TABLE _model_bundles_v_locales ADD COLUMN IF NOT EXISTS version_cta_secondary_label varchar`,
  `ALTER TABLE _model_bundles_v_locales ADD COLUMN IF NOT EXISTS version_release_notes varchar`,
]

const downStatements = [
  `ALTER TABLE _model_bundles_v_locales DROP COLUMN IF EXISTS version_release_notes`,
  `ALTER TABLE _model_bundles_v_locales DROP COLUMN IF EXISTS version_cta_secondary_label`,
  `ALTER TABLE _model_bundles_v_locales DROP COLUMN IF EXISTS version_cta_primary_label`,
  `ALTER TABLE _model_bundles_v_locales DROP COLUMN IF EXISTS version_license_summary`,
  `ALTER TABLE _model_bundles_v_locales DROP COLUMN IF EXISTS version_technical_specs_technical_notes`,
  `ALTER TABLE _model_bundles_v_locales DROP COLUMN IF EXISTS version_technical_specs_asset_readiness_label`,
  `ALTER TABLE _model_bundles_v_locales DROP COLUMN IF EXISTS version_technical_specs_scale_label`,
  `ALTER TABLE _model_bundles_v_locales DROP COLUMN IF EXISTS version_technical_specs_supported_formats_label`,
  `ALTER TABLE _model_bundles_v_locales DROP COLUMN IF EXISTS version_technical_specs_model_count_label`,
  `ALTER TABLE _model_bundles_v_locales DROP COLUMN IF EXISTS version_included_summary`,
  `ALTER TABLE _model_bundles_v_locales DROP COLUMN IF EXISTS version_badge_label`,
  `ALTER TABLE _model_bundles_v_locales DROP COLUMN IF EXISTS version_subtitle`,
  `ALTER TABLE _model_bundles_v DROP COLUMN IF EXISTS version_cta_price_credits`,
  `ALTER TABLE _model_bundles_v DROP COLUMN IF EXISTS version_cta_mode`,
  `ALTER TABLE _model_bundles_v DROP COLUMN IF EXISTS version_license_type`,
  `ALTER TABLE _model_bundles_v DROP COLUMN IF EXISTS version_technical_specs_textured`,
  `ALTER TABLE _model_bundles_v DROP COLUMN IF EXISTS version_technical_specs_print_ready`,
  `ALTER TABLE _model_bundles_v DROP COLUMN IF EXISTS version_bundle_type`,
  `ALTER TABLE model_bundles_locales DROP COLUMN IF EXISTS release_notes`,
  `ALTER TABLE model_bundles_locales DROP COLUMN IF EXISTS cta_secondary_label`,
  `ALTER TABLE model_bundles_locales DROP COLUMN IF EXISTS cta_primary_label`,
  `ALTER TABLE model_bundles_locales DROP COLUMN IF EXISTS license_summary`,
  `ALTER TABLE model_bundles_locales DROP COLUMN IF EXISTS technical_specs_technical_notes`,
  `ALTER TABLE model_bundles_locales DROP COLUMN IF EXISTS technical_specs_asset_readiness_label`,
  `ALTER TABLE model_bundles_locales DROP COLUMN IF EXISTS technical_specs_scale_label`,
  `ALTER TABLE model_bundles_locales DROP COLUMN IF EXISTS technical_specs_supported_formats_label`,
  `ALTER TABLE model_bundles_locales DROP COLUMN IF EXISTS technical_specs_model_count_label`,
  `ALTER TABLE model_bundles_locales DROP COLUMN IF EXISTS included_summary`,
  `ALTER TABLE model_bundles_locales DROP COLUMN IF EXISTS badge_label`,
  `ALTER TABLE model_bundles_locales DROP COLUMN IF EXISTS subtitle`,
  `ALTER TABLE model_bundles DROP COLUMN IF EXISTS cta_price_credits`,
  `ALTER TABLE model_bundles DROP COLUMN IF EXISTS cta_mode`,
  `ALTER TABLE model_bundles DROP COLUMN IF EXISTS license_type`,
  `ALTER TABLE model_bundles DROP COLUMN IF EXISTS technical_specs_textured`,
  `ALTER TABLE model_bundles DROP COLUMN IF EXISTS technical_specs_print_ready`,
  `ALTER TABLE model_bundles DROP COLUMN IF EXISTS bundle_type`,
  `DROP TYPE IF EXISTS enum__model_bundles_v_version_cta_mode`,
  `DROP TYPE IF EXISTS enum__model_bundles_v_version_license_type`,
  `DROP TYPE IF EXISTS enum__model_bundles_v_version_bundle_type`,
  `DROP TYPE IF EXISTS enum_model_bundles_cta_mode`,
  `DROP TYPE IF EXISTS enum_model_bundles_license_type`,
  `DROP TYPE IF EXISTS enum_model_bundles_bundle_type`,
]

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await executeStatements(db, upStatements)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await executeStatements(db, downStatements)
}
