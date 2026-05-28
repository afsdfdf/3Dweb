import { type MigrateDownArgs, type MigrateUpArgs, executeStatements } from '../lib/migrations/postgresUtils'

const emptyLexicalContent = `{
  "root": {
    "type": "root",
    "format": "",
    "indent": 0,
    "version": 1,
    "children": [
      {
        "type": "paragraph",
        "format": "",
        "indent": 0,
        "version": 1,
        "children": [
          {
            "mode": "normal",
            "text": "This article is being prepared.",
            "type": "text",
            "style": "",
            "detail": 0,
            "format": 0,
            "version": 1
          }
        ],
        "direction": null,
        "textFormat": 0,
        "textStyle": ""
      }
    ],
    "direction": null
  }
}`

const upStatements = [
  `ALTER TABLE posts ADD COLUMN IF NOT EXISTS title varchar`,
  `ALTER TABLE posts ADD COLUMN IF NOT EXISTS excerpt varchar`,
  `ALTER TABLE posts ADD COLUMN IF NOT EXISTS content jsonb`,
  `
    DO $$
    BEGIN
      IF to_regclass('posts_locales') IS NOT NULL THEN
        UPDATE posts
        SET
          title = COALESCE(
            NULLIF(posts.title, ''),
            (
              SELECT NULLIF(l.title, '')
              FROM posts_locales l
              WHERE l._parent_id = posts.id
                AND NULLIF(l.title, '') IS NOT NULL
              ORDER BY CASE WHEN l._locale = 'en' THEN 0 ELSE 1 END, l.id
              LIMIT 1
            ),
            CONCAT('Untitled post ', posts.id)
          ),
          excerpt = COALESCE(
            posts.excerpt,
            (
              SELECT l.excerpt
              FROM posts_locales l
              WHERE l._parent_id = posts.id
                AND l.excerpt IS NOT NULL
              ORDER BY CASE WHEN l._locale = 'en' THEN 0 ELSE 1 END, l.id
              LIMIT 1
            )
          ),
          content = COALESCE(
            posts.content,
            (
              SELECT l.content
              FROM posts_locales l
              WHERE l._parent_id = posts.id
                AND l.content IS NOT NULL
              ORDER BY CASE WHEN l._locale = 'en' THEN 0 ELSE 1 END, l.id
              LIMIT 1
            ),
            '${emptyLexicalContent}'::jsonb
          );
      ELSE
        UPDATE posts
        SET
          title = COALESCE(NULLIF(posts.title, ''), CONCAT('Untitled post ', posts.id)),
          content = COALESCE(posts.content, '${emptyLexicalContent}'::jsonb);
      END IF;
    END $$;
  `,
  `ALTER TABLE _posts_v ADD COLUMN IF NOT EXISTS version_title varchar`,
  `ALTER TABLE _posts_v ADD COLUMN IF NOT EXISTS version_excerpt varchar`,
  `ALTER TABLE _posts_v ADD COLUMN IF NOT EXISTS version_content jsonb`,
  `
    DO $$
    BEGIN
      IF to_regclass('_posts_v_locales') IS NOT NULL THEN
        UPDATE _posts_v
        SET
          version_title = COALESCE(
            NULLIF(_posts_v.version_title, ''),
            (
              SELECT NULLIF(l.version_title, '')
              FROM _posts_v_locales l
              WHERE l._parent_id = _posts_v.id
                AND NULLIF(l.version_title, '') IS NOT NULL
              ORDER BY CASE WHEN l._locale = 'en' THEN 0 ELSE 1 END, l.id
              LIMIT 1
            )
          ),
          version_excerpt = COALESCE(
            _posts_v.version_excerpt,
            (
              SELECT l.version_excerpt
              FROM _posts_v_locales l
              WHERE l._parent_id = _posts_v.id
                AND l.version_excerpt IS NOT NULL
              ORDER BY CASE WHEN l._locale = 'en' THEN 0 ELSE 1 END, l.id
              LIMIT 1
            )
          ),
          version_content = COALESCE(
            _posts_v.version_content,
            (
              SELECT l.version_content
              FROM _posts_v_locales l
              WHERE l._parent_id = _posts_v.id
                AND l.version_content IS NOT NULL
              ORDER BY CASE WHEN l._locale = 'en' THEN 0 ELSE 1 END, l.id
              LIMIT 1
            )
          );
      END IF;
    END $$;
  `,
  `DROP TABLE IF EXISTS _posts_v_locales`,
  `DROP TABLE IF EXISTS posts_locales`,
]

const downStatements = [
  `
    CREATE TABLE IF NOT EXISTS posts_locales (
      title varchar,
      excerpt varchar,
      content jsonb,
      id serial PRIMARY KEY,
      _locale enum__locales NOT NULL,
      _parent_id integer NOT NULL
    )
  `,
  `
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'posts_locales_parent_id_fk'
      ) THEN
        ALTER TABLE posts_locales
          ADD CONSTRAINT posts_locales_parent_id_fk
          FOREIGN KEY (_parent_id)
          REFERENCES posts(id)
          ON DELETE CASCADE;
      END IF;
    END $$;
  `,
  `CREATE UNIQUE INDEX IF NOT EXISTS posts_locales_locale_parent_id_unique ON posts_locales(_locale, _parent_id)`,
  `
    INSERT INTO posts_locales (title, excerpt, content, _locale, _parent_id)
    SELECT title, excerpt, content, 'en'::enum__locales, id
    FROM posts
    WHERE title IS NOT NULL OR excerpt IS NOT NULL OR content IS NOT NULL
    ON CONFLICT (_locale, _parent_id)
    DO UPDATE SET
      title = EXCLUDED.title,
      excerpt = EXCLUDED.excerpt,
      content = EXCLUDED.content
  `,
  `
    CREATE TABLE IF NOT EXISTS _posts_v_locales (
      version_title varchar,
      version_excerpt varchar,
      version_content jsonb,
      id serial PRIMARY KEY,
      _locale enum__locales NOT NULL,
      _parent_id integer NOT NULL
    )
  `,
  `
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = '_posts_v_locales_parent_id_fk'
      ) THEN
        ALTER TABLE _posts_v_locales
          ADD CONSTRAINT _posts_v_locales_parent_id_fk
          FOREIGN KEY (_parent_id)
          REFERENCES _posts_v(id)
          ON DELETE CASCADE;
      END IF;
    END $$;
  `,
  `CREATE UNIQUE INDEX IF NOT EXISTS _posts_v_locales_locale_parent_id_unique ON _posts_v_locales(_locale, _parent_id)`,
  `
    INSERT INTO _posts_v_locales (version_title, version_excerpt, version_content, _locale, _parent_id)
    SELECT version_title, version_excerpt, version_content, 'en'::enum__locales, id
    FROM _posts_v
    WHERE version_title IS NOT NULL OR version_excerpt IS NOT NULL OR version_content IS NOT NULL
    ON CONFLICT (_locale, _parent_id)
    DO UPDATE SET
      version_title = EXCLUDED.version_title,
      version_excerpt = EXCLUDED.version_excerpt,
      version_content = EXCLUDED.version_content
  `,
  `ALTER TABLE posts DROP COLUMN IF EXISTS title`,
  `ALTER TABLE posts DROP COLUMN IF EXISTS excerpt`,
  `ALTER TABLE posts DROP COLUMN IF EXISTS content`,
  `ALTER TABLE _posts_v DROP COLUMN IF EXISTS version_title`,
  `ALTER TABLE _posts_v DROP COLUMN IF EXISTS version_excerpt`,
  `ALTER TABLE _posts_v DROP COLUMN IF EXISTS version_content`,
]

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await executeStatements(db, upStatements)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await executeStatements(db, downStatements)
}
