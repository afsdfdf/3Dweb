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
    column: 'public_access',
    db,
    statement: `ALTER TABLE media ADD COLUMN public_access INTEGER DEFAULT 0`,
    table: 'media',
  })
  await addColumnIfMissing({
    column: 'image_generation_default_provider',
    db,
    statement: `ALTER TABLE ai_provider_settings ADD COLUMN image_generation_default_provider TEXT DEFAULT 'gemini-official'`,
    table: 'ai_provider_settings',
  })
  await addColumnIfMissing({
    column: 'image_generation_timeout_seconds',
    db,
    statement: `ALTER TABLE ai_provider_settings ADD COLUMN image_generation_timeout_seconds NUMERIC DEFAULT 60`,
    table: 'ai_provider_settings',
  })
  await addColumnIfMissing({
    column: 'image_generation_official_base_u_r_l',
    db,
    statement: `ALTER TABLE ai_provider_settings ADD COLUMN image_generation_official_base_u_r_l TEXT DEFAULT 'https://generativelanguage.googleapis.com'`,
    table: 'ai_provider_settings',
  })
  await addColumnIfMissing({
    column: 'image_generation_official_model',
    db,
    statement: `ALTER TABLE ai_provider_settings ADD COLUMN image_generation_official_model TEXT DEFAULT 'gemini-2.5-flash-image-preview'`,
    table: 'ai_provider_settings',
  })
  await addColumnIfMissing({
    column: 'image_generation_official_api_key',
    db,
    statement: `ALTER TABLE ai_provider_settings ADD COLUMN image_generation_official_api_key TEXT`,
    table: 'ai_provider_settings',
  })
  await addColumnIfMissing({
    column: 'image_generation_third_party_base_u_r_l',
    db,
    statement: `ALTER TABLE ai_provider_settings ADD COLUMN image_generation_third_party_base_u_r_l TEXT`,
    table: 'ai_provider_settings',
  })
  await addColumnIfMissing({
    column: 'image_generation_third_party_model',
    db,
    statement: `ALTER TABLE ai_provider_settings ADD COLUMN image_generation_third_party_model TEXT`,
    table: 'ai_provider_settings',
  })
  await addColumnIfMissing({
    column: 'image_generation_third_party_api_key',
    db,
    statement: `ALTER TABLE ai_provider_settings ADD COLUMN image_generation_third_party_api_key TEXT`,
    table: 'ai_provider_settings',
  })
}

export async function down({}: MigrateDownArgs): Promise<void> {
  // SQLite does not support safe column drops for this live schema shape.
}
