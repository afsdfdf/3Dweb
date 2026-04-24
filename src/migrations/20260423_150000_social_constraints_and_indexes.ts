import { type MigrateDownArgs, type MigrateUpArgs, executeStatements } from './postgresUtils'

const dedupeStatements = [
  `
    WITH ranked AS (
      SELECT id, ROW_NUMBER() OVER (PARTITION BY follower_id, followee_id ORDER BY id) AS row_num
      FROM user_follows
    )
    DELETE FROM user_follows
    WHERE id IN (SELECT id FROM ranked WHERE row_num > 1)
  `,
  `
    WITH ranked AS (
      SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id, model_id ORDER BY id) AS row_num
      FROM model_likes
    )
    DELETE FROM model_likes
    WHERE id IN (SELECT id FROM ranked WHERE row_num > 1)
  `,
  `
    WITH ranked AS (
      SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id, model_id ORDER BY id) AS row_num
      FROM model_favorites
    )
    DELETE FROM model_favorites
    WHERE id IN (SELECT id FROM ranked WHERE row_num > 1)
  `,
]

const indexStatements = [
  'CREATE UNIQUE INDEX IF NOT EXISTS user_follows_follower_followee_unique_idx ON user_follows(follower_id, followee_id)',
  'CREATE UNIQUE INDEX IF NOT EXISTS model_likes_user_model_unique_idx ON model_likes(user_id, model_id)',
  'CREATE UNIQUE INDEX IF NOT EXISTS model_favorites_user_model_unique_idx ON model_favorites(user_id, model_id)',
  'CREATE INDEX IF NOT EXISTS user_follows_followee_created_at_idx ON user_follows(followee_id, created_at DESC)',
  'CREATE INDEX IF NOT EXISTS user_follows_follower_created_at_idx ON user_follows(follower_id, created_at DESC)',
  'CREATE INDEX IF NOT EXISTS model_likes_model_created_at_idx ON model_likes(model_id, created_at DESC)',
  'CREATE INDEX IF NOT EXISTS model_favorites_model_created_at_idx ON model_favorites(model_id, created_at DESC)',
  'CREATE INDEX IF NOT EXISTS model_comments_model_status_created_at_idx ON model_comments(model_id, status, created_at DESC)',
]

const dropStatements = [
  'DROP INDEX IF EXISTS user_follows_follower_followee_unique_idx',
  'DROP INDEX IF EXISTS model_likes_user_model_unique_idx',
  'DROP INDEX IF EXISTS model_favorites_user_model_unique_idx',
  'DROP INDEX IF EXISTS user_follows_followee_created_at_idx',
  'DROP INDEX IF EXISTS user_follows_follower_created_at_idx',
  'DROP INDEX IF EXISTS model_likes_model_created_at_idx',
  'DROP INDEX IF EXISTS model_favorites_model_created_at_idx',
  'DROP INDEX IF EXISTS model_comments_model_status_created_at_idx',
]

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await executeStatements(db, dedupeStatements)
  await executeStatements(db, indexStatements)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await executeStatements(db, dropStatements)
}
