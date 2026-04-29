import { type MigrateDownArgs, type MigrateUpArgs, executeStatements } from '../lib/migrations/postgresUtils'

const createStatements = [
  `
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_model_comments_status') THEN
        CREATE TYPE enum_model_comments_status AS ENUM ('visible', 'hidden');
      END IF;
    END
    $$;
  `,
  `
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_engagement_views_target_type') THEN
        CREATE TYPE enum_engagement_views_target_type AS ENUM ('creator-profile', 'model');
      END IF;
    END
    $$;
  `,
  `
    CREATE TABLE IF NOT EXISTS user_follows (
      id serial PRIMARY KEY,
      follower_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      followee_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      updated_at timestamp(3) with time zone DEFAULT now() NOT NULL,
      created_at timestamp(3) with time zone DEFAULT now() NOT NULL
    )
  `,
  `
    CREATE TABLE IF NOT EXISTS model_comments (
      id serial PRIMARY KEY,
      model_id integer NOT NULL REFERENCES models(id) ON DELETE CASCADE,
      author_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status enum_model_comments_status DEFAULT 'visible' NOT NULL,
      content varchar NOT NULL,
      updated_at timestamp(3) with time zone DEFAULT now() NOT NULL,
      created_at timestamp(3) with time zone DEFAULT now() NOT NULL
    )
  `,
  `
    CREATE TABLE IF NOT EXISTS model_likes (
      id serial PRIMARY KEY,
      user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      model_id integer NOT NULL REFERENCES models(id) ON DELETE CASCADE,
      updated_at timestamp(3) with time zone DEFAULT now() NOT NULL,
      created_at timestamp(3) with time zone DEFAULT now() NOT NULL
    )
  `,
  `
    CREATE TABLE IF NOT EXISTS model_favorites (
      id serial PRIMARY KEY,
      user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      model_id integer NOT NULL REFERENCES models(id) ON DELETE CASCADE,
      updated_at timestamp(3) with time zone DEFAULT now() NOT NULL,
      created_at timestamp(3) with time zone DEFAULT now() NOT NULL
    )
  `,
  `
    CREATE TABLE IF NOT EXISTS engagement_views (
      id serial PRIMARY KEY,
      target_type enum_engagement_views_target_type NOT NULL,
      target_user_id integer REFERENCES users(id) ON DELETE SET NULL,
      target_model_id integer REFERENCES models(id) ON DELETE SET NULL,
      viewer_id integer REFERENCES users(id) ON DELETE SET NULL,
      viewer_key_hash varchar NOT NULL,
      last_viewed_at timestamp(3) with time zone NOT NULL,
      updated_at timestamp(3) with time zone DEFAULT now() NOT NULL,
      created_at timestamp(3) with time zone DEFAULT now() NOT NULL
    )
  `,
]

const indexStatements = [
  'CREATE INDEX IF NOT EXISTS user_follows_follower_idx ON user_follows(follower_id)',
  'CREATE INDEX IF NOT EXISTS user_follows_followee_idx ON user_follows(followee_id)',
  'CREATE INDEX IF NOT EXISTS user_follows_updated_at_idx ON user_follows(updated_at)',
  'CREATE INDEX IF NOT EXISTS user_follows_created_at_idx ON user_follows(created_at)',
  'CREATE UNIQUE INDEX IF NOT EXISTS user_follows_follower_followee_unique_idx ON user_follows(follower_id, followee_id)',
  'CREATE INDEX IF NOT EXISTS user_follows_followee_created_at_idx ON user_follows(followee_id, created_at DESC)',
  'CREATE INDEX IF NOT EXISTS user_follows_follower_created_at_idx ON user_follows(follower_id, created_at DESC)',
  'CREATE INDEX IF NOT EXISTS model_comments_model_idx ON model_comments(model_id)',
  'CREATE INDEX IF NOT EXISTS model_comments_author_idx ON model_comments(author_id)',
  'CREATE INDEX IF NOT EXISTS model_comments_updated_at_idx ON model_comments(updated_at)',
  'CREATE INDEX IF NOT EXISTS model_comments_created_at_idx ON model_comments(created_at)',
  'CREATE INDEX IF NOT EXISTS model_comments_model_status_created_at_idx ON model_comments(model_id, status, created_at DESC)',
  'CREATE INDEX IF NOT EXISTS model_likes_user_idx ON model_likes(user_id)',
  'CREATE INDEX IF NOT EXISTS model_likes_model_idx ON model_likes(model_id)',
  'CREATE INDEX IF NOT EXISTS model_likes_updated_at_idx ON model_likes(updated_at)',
  'CREATE INDEX IF NOT EXISTS model_likes_created_at_idx ON model_likes(created_at)',
  'CREATE UNIQUE INDEX IF NOT EXISTS model_likes_user_model_unique_idx ON model_likes(user_id, model_id)',
  'CREATE INDEX IF NOT EXISTS model_likes_model_created_at_idx ON model_likes(model_id, created_at DESC)',
  'CREATE INDEX IF NOT EXISTS model_favorites_user_idx ON model_favorites(user_id)',
  'CREATE INDEX IF NOT EXISTS model_favorites_model_idx ON model_favorites(model_id)',
  'CREATE INDEX IF NOT EXISTS model_favorites_updated_at_idx ON model_favorites(updated_at)',
  'CREATE INDEX IF NOT EXISTS model_favorites_created_at_idx ON model_favorites(created_at)',
  'CREATE UNIQUE INDEX IF NOT EXISTS model_favorites_user_model_unique_idx ON model_favorites(user_id, model_id)',
  'CREATE INDEX IF NOT EXISTS model_favorites_model_created_at_idx ON model_favorites(model_id, created_at DESC)',
  'CREATE INDEX IF NOT EXISTS engagement_views_target_user_idx ON engagement_views(target_user_id)',
  'CREATE INDEX IF NOT EXISTS engagement_views_target_model_idx ON engagement_views(target_model_id)',
  'CREATE INDEX IF NOT EXISTS engagement_views_viewer_idx ON engagement_views(viewer_id)',
  'CREATE INDEX IF NOT EXISTS engagement_views_viewer_key_hash_idx ON engagement_views(viewer_key_hash)',
  'CREATE INDEX IF NOT EXISTS engagement_views_updated_at_idx ON engagement_views(updated_at)',
  'CREATE INDEX IF NOT EXISTS engagement_views_created_at_idx ON engagement_views(created_at)',
]

const lockRelationStatements = [
  'ALTER TABLE payload_locked_documents_rels ADD COLUMN IF NOT EXISTS user_follows_id integer',
  'ALTER TABLE payload_locked_documents_rels ADD COLUMN IF NOT EXISTS model_comments_id integer',
  'ALTER TABLE payload_locked_documents_rels ADD COLUMN IF NOT EXISTS model_likes_id integer',
  'ALTER TABLE payload_locked_documents_rels ADD COLUMN IF NOT EXISTS model_favorites_id integer',
  'ALTER TABLE payload_locked_documents_rels ADD COLUMN IF NOT EXISTS engagement_views_id integer',
  'CREATE INDEX IF NOT EXISTS payload_locked_documents_rels_user_follows_id_idx ON payload_locked_documents_rels(user_follows_id)',
  'CREATE INDEX IF NOT EXISTS payload_locked_documents_rels_model_comments_id_idx ON payload_locked_documents_rels(model_comments_id)',
  'CREATE INDEX IF NOT EXISTS payload_locked_documents_rels_model_likes_id_idx ON payload_locked_documents_rels(model_likes_id)',
  'CREATE INDEX IF NOT EXISTS payload_locked_documents_rels_model_favorites_id_idx ON payload_locked_documents_rels(model_favorites_id)',
  'CREATE INDEX IF NOT EXISTS payload_locked_documents_rels_engagement_views_id_idx ON payload_locked_documents_rels(engagement_views_id)',
]

const dropStatements = [
  'DROP TABLE IF EXISTS engagement_views',
  'DROP TABLE IF EXISTS model_favorites',
  'DROP TABLE IF EXISTS model_likes',
  'DROP TABLE IF EXISTS model_comments',
  'DROP TABLE IF EXISTS user_follows',
  'DROP TYPE IF EXISTS enum_engagement_views_target_type',
  'DROP TYPE IF EXISTS enum_model_comments_status',
]

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await executeStatements(db, createStatements)
  await executeStatements(db, indexStatements)
  await executeStatements(db, lockRelationStatements)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await executeStatements(db, dropStatements)
}
