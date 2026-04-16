import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

const statements = [
  `CREATE TABLE IF NOT EXISTS homepage_items (
    id INTEGER PRIMARY KEY,
    slug TEXT,
    placement TEXT DEFAULT 'featured',
    content_type TEXT DEFAULT 'custom',
    cover_image_id INTEGER,
    linked_model_id INTEGER,
    linked_post_id INTEGER,
    linked_announcement_id INTEGER,
    linked_bundle_id INTEGER,
    custom_href TEXT,
    created_by_id INTEGER,
    publish_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    is_pinned INTEGER DEFAULT 0,
    is_visible INTEGER DEFAULT 1,
    sort_order NUMERIC DEFAULT 0,
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    _status TEXT DEFAULT 'draft'
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS homepage_items_slug_idx ON homepage_items(slug)`,
  `CREATE TABLE IF NOT EXISTS homepage_items_locales (
    title TEXT,
    summary TEXT,
    id INTEGER PRIMARY KEY,
    _locale TEXT NOT NULL,
    _parent_id INTEGER NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS homepage_items_locales_locale_parent_id_unique ON homepage_items_locales(_locale, _parent_id)`,
  `CREATE TABLE IF NOT EXISTS _homepage_items_v (
    id INTEGER PRIMARY KEY,
    parent_id INTEGER,
    version_slug TEXT,
    version_placement TEXT DEFAULT 'featured',
    version_content_type TEXT DEFAULT 'custom',
    version_cover_image_id INTEGER,
    version_linked_model_id INTEGER,
    version_linked_post_id INTEGER,
    version_linked_announcement_id INTEGER,
    version_linked_bundle_id INTEGER,
    version_custom_href TEXT,
    version_created_by_id INTEGER,
    version_publish_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    version_is_pinned INTEGER DEFAULT 0,
    version_is_visible INTEGER DEFAULT 1,
    version_sort_order NUMERIC DEFAULT 0,
    version_updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    version_created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    version__status TEXT DEFAULT 'draft',
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    snapshot INTEGER,
    published_locale TEXT,
    latest INTEGER
  )`,
  `CREATE TABLE IF NOT EXISTS _homepage_items_v_locales (
    version_title TEXT,
    version_summary TEXT,
    id INTEGER PRIMARY KEY,
    _locale TEXT NOT NULL,
    _parent_id INTEGER NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS _homepage_items_v_locales_locale_parent_id_unique ON _homepage_items_v_locales(_locale, _parent_id)`,
  `CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY,
    slug TEXT,
    category TEXT DEFAULT 'article',
    cover_image_id INTEGER,
    video_url TEXT,
    created_by_id INTEGER,
    published_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    is_pinned INTEGER DEFAULT 0,
    is_visible INTEGER DEFAULT 1,
    sort_order NUMERIC DEFAULT 0,
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    _status TEXT DEFAULT 'draft'
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS posts_slug_idx ON posts(slug)`,
  `CREATE TABLE IF NOT EXISTS posts_locales (
    title TEXT,
    excerpt TEXT,
    content TEXT,
    id INTEGER PRIMARY KEY,
    _locale TEXT NOT NULL,
    _parent_id INTEGER NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS posts_locales_locale_parent_id_unique ON posts_locales(_locale, _parent_id)`,
  `CREATE TABLE IF NOT EXISTS _posts_v (
    id INTEGER PRIMARY KEY,
    parent_id INTEGER,
    version_slug TEXT,
    version_category TEXT DEFAULT 'article',
    version_cover_image_id INTEGER,
    version_video_url TEXT,
    version_created_by_id INTEGER,
    version_published_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    version_is_pinned INTEGER DEFAULT 0,
    version_is_visible INTEGER DEFAULT 1,
    version_sort_order NUMERIC DEFAULT 0,
    version_updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    version_created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    version__status TEXT DEFAULT 'draft',
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    snapshot INTEGER,
    published_locale TEXT,
    latest INTEGER
  )`,
  `CREATE TABLE IF NOT EXISTS _posts_v_locales (
    version_title TEXT,
    version_excerpt TEXT,
    version_content TEXT,
    id INTEGER PRIMARY KEY,
    _locale TEXT NOT NULL,
    _parent_id INTEGER NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS _posts_v_locales_locale_parent_id_unique ON _posts_v_locales(_locale, _parent_id)`,
  `CREATE TABLE IF NOT EXISTS announcements (
    id INTEGER PRIMARY KEY,
    slug TEXT,
    created_by_id INTEGER,
    publish_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    is_pinned INTEGER DEFAULT 0,
    is_visible INTEGER DEFAULT 1,
    sort_order NUMERIC DEFAULT 0,
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    _status TEXT DEFAULT 'draft'
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS announcements_slug_idx ON announcements(slug)`,
  `CREATE TABLE IF NOT EXISTS announcements_locales (
    title TEXT,
    summary TEXT,
    content TEXT,
    id INTEGER PRIMARY KEY,
    _locale TEXT NOT NULL,
    _parent_id INTEGER NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS announcements_locales_locale_parent_id_unique ON announcements_locales(_locale, _parent_id)`,
  `CREATE TABLE IF NOT EXISTS _announcements_v (
    id INTEGER PRIMARY KEY,
    parent_id INTEGER,
    version_slug TEXT,
    version_created_by_id INTEGER,
    version_publish_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    version_is_pinned INTEGER DEFAULT 0,
    version_is_visible INTEGER DEFAULT 1,
    version_sort_order NUMERIC DEFAULT 0,
    version_updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    version_created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    version__status TEXT DEFAULT 'draft',
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    snapshot INTEGER,
    published_locale TEXT,
    latest INTEGER
  )`,
  `CREATE TABLE IF NOT EXISTS _announcements_v_locales (
    version_title TEXT,
    version_summary TEXT,
    version_content TEXT,
    id INTEGER PRIMARY KEY,
    _locale TEXT NOT NULL,
    _parent_id INTEGER NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS _announcements_v_locales_locale_parent_id_unique ON _announcements_v_locales(_locale, _parent_id)`,
  `CREATE TABLE IF NOT EXISTS model_bundles (
    id INTEGER PRIMARY KEY,
    slug TEXT,
    cover_image_id INTEGER,
    created_by_id INTEGER,
    publish_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    is_visible INTEGER DEFAULT 1,
    is_featured INTEGER DEFAULT 0,
    sort_order NUMERIC DEFAULT 0,
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    _status TEXT DEFAULT 'draft'
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS model_bundles_slug_idx ON model_bundles(slug)`,
  `CREATE TABLE IF NOT EXISTS model_bundles_locales (
    title TEXT,
    summary TEXT,
    id INTEGER PRIMARY KEY,
    _locale TEXT NOT NULL,
    _parent_id INTEGER NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS model_bundles_locales_locale_parent_id_unique ON model_bundles_locales(_locale, _parent_id)`,
  `CREATE TABLE IF NOT EXISTS model_bundles_tags (
    _order INTEGER NOT NULL,
    _parent_id INTEGER NOT NULL,
    id TEXT PRIMARY KEY
  )`,
  `CREATE TABLE IF NOT EXISTS model_bundles_tags_locales (
    label TEXT,
    id INTEGER PRIMARY KEY,
    _locale TEXT NOT NULL,
    _parent_id INTEGER NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS model_bundles_tags_locales_locale_parent_id_uniqu ON model_bundles_tags_locales(_locale, _parent_id)`,
  `CREATE TABLE IF NOT EXISTS model_bundles_rels (
    id INTEGER PRIMARY KEY,
    "order" INTEGER,
    parent_id INTEGER NOT NULL,
    path TEXT NOT NULL,
    models_id INTEGER
  )`,
  `CREATE TABLE IF NOT EXISTS _model_bundles_v (
    id INTEGER PRIMARY KEY,
    parent_id INTEGER,
    version_slug TEXT,
    version_cover_image_id INTEGER,
    version_created_by_id INTEGER,
    version_publish_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    version_is_visible INTEGER DEFAULT 1,
    version_is_featured INTEGER DEFAULT 0,
    version_sort_order NUMERIC DEFAULT 0,
    version_updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    version_created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    version__status TEXT DEFAULT 'draft',
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    snapshot INTEGER,
    published_locale TEXT,
    latest INTEGER
  )`,
  `CREATE TABLE IF NOT EXISTS _model_bundles_v_locales (
    version_title TEXT,
    version_summary TEXT,
    id INTEGER PRIMARY KEY,
    _locale TEXT NOT NULL,
    _parent_id INTEGER NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS _model_bundles_v_locales_locale_parent_id_unique ON _model_bundles_v_locales(_locale, _parent_id)`,
  `CREATE TABLE IF NOT EXISTS _model_bundles_v_version_tags (
    _order INTEGER NOT NULL,
    _parent_id INTEGER NOT NULL,
    id INTEGER PRIMARY KEY,
    _uuid TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS _model_bundles_v_version_tags_locales (
    label TEXT,
    id INTEGER PRIMARY KEY,
    _locale TEXT NOT NULL,
    _parent_id INTEGER NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS _model_bundles_v_version_tags_locales_locale_parent_id_uniqu ON _model_bundles_v_version_tags_locales(_locale, _parent_id)`,
  `CREATE TABLE IF NOT EXISTS _model_bundles_v_rels (
    id INTEGER PRIMARY KEY,
    "order" INTEGER,
    parent_id INTEGER NOT NULL,
    path TEXT NOT NULL,
    models_id INTEGER
  )`,
  `CREATE TABLE IF NOT EXISTS storage_settings (
    id INTEGER PRIMARY KEY,
    enabled INTEGER DEFAULT 0,
    bucket TEXT DEFAULT '',
    region TEXT DEFAULT 'us-east-1',
    prefix TEXT DEFAULT 'media',
    base_u_r_l TEXT DEFAULT '',
    signed_downloads INTEGER DEFAULT 1,
    credentials_source TEXT DEFAULT 'environment',
    last_validated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    last_rotated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  )`,
  `INSERT OR IGNORE INTO storage_settings (id, enabled, bucket, region, prefix, base_u_r_l, signed_downloads, credentials_source)
   VALUES (1, 0, '', 'us-east-1', 'media', '', 1, 'environment')`,
  `CREATE TABLE IF NOT EXISTS security_settings (
    id INTEGER PRIMARY KEY,
    updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  )`,
  `INSERT OR IGNORE INTO security_settings (id) VALUES (1)`,
  `CREATE TABLE IF NOT EXISTS security_settings_allowed_mutation_origins (
    _order INTEGER NOT NULL,
    _parent_id INTEGER NOT NULL,
    id TEXT PRIMARY KEY,
    origin TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS security_settings_allowed_remote_asset_hosts (
    _order INTEGER NOT NULL,
    _parent_id INTEGER NOT NULL,
    id TEXT PRIMARY KEY,
    host TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS runtime_deployment_settings (
    id INTEGER PRIMARY KEY,
    database_connection_mode TEXT DEFAULT 'aws-rds-fields',
    database_url_template TEXT,
    aws_rds_host TEXT,
    aws_rds_port NUMERIC DEFAULT 5432,
    aws_rds_db_name TEXT DEFAULT 'payload_local_demo',
    aws_rds_username TEXT DEFAULT 'payload_admin',
    aws_rds_ssl_mode TEXT DEFAULT 'require',
    aws_rds_ssl_reject_unauthorized INTEGER DEFAULT 0,
    database_security_checklist TEXT,
    next_public_app_url TEXT DEFAULT 'http://127.0.0.1:3000',
    payload_secret_rotation_note TEXT,
    updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  )`,
  `INSERT OR IGNORE INTO runtime_deployment_settings
   (id, database_connection_mode, aws_rds_port, aws_rds_db_name, aws_rds_username, aws_rds_ssl_mode, aws_rds_ssl_reject_unauthorized, next_public_app_url)
   VALUES (1, 'aws-rds-fields', 5432, 'payload_local_demo', 'payload_admin', 'require', 0, 'http://127.0.0.1:3000')`,
]

const relationColumnRepairs = [
  ['homepage_items_id', 'INTEGER'],
  ['posts_id', 'INTEGER'],
  ['announcements_id', 'INTEGER'],
  ['model_bundles_id', 'INTEGER'],
] as const

async function hasColumn(db: MigrateUpArgs['db'], table: string, column: string) {
  const result = await db.run(sql.raw(`PRAGMA table_info(${table})`))
  const rows = (result as { rows?: Array<{ name?: string }> }).rows || []

  return rows.some((row) => row?.name === column)
}

async function runStatements(db: MigrateUpArgs['db'], sqlStatements: string[]) {
  for (const statement of sqlStatements) {
    await db.run(sql.raw(statement))
  }
}

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await runStatements(db, statements)

  for (const [column, definition] of relationColumnRepairs) {
    if (!(await hasColumn(db, 'payload_locked_documents_rels', column))) {
      await db.run(sql.raw(`ALTER TABLE payload_locked_documents_rels ADD COLUMN ${column} ${definition}`))
    }
  }
}

export async function down({}: MigrateDownArgs): Promise<void> {
  // Baseline reconciliation migration.
  // Intentionally left as a no-op because the repaired schema may already contain
  // live local data and SQLite cannot safely roll back the added relation columns.
}
