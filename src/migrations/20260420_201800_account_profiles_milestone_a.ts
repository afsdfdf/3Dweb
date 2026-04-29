import {
  type MigrateDownArgs,
  type MigrateUpArgs,
  executeStatement,
  hasColumn,
} from '../lib/migrations/postgresUtils'

async function addColumnIfMissing(args: {
  column: string
  db: MigrateUpArgs['db']
  statement: string
  table: string
}) {
  if (await hasColumn(args.db, args.table, args.column)) {
    return
  }

  await executeStatement(args.db, args.statement)
}

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await addColumnIfMissing({
    column: 'display_name',
    db,
    statement: `ALTER TABLE users ADD COLUMN display_name TEXT`,
    table: 'users',
  })
  await addColumnIfMissing({
    column: 'bio',
    db,
    statement: `ALTER TABLE users ADD COLUMN bio TEXT`,
    table: 'users',
  })
  await addColumnIfMissing({
    column: 'profile_background_id',
    db,
    statement: `ALTER TABLE users ADD COLUMN profile_background_id INTEGER`,
    table: 'users',
  })
  await addColumnIfMissing({
    column: 'avatar_frame',
    db,
    statement: `ALTER TABLE users ADD COLUMN avatar_frame TEXT DEFAULT 'none'`,
    table: 'users',
  })
  await addColumnIfMissing({
    column: 'profile_visibility',
    db,
    statement: `ALTER TABLE users ADD COLUMN profile_visibility TEXT DEFAULT 'private'`,
    table: 'users',
  })
  await addColumnIfMissing({
    column: 'profile_view_count',
    db,
    statement: `ALTER TABLE users ADD COLUMN profile_view_count NUMERIC DEFAULT 0`,
    table: 'users',
  })
  await addColumnIfMissing({
    column: 'followers_count',
    db,
    statement: `ALTER TABLE users ADD COLUMN followers_count NUMERIC DEFAULT 0`,
    table: 'users',
  })
  await addColumnIfMissing({
    column: 'following_count',
    db,
    statement: `ALTER TABLE users ADD COLUMN following_count NUMERIC DEFAULT 0`,
    table: 'users',
  })
}

export async function down({}: MigrateDownArgs): Promise<void> {
  // SQLite does not support safe column drops for this live schema shape.
}
