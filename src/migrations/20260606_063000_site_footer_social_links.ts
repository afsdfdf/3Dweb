import { type MigrateDownArgs, type MigrateUpArgs, executeStatements } from '../lib/migrations/postgresUtils'

const upStatements = [
  `
    CREATE TABLE IF NOT EXISTS site_settings_footer_social_links (
      _order integer NOT NULL,
      _parent_id integer NOT NULL,
      id varchar PRIMARY KEY,
      platform varchar DEFAULT 'x',
      label varchar NOT NULL,
      href varchar NOT NULL,
      enabled boolean DEFAULT true,
      CONSTRAINT site_settings_footer_social_links_parent_id_fk
        FOREIGN KEY (_parent_id)
        REFERENCES site_settings(id)
        ON DELETE CASCADE
    )
  `,
  `CREATE INDEX IF NOT EXISTS site_settings_footer_social_links_order_idx ON site_settings_footer_social_links(_order)`,
  `CREATE INDEX IF NOT EXISTS site_settings_footer_social_links_parent_id_idx ON site_settings_footer_social_links(_parent_id)`,
  `
    INSERT INTO site_settings_footer_social_links (_order, _parent_id, id, platform, label, href, enabled)
    SELECT social_data._order, site_settings.id, CONCAT('default-social-', site_settings.id, '-', social_data.key), social_data.platform, social_data.label, social_data.href, true
    FROM site_settings
    CROSS JOIN (
      VALUES
        (0, 'x', 'x', 'X', 'https://x.com/'),
        (1, 'facebook', 'facebook', 'Facebook', 'https://www.facebook.com/'),
        (2, 'instagram', 'instagram', 'Instagram', 'https://www.instagram.com/'),
        (3, 'youtube', 'youtube', 'YouTube', 'https://www.youtube.com/')
    ) AS social_data(_order, key, platform, label, href)
    ON CONFLICT (id) DO NOTHING
  `,
  `
    UPDATE site_settings_footer_link_groups
    SET title = 'INFORMATION'
    WHERE id LIKE 'default-information-%'
  `,
  `
    UPDATE site_settings_footer_link_groups
    SET title = 'Help Customers'
    WHERE id LIKE 'default-help-%'
  `,
  `
    DELETE FROM site_settings_footer_link_groups_links
    WHERE id LIKE 'default-information-%-about'
       OR id LIKE 'default-information-%-blog'
  `,
  `
    UPDATE site_settings_footer_link_groups_links
    SET _order = 0, label = 'Refund Policy', href = '/refund-policy'
    WHERE id LIKE 'default-information-%-refund'
  `,
  `
    UPDATE site_settings_footer_link_groups_links
    SET _order = 2, label = 'Privacy Policy', href = '/privacy-policy'
    WHERE id LIKE 'default-information-%-privacy'
  `,
  `
    INSERT INTO site_settings_footer_link_groups_links (_order, _parent_id, id, label, href)
    SELECT 1, footer_group.id, CONCAT(footer_group.id, '-shipping'), 'Shipping Policy', '/shipping-policy'
    FROM site_settings_footer_link_groups AS footer_group
    WHERE footer_group.id LIKE 'default-information-%'
    ON CONFLICT (id) DO NOTHING
  `,
  `
    INSERT INTO site_settings_footer_link_groups_links (_order, _parent_id, id, label, href)
    SELECT 3, footer_group.id, CONCAT(footer_group.id, '-contact'), 'Contact Us', '/contact'
    FROM site_settings_footer_link_groups AS footer_group
    WHERE footer_group.id LIKE 'default-information-%'
    ON CONFLICT (id) DO NOTHING
  `,
  `
    DELETE FROM site_settings_footer_link_groups_links
    WHERE id LIKE 'default-help-%-contact'
       OR id LIKE 'default-help-%-shipping'
  `,
  `
    UPDATE site_settings_footer_link_groups_links AS footer_link
    SET _order = 0,
      label = COALESCE(NULLIF(site_settings.support_email, ''), 'support@example.com'),
      href = CONCAT('mailto:', COALESCE(NULLIF(site_settings.support_email, ''), 'support@example.com'))
    FROM site_settings_footer_link_groups AS footer_group
    INNER JOIN site_settings ON site_settings.id = footer_group._parent_id
    WHERE footer_link._parent_id = footer_group.id
      AND footer_link.id LIKE 'default-help-%-support'
  `,
]

const downStatements = [
  `DROP TABLE IF EXISTS site_settings_footer_social_links`,
]

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await executeStatements(db, upStatements)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await executeStatements(db, downStatements)
}
