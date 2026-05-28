import { type MigrateDownArgs, type MigrateUpArgs, executeStatements } from '../lib/migrations/postgresUtils'

const requiredTextColumns = [
  { name: 'blog_page_category_labels_all', value: 'All' },
  { name: 'blog_page_listing_labels_read_article_label', value: 'Read dispatch' },
  { name: 'blog_page_listing_labels_search_aria_label', value: 'Search Tavern Journal' },
  { name: 'blog_page_listing_labels_search_placeholder', value: 'Search notes, guides, and releases' },
  { name: 'blog_page_listing_labels_search_button_label', value: 'Search' },
  { name: 'blog_page_listing_labels_empty_title', value: 'The tavern board is being prepared.' },
  {
    name: 'blog_page_listing_labels_empty_text',
    value: 'New creator notes and production dispatches will appear here soon.',
  },
  { name: 'blog_page_listing_labels_empty_c_t_a_label', value: 'Explore models' },
  { name: 'blog_page_listing_labels_empty_c_t_a_href', value: '/showcase' },
  { name: 'blog_page_listing_labels_pinned_title', value: 'Pinned notes' },
  {
    name: 'blog_page_listing_labels_pinned_empty_text',
    value: 'Published journal notes will appear here after the first dispatch goes live.',
  },
  { name: 'blog_page_listing_labels_date_fallback_label', value: 'Recently' },
  { name: 'blog_page_listing_labels_reading_time_suffix', value: 'min read' },
  { name: 'blog_page_listing_labels_default_excerpt', value: 'A production note from the Thorns Tavern team.' },
  { name: 'blog_page_pagination_labels_previous_label', value: 'Previous' },
  { name: 'blog_page_pagination_labels_next_label', value: 'Next' },
  { name: 'blog_page_pagination_labels_page_label', value: 'Page' },
  { name: 'blog_page_pagination_labels_of_label', value: 'of' },
  { name: 'blog_page_article_labels_breadcrumb_root_label', value: 'Tavern Journal' },
  { name: 'blog_page_article_labels_video_eyebrow', value: 'Field footage' },
  { name: 'blog_page_article_labels_video_open_label', value: 'Open video' },
  { name: 'blog_page_article_labels_video_iframe_title', value: 'Article video' },
  { name: 'blog_page_article_labels_video_fallback_label', value: 'Watch the linked video' },
  { name: 'blog_page_article_labels_article_image_fallback_alt', value: 'Article image' },
  { name: 'blog_page_article_labels_empty_body_text', value: 'This dispatch is being prepared by the tavern team.' },
  { name: 'blog_page_article_labels_related_eyebrow', value: 'More from the board' },
  { name: 'blog_page_article_labels_related_title', value: 'Related dispatches' },
  { name: 'blog_page_article_c_t_a_eyebrow', value: 'Create next' },
  { name: 'blog_page_article_c_t_a_title', value: 'Ready to build your own artifact?' },
  {
    name: 'blog_page_article_c_t_a_text',
    value: 'Start in the Workbench, browse public models, or collect a themed bundle for your next scene.',
  },
  { name: 'blog_page_article_c_t_a_primary_c_t_a_label', value: 'Open Studio' },
  { name: 'blog_page_article_c_t_a_primary_c_t_a_href', value: '/workbench' },
  { name: 'blog_page_article_c_t_a_secondary_c_t_a_label', value: 'Browse Bundles' },
  { name: 'blog_page_article_c_t_a_secondary_c_t_a_href', value: '/bundles' },
]

const quote = (value: string) => value.replace(/'/g, "''")

const upStatements = requiredTextColumns.flatMap(({ name, value }) => [
  `ALTER TABLE formal_pages ADD COLUMN IF NOT EXISTS ${name} varchar`,
  `ALTER TABLE formal_pages ALTER COLUMN ${name} SET DEFAULT '${quote(value)}'`,
  `UPDATE formal_pages SET ${name} = '${quote(value)}' WHERE ${name} IS NULL`,
  `ALTER TABLE formal_pages ALTER COLUMN ${name} SET NOT NULL`,
])

const downStatements = requiredTextColumns.map(({ name }) => `ALTER TABLE formal_pages DROP COLUMN IF EXISTS ${name}`)

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await executeStatements(db, upStatements)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await executeStatements(db, downStatements)
}
