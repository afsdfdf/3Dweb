import { type MigrateDownArgs, type MigrateUpArgs, executeStatements } from '../lib/migrations/postgresUtils'

const footerDirectionTitle = 'Evolving from an AI generation tool into an operable product website'
const footerAboutText =
  'Thorns Tavern connects character generation, model management, digital delivery, and print orders into one product workflow so teams can operate 3D assets like a real business.'

const upStatements = [
  `
    CREATE TABLE IF NOT EXISTS site_settings_footer_link_groups (
      _order integer NOT NULL,
      _parent_id integer NOT NULL,
      id varchar PRIMARY KEY,
      title varchar NOT NULL,
      aria_label varchar,
      helper_text varchar,
      CONSTRAINT site_settings_footer_link_groups_parent_id_fk
        FOREIGN KEY (_parent_id)
        REFERENCES site_settings(id)
        ON DELETE CASCADE
    )
  `,
  `CREATE INDEX IF NOT EXISTS site_settings_footer_link_groups_order_idx ON site_settings_footer_link_groups(_order)`,
  `CREATE INDEX IF NOT EXISTS site_settings_footer_link_groups_parent_id_idx ON site_settings_footer_link_groups(_parent_id)`,
  `
    CREATE TABLE IF NOT EXISTS site_settings_footer_link_groups_links (
      _order integer NOT NULL,
      _parent_id varchar NOT NULL,
      id varchar PRIMARY KEY,
      label varchar NOT NULL,
      href varchar NOT NULL,
      CONSTRAINT site_settings_footer_link_groups_links_parent_id_fk
        FOREIGN KEY (_parent_id)
        REFERENCES site_settings_footer_link_groups(id)
        ON DELETE CASCADE
    )
  `,
  `CREATE INDEX IF NOT EXISTS site_settings_footer_link_groups_links_order_idx ON site_settings_footer_link_groups_links(_order)`,
  `CREATE INDEX IF NOT EXISTS site_settings_footer_link_groups_links_parent_id_idx ON site_settings_footer_link_groups_links(_parent_id)`,
  `
    INSERT INTO site_settings_footer_link_groups (_order, _parent_id, id, title, aria_label, helper_text)
    SELECT 0, site_settings.id, CONCAT('default-information-', site_settings.id), 'Information', 'Footer information', '${footerDirectionTitle.replace(/'/g, "''")}'
    FROM site_settings
    ON CONFLICT (id) DO NOTHING
  `,
  `
    INSERT INTO site_settings_footer_link_groups (_order, _parent_id, id, title, aria_label, helper_text)
    SELECT 1, site_settings.id, CONCAT('default-help-', site_settings.id), 'Help customers', 'Footer customer help', '${footerAboutText.replace(/'/g, "''")}'
    FROM site_settings
    ON CONFLICT (id) DO NOTHING
  `,
  `
    INSERT INTO site_settings_footer_link_groups_links (_order, _parent_id, id, label, href)
    SELECT link_data._order, CONCAT('default-information-', site_settings.id), CONCAT('default-information-', site_settings.id, '-', link_data.key), link_data.label, link_data.href
    FROM site_settings
    CROSS JOIN (
      VALUES
        (0, 'about', 'About', '/about'),
        (1, 'blog', 'Blog', '/blog'),
        (2, 'privacy', 'Privacy Policy', '/privacy-policy'),
        (3, 'refund', 'Refund Policy', '/refund-policy')
    ) AS link_data(_order, key, label, href)
    ON CONFLICT (id) DO NOTHING
  `,
  `
    INSERT INTO site_settings_footer_link_groups_links (_order, _parent_id, id, label, href)
    SELECT link_data._order, CONCAT('default-help-', site_settings.id), CONCAT('default-help-', site_settings.id, '-', link_data.key), link_data.label, link_data.href
    FROM site_settings
    CROSS JOIN LATERAL (
      VALUES
        (0, 'contact', 'Contact', '/contact'),
        (1, 'shipping', 'Shipping Policy', '/shipping-policy'),
        (2, 'support', COALESCE(NULLIF(site_settings.support_email, ''), 'support@example.com'), CONCAT('mailto:', COALESCE(NULLIF(site_settings.support_email, ''), 'support@example.com')))
    ) AS link_data(_order, key, label, href)
    ON CONFLICT (id) DO NOTHING
  `,
]

const downStatements = [
  `DROP TABLE IF EXISTS site_settings_footer_link_groups_links`,
  `DROP TABLE IF EXISTS site_settings_footer_link_groups`,
]

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await executeStatements(db, upStatements)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await executeStatements(db, downStatements)
}
