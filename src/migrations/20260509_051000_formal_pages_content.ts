import { type MigrateDownArgs, type MigrateUpArgs, executeStatements } from '../lib/migrations/postgresUtils'

const upStatements = [
  `
    DO $$
    BEGIN
      CREATE TYPE enum_formal_pages_info_pages_page_key AS ENUM (
        'about',
        'contact',
        'privacyPolicy',
        'refundPolicy',
        'shippingPolicy'
      );
    EXCEPTION WHEN duplicate_object THEN NULL;
    END
    $$
  `,
  `
    DO $$
    BEGIN
      CREATE TYPE enum_formal_pages_marketing_pages_page_key AS ENUM (
        'features',
        'solutions',
        'resources',
        'developers',
        'pricing',
        'showcase'
      );
    EXCEPTION WHEN duplicate_object THEN NULL;
    END
    $$
  `,
  `
    CREATE TABLE IF NOT EXISTS formal_pages (
      id serial PRIMARY KEY,
      updated_at timestamp(3) with time zone,
      created_at timestamp(3) with time zone
    )
  `,
  `
    CREATE TABLE IF NOT EXISTS formal_pages_info_pages (
      _order integer NOT NULL,
      _parent_id integer NOT NULL,
      id varchar PRIMARY KEY,
      page_key enum_formal_pages_info_pages_page_key NOT NULL,
      current_path varchar NOT NULL,
      hero_eyebrow varchar NOT NULL,
      hero_title varchar NOT NULL,
      hero_text varchar NOT NULL,
      last_updated varchar NOT NULL,
      hero_primary_c_t_a_label varchar NOT NULL,
      hero_primary_c_t_a_href varchar NOT NULL,
      hero_secondary_c_t_a_label varchar NOT NULL,
      hero_secondary_c_t_a_href varchar NOT NULL,
      CONSTRAINT formal_pages_info_pages_parent_id_fk
        FOREIGN KEY (_parent_id)
        REFERENCES formal_pages(id)
        ON DELETE CASCADE
    )
  `,
  `CREATE INDEX IF NOT EXISTS formal_pages_info_pages_order_idx ON formal_pages_info_pages(_order)`,
  `CREATE INDEX IF NOT EXISTS formal_pages_info_pages_parent_id_idx ON formal_pages_info_pages(_parent_id)`,
  `
    CREATE TABLE IF NOT EXISTS formal_pages_info_pages_summary_cards (
      _order integer NOT NULL,
      _parent_id varchar NOT NULL,
      id varchar PRIMARY KEY,
      title varchar NOT NULL,
      body varchar NOT NULL,
      CONSTRAINT formal_pages_info_pages_summary_cards_parent_id_fk
        FOREIGN KEY (_parent_id)
        REFERENCES formal_pages_info_pages(id)
        ON DELETE CASCADE
    )
  `,
  `CREATE INDEX IF NOT EXISTS formal_pages_info_pages_summary_cards_order_idx ON formal_pages_info_pages_summary_cards(_order)`,
  `CREATE INDEX IF NOT EXISTS formal_pages_info_pages_summary_cards_parent_id_idx ON formal_pages_info_pages_summary_cards(_parent_id)`,
  `
    CREATE TABLE IF NOT EXISTS formal_pages_info_pages_sections (
      _order integer NOT NULL,
      _parent_id varchar NOT NULL,
      id varchar PRIMARY KEY,
      title varchar NOT NULL,
      body varchar NOT NULL,
      CONSTRAINT formal_pages_info_pages_sections_parent_id_fk
        FOREIGN KEY (_parent_id)
        REFERENCES formal_pages_info_pages(id)
        ON DELETE CASCADE
    )
  `,
  `CREATE INDEX IF NOT EXISTS formal_pages_info_pages_sections_order_idx ON formal_pages_info_pages_sections(_order)`,
  `CREATE INDEX IF NOT EXISTS formal_pages_info_pages_sections_parent_id_idx ON formal_pages_info_pages_sections(_parent_id)`,
  `
    CREATE TABLE IF NOT EXISTS formal_pages_info_pages_sections_items (
      _order integer NOT NULL,
      _parent_id varchar NOT NULL,
      id varchar PRIMARY KEY,
      title varchar NOT NULL,
      body varchar NOT NULL,
      CONSTRAINT formal_pages_info_pages_sections_items_parent_id_fk
        FOREIGN KEY (_parent_id)
        REFERENCES formal_pages_info_pages_sections(id)
        ON DELETE CASCADE
    )
  `,
  `CREATE INDEX IF NOT EXISTS formal_pages_info_pages_sections_items_order_idx ON formal_pages_info_pages_sections_items(_order)`,
  `CREATE INDEX IF NOT EXISTS formal_pages_info_pages_sections_items_parent_id_idx ON formal_pages_info_pages_sections_items(_parent_id)`,
  `
    CREATE TABLE IF NOT EXISTS formal_pages_info_pages_contact_cards (
      _order integer NOT NULL,
      _parent_id varchar NOT NULL,
      id varchar PRIMARY KEY,
      title varchar NOT NULL,
      body varchar NOT NULL,
      label varchar NOT NULL,
      href varchar,
      CONSTRAINT formal_pages_info_pages_contact_cards_parent_id_fk
        FOREIGN KEY (_parent_id)
        REFERENCES formal_pages_info_pages(id)
        ON DELETE CASCADE
    )
  `,
  `CREATE INDEX IF NOT EXISTS formal_pages_info_pages_contact_cards_order_idx ON formal_pages_info_pages_contact_cards(_order)`,
  `CREATE INDEX IF NOT EXISTS formal_pages_info_pages_contact_cards_parent_id_idx ON formal_pages_info_pages_contact_cards(_parent_id)`,
  `
    CREATE TABLE IF NOT EXISTS formal_pages_marketing_pages (
      _order integer NOT NULL,
      _parent_id integer NOT NULL,
      id varchar PRIMARY KEY,
      page_key enum_formal_pages_marketing_pages_page_key NOT NULL,
      current_path varchar NOT NULL,
      hero_eyebrow varchar NOT NULL,
      hero_title varchar NOT NULL,
      hero_text varchar NOT NULL,
      hero_primary_c_t_a_label varchar NOT NULL,
      hero_primary_c_t_a_href varchar NOT NULL,
      hero_secondary_c_t_a_label varchar NOT NULL,
      hero_secondary_c_t_a_href varchar NOT NULL,
      CONSTRAINT formal_pages_marketing_pages_parent_id_fk
        FOREIGN KEY (_parent_id)
        REFERENCES formal_pages(id)
        ON DELETE CASCADE
    )
  `,
  `CREATE INDEX IF NOT EXISTS formal_pages_marketing_pages_order_idx ON formal_pages_marketing_pages(_order)`,
  `CREATE INDEX IF NOT EXISTS formal_pages_marketing_pages_parent_id_idx ON formal_pages_marketing_pages(_parent_id)`,
  `
    CREATE TABLE IF NOT EXISTS formal_pages_marketing_pages_sections (
      _order integer NOT NULL,
      _parent_id varchar NOT NULL,
      id varchar PRIMARY KEY,
      anchor_id varchar NOT NULL,
      eyebrow varchar NOT NULL,
      title varchar NOT NULL,
      text varchar NOT NULL,
      CONSTRAINT formal_pages_marketing_pages_sections_parent_id_fk
        FOREIGN KEY (_parent_id)
        REFERENCES formal_pages_marketing_pages(id)
        ON DELETE CASCADE
    )
  `,
  `CREATE INDEX IF NOT EXISTS formal_pages_marketing_pages_sections_order_idx ON formal_pages_marketing_pages_sections(_order)`,
  `CREATE INDEX IF NOT EXISTS formal_pages_marketing_pages_sections_parent_id_idx ON formal_pages_marketing_pages_sections(_parent_id)`,
  `
    CREATE TABLE IF NOT EXISTS formal_pages_marketing_pages_sections_cards (
      _order integer NOT NULL,
      _parent_id varchar NOT NULL,
      id varchar PRIMARY KEY,
      title varchar NOT NULL,
      text varchar NOT NULL,
      note varchar,
      CONSTRAINT formal_pages_marketing_pages_sections_cards_parent_id_fk
        FOREIGN KEY (_parent_id)
        REFERENCES formal_pages_marketing_pages_sections(id)
        ON DELETE CASCADE
    )
  `,
  `CREATE INDEX IF NOT EXISTS formal_pages_marketing_pages_sections_cards_order_idx ON formal_pages_marketing_pages_sections_cards(_order)`,
  `CREATE INDEX IF NOT EXISTS formal_pages_marketing_pages_sections_cards_parent_id_idx ON formal_pages_marketing_pages_sections_cards(_parent_id)`,
  `
    CREATE TABLE IF NOT EXISTS formal_pages_marketing_pages_sections_bullets (
      _order integer NOT NULL,
      _parent_id varchar NOT NULL,
      id varchar PRIMARY KEY,
      label varchar NOT NULL,
      CONSTRAINT formal_pages_marketing_pages_sections_bullets_parent_id_fk
        FOREIGN KEY (_parent_id)
        REFERENCES formal_pages_marketing_pages_sections(id)
        ON DELETE CASCADE
    )
  `,
  `CREATE INDEX IF NOT EXISTS formal_pages_marketing_pages_sections_bullets_order_idx ON formal_pages_marketing_pages_sections_bullets(_order)`,
  `CREATE INDEX IF NOT EXISTS formal_pages_marketing_pages_sections_bullets_parent_id_idx ON formal_pages_marketing_pages_sections_bullets(_parent_id)`,
] as const

const downStatements = [
  `DROP TABLE IF EXISTS formal_pages_marketing_pages_sections_bullets`,
  `DROP TABLE IF EXISTS formal_pages_marketing_pages_sections_cards`,
  `DROP TABLE IF EXISTS formal_pages_marketing_pages_sections`,
  `DROP TABLE IF EXISTS formal_pages_marketing_pages`,
  `DROP TABLE IF EXISTS formal_pages_info_pages_contact_cards`,
  `DROP TABLE IF EXISTS formal_pages_info_pages_sections_items`,
  `DROP TABLE IF EXISTS formal_pages_info_pages_sections`,
  `DROP TABLE IF EXISTS formal_pages_info_pages_summary_cards`,
  `DROP TABLE IF EXISTS formal_pages_info_pages`,
  `DROP TABLE IF EXISTS formal_pages`,
  `DROP TYPE IF EXISTS enum_formal_pages_marketing_pages_page_key`,
  `DROP TYPE IF EXISTS enum_formal_pages_info_pages_page_key`,
] as const

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await executeStatements(db, upStatements)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await executeStatements(db, downStatements)
}
