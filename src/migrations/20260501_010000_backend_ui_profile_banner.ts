import { type MigrateDownArgs, type MigrateUpArgs, executeStatements } from '../lib/migrations/postgresUtils'

const enumStatements = [
  `
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum__locales') THEN
        CREATE TYPE enum__locales AS ENUM ('en', 'zh');
      END IF;
    END
    $$;
  `,
  `
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumlabel = 'avatar'
          AND enumtypid = 'enum_media_purpose'::regtype
      ) THEN
        ALTER TYPE enum_media_purpose ADD VALUE 'avatar';
      END IF;
    END
    $$;
  `,
  `
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumlabel = 'profile-banner'
          AND enumtypid = 'enum_media_purpose'::regtype
      ) THEN
        ALTER TYPE enum_media_purpose ADD VALUE 'profile-banner';
      END IF;
    END
    $$;
  `,
  `
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_avatar_frame_styles_unlock_rule') THEN
        CREATE TYPE enum_avatar_frame_styles_unlock_rule AS ENUM ('free', 'subscription', 'event', 'achievement');
      END IF;
    END
    $$;
  `,
]

const userProfileStatements = [
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_banner_focal_x numeric DEFAULT 50`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_banner_focal_y numeric DEFAULT 50`,
]

const avatarFrameStyleStatements = [
  `
    CREATE TABLE IF NOT EXISTS avatar_frame_styles (
      id serial PRIMARY KEY,
      key varchar NOT NULL,
      thumbnail_id integer REFERENCES media(id) ON DELETE SET NULL,
      frame_image_id integer REFERENCES media(id) ON DELETE SET NULL,
      unlock_rule enum_avatar_frame_styles_unlock_rule DEFAULT 'free',
      is_active boolean DEFAULT true,
      is_user_selectable boolean DEFAULT true,
      sort_order numeric DEFAULT 0,
      updated_at timestamp(3) with time zone DEFAULT now() NOT NULL,
      created_at timestamp(3) with time zone DEFAULT now() NOT NULL
    )
  `,
  `
    CREATE TABLE IF NOT EXISTS avatar_frame_styles_locales (
      title varchar NOT NULL,
      description varchar,
      id serial PRIMARY KEY,
      _locale enum__locales NOT NULL,
      _parent_id integer NOT NULL REFERENCES avatar_frame_styles(id) ON DELETE CASCADE
    )
  `,
  `CREATE UNIQUE INDEX IF NOT EXISTS avatar_frame_styles_key_idx ON avatar_frame_styles(key)`,
  `CREATE INDEX IF NOT EXISTS avatar_frame_styles_thumbnail_idx ON avatar_frame_styles(thumbnail_id)`,
  `CREATE INDEX IF NOT EXISTS avatar_frame_styles_frame_image_idx ON avatar_frame_styles(frame_image_id)`,
  `CREATE INDEX IF NOT EXISTS avatar_frame_styles_updated_at_idx ON avatar_frame_styles(updated_at)`,
  `CREATE INDEX IF NOT EXISTS avatar_frame_styles_created_at_idx ON avatar_frame_styles(created_at)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS avatar_frame_styles_locales_locale_parent_id_unique ON avatar_frame_styles_locales(_locale, _parent_id)`,
]

const homepageItemStatements = [
  `ALTER TABLE homepage_items_locales ADD COLUMN IF NOT EXISTS badge_label varchar`,
  `ALTER TABLE homepage_items_locales ADD COLUMN IF NOT EXISTS ribbon_label varchar`,
  `ALTER TABLE homepage_items_locales ADD COLUMN IF NOT EXISTS cta_label varchar`,
  `ALTER TABLE homepage_items_locales ADD COLUMN IF NOT EXISTS alt_text varchar`,
  `ALTER TABLE _homepage_items_v_locales ADD COLUMN IF NOT EXISTS version_badge_label varchar`,
  `ALTER TABLE _homepage_items_v_locales ADD COLUMN IF NOT EXISTS version_ribbon_label varchar`,
  `ALTER TABLE _homepage_items_v_locales ADD COLUMN IF NOT EXISTS version_cta_label varchar`,
  `ALTER TABLE _homepage_items_v_locales ADD COLUMN IF NOT EXISTS version_alt_text varchar`,
]

const siteSettingsStatements = [
  `ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS model_access_policy_charge_preview_credits boolean DEFAULT false`,
  `ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS model_access_policy_preview_credits numeric DEFAULT 0`,
  `ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS model_access_policy_charge_download_credits boolean DEFAULT false`,
  `ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS model_access_policy_download_credits numeric DEFAULT 5`,
]

const lockRelationStatements = [
  `ALTER TABLE payload_locked_documents_rels ADD COLUMN IF NOT EXISTS avatar_frame_styles_id integer`,
  `CREATE INDEX IF NOT EXISTS payload_locked_documents_rels_avatar_frame_styles_id_idx ON payload_locked_documents_rels(avatar_frame_styles_id)`,
  `
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'payload_locked_documents_rels_avatar_frame_styles_fk'
      ) THEN
        ALTER TABLE payload_locked_documents_rels
          ADD CONSTRAINT payload_locked_documents_rels_avatar_frame_styles_fk
          FOREIGN KEY (avatar_frame_styles_id)
          REFERENCES avatar_frame_styles(id)
          ON DELETE CASCADE;
      END IF;
    END
    $$;
  `,
]

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await executeStatements(db, enumStatements)
  await executeStatements(db, userProfileStatements)
  await executeStatements(db, avatarFrameStyleStatements)
  await executeStatements(db, homepageItemStatements)
  await executeStatements(db, siteSettingsStatements)
  await executeStatements(db, lockRelationStatements)
}

export async function down({}: MigrateDownArgs): Promise<void> {
  // Keep the migration non-destructive for live profile, homepage, and policy data.
}
