import {
  type MigrateDownArgs,
  type MigrateUpArgs,
  executeStatement,
  hasColumn,
} from '../lib/migrations/postgresUtils'

const addColumnStatements = [
  `ALTER TABLE homepage_items ADD COLUMN rail_variant TEXT DEFAULT 'standard'`,
  `ALTER TABLE homepage_items_locales ADD COLUMN item_count_label TEXT`,
  `ALTER TABLE _homepage_items_v ADD COLUMN version_rail_variant TEXT DEFAULT 'standard'`,
  `ALTER TABLE _homepage_items_v_locales ADD COLUMN version_item_count_label TEXT`,
  `ALTER TABLE homepage_content ADD COLUMN featured_rail_eyebrow TEXT DEFAULT 'Featured images'`,
  `ALTER TABLE homepage_content ADD COLUMN featured_rail_title TEXT DEFAULT 'New Product'`,
  `ALTER TABLE homepage_content ADD COLUMN featured_rail_search_label TEXT DEFAULT 'Search'`,
  `ALTER TABLE homepage_content ADD COLUMN featured_rail_more_label TEXT DEFAULT 'More'`,
  `ALTER TABLE homepage_content ADD COLUMN collection_shelf_title TEXT DEFAULT 'Followed'`,
  `ALTER TABLE homepage_content ADD COLUMN collection_shelf_hot_label TEXT DEFAULT 'Hot'`,
  `ALTER TABLE homepage_content ADD COLUMN collection_shelf_new_label TEXT DEFAULT 'New'`,
  `ALTER TABLE homepage_content ADD COLUMN collection_shelf_more_label TEXT DEFAULT 'More'`,
  `ALTER TABLE homepage_content ADD COLUMN collection_shelf_all_label TEXT DEFAULT 'All Followed'`,
] as const

async function addColumnIfMissing(args: {
  db: MigrateUpArgs['db']
  statement: string
  table: string
  column: string
}) {
  const { column, db, statement, table } = args

  if (await hasColumn(db, table, column)) {
    return
  }

  await executeStatement(db, statement)
}

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await addColumnIfMissing({
    column: 'rail_variant',
    db,
    statement: addColumnStatements[0],
    table: 'homepage_items',
  })
  await addColumnIfMissing({
    column: 'item_count_label',
    db,
    statement: addColumnStatements[1],
    table: 'homepage_items_locales',
  })
  await addColumnIfMissing({
    column: 'version_rail_variant',
    db,
    statement: addColumnStatements[2],
    table: '_homepage_items_v',
  })
  await addColumnIfMissing({
    column: 'version_item_count_label',
    db,
    statement: addColumnStatements[3],
    table: '_homepage_items_v_locales',
  })
  await addColumnIfMissing({
    column: 'featured_rail_eyebrow',
    db,
    statement: addColumnStatements[4],
    table: 'homepage_content',
  })
  await addColumnIfMissing({
    column: 'featured_rail_title',
    db,
    statement: addColumnStatements[5],
    table: 'homepage_content',
  })
  await addColumnIfMissing({
    column: 'featured_rail_search_label',
    db,
    statement: addColumnStatements[6],
    table: 'homepage_content',
  })
  await addColumnIfMissing({
    column: 'featured_rail_more_label',
    db,
    statement: addColumnStatements[7],
    table: 'homepage_content',
  })
  await addColumnIfMissing({
    column: 'collection_shelf_title',
    db,
    statement: addColumnStatements[8],
    table: 'homepage_content',
  })
  await addColumnIfMissing({
    column: 'collection_shelf_hot_label',
    db,
    statement: addColumnStatements[9],
    table: 'homepage_content',
  })
  await addColumnIfMissing({
    column: 'collection_shelf_new_label',
    db,
    statement: addColumnStatements[10],
    table: 'homepage_content',
  })
  await addColumnIfMissing({
    column: 'collection_shelf_more_label',
    db,
    statement: addColumnStatements[11],
    table: 'homepage_content',
  })
  await addColumnIfMissing({
    column: 'collection_shelf_all_label',
    db,
    statement: addColumnStatements[12],
    table: 'homepage_content',
  })
}

export async function down({}: MigrateDownArgs): Promise<void> {
  // SQLite does not support safe column drops for this live schema shape.
  // Keep down as a no-op and rely on forward-only formal migrations.
}
