import { type MigrateDownArgs, type MigrateUpArgs, executeStatements } from '../lib/migrations/postgresUtils'

const requiredTextColumns = [
  { name: 'blog_page_hero_eyebrow', value: 'Tavern Journal' },
  { name: 'blog_page_hero_title', value: 'Notes from the forge, field, and tavern' },
  {
    name: 'blog_page_hero_text',
    value:
      'Tutorials, creator stories, platform updates, and production notes for turning ideas into collectible 3D worlds.',
  },
  { name: 'blog_page_hero_image_alt', value: 'A dark fantasy workshop table with printed miniatures and tools' },
  { name: 'blog_page_hero_primary_c_t_a_label', value: 'Open Studio' },
  { name: 'blog_page_hero_primary_c_t_a_href', value: '/workbench' },
  { name: 'blog_page_hero_secondary_c_t_a_label', value: 'Explore Models' },
  { name: 'blog_page_hero_secondary_c_t_a_href', value: '/showcase' },
  { name: 'blog_page_dispatches_label', value: 'Dispatches' },
  { name: 'blog_page_category_labels_articles', value: 'Articles' },
  { name: 'blog_page_category_labels_events', value: 'Events' },
  { name: 'blog_page_category_labels_announcements', value: 'Announcements' },
  { name: 'blog_page_seo_title', value: 'Tavern Journal | Thorns Tavern' },
  {
    name: 'blog_page_seo_description',
    value: 'Tutorials, platform updates, creator stories, and 3D production notes from Thorns Tavern.',
  },
]

const quote = (value: string) => value.replace(/'/g, "''")

const upStatements = [
  ...requiredTextColumns.flatMap(({ name, value }) => [
    `ALTER TABLE formal_pages ADD COLUMN IF NOT EXISTS ${name} varchar`,
    `ALTER TABLE formal_pages ALTER COLUMN ${name} SET DEFAULT '${quote(value)}'`,
    `UPDATE formal_pages SET ${name} = '${quote(value)}' WHERE ${name} IS NULL`,
    `ALTER TABLE formal_pages ALTER COLUMN ${name} SET NOT NULL`,
  ]),
  `ALTER TABLE formal_pages ADD COLUMN IF NOT EXISTS blog_page_hero_image_id integer`,
  `CREATE INDEX IF NOT EXISTS formal_pages_blog_page_blog_page_hero_image_idx ON formal_pages(blog_page_hero_image_id)`,
  `
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'formal_pages_blog_page_hero_image_fk'
      ) THEN
        ALTER TABLE formal_pages
          ADD CONSTRAINT formal_pages_blog_page_hero_image_fk
          FOREIGN KEY (blog_page_hero_image_id)
          REFERENCES media(id)
          ON DELETE SET NULL;
      END IF;
    END
    $$;
  `,
]

const downStatements = [
  `ALTER TABLE formal_pages DROP CONSTRAINT IF EXISTS formal_pages_blog_page_hero_image_fk`,
  `DROP INDEX IF EXISTS formal_pages_blog_page_blog_page_hero_image_idx`,
  `ALTER TABLE formal_pages DROP COLUMN IF EXISTS blog_page_hero_image_id`,
  ...requiredTextColumns.map(({ name }) => `ALTER TABLE formal_pages DROP COLUMN IF EXISTS ${name}`),
]

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await executeStatements(db, upStatements)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await executeStatements(db, downStatements)
}
