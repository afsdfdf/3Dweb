import 'dotenv/config'

import fs from 'node:fs'
import pg from 'pg'

const APPLY = process.argv.includes('--apply')

const TABLES = [
  'payload_locked_documents_rels',
  'payload_locked_documents',
  '_model_bundles_v_version_tags_locales',
  '_model_bundles_v_version_tags',
  '_model_bundles_v_rels',
  '_model_bundles_v_locales',
  '_model_bundles_v',
  'model_bundles_tags_locales',
  'model_bundles_tags',
  'model_bundles_rels',
  'model_bundles_locales',
  'model_bundles',
  '_homepage_items_v_locales',
  '_homepage_items_v',
  'homepage_items_locales',
  'homepage_items',
  'model_comments',
  'model_favorites',
  'model_likes',
  'user_follows',
  'engagement_views',
  'shopify_payments',
  'print_orders',
  'task_events',
  'models_formats',
  'models_tags',
  'models',
  'generation_tasks',
  'media',
]

const SEQUENCES = [
  'media_id_seq',
  'models_id_seq',
  'models_formats_id_seq',
  'generation_tasks_id_seq',
  'task_events_id_seq',
  'print_orders_id_seq',
  'shopify_payments_id_seq',
  'engagement_views_id_seq',
  'model_comments_id_seq',
  'model_favorites_id_seq',
  'model_likes_id_seq',
  'user_follows_id_seq',
]

const quoteIdent = (value) => JSON.stringify(value)

async function exists(client, type, name) {
  const result = await client.query('select to_regclass($1) as regclass', [`public.${name}`])
  return Boolean(result.rows[0]?.regclass)
}

async function countRows(client, table) {
  const result = await client.query(`select count(*)::int as count from public.${quoteIdent(table)}`)
  return result.rows[0].count
}

async function exportBackup(client, tables) {
  const backup = {
    createdAt: new Date().toISOString(),
    mode: 'user-resource-cleanup',
    tables: {},
  }

  for (const table of tables) {
    if (!(await exists(client, 'table', table))) continue
    const result = await client.query(`select * from public.${quoteIdent(table)} order by 1`)
    backup.tables[table] = result.rows
  }

  const file = `database-user-resource-cleanup-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
  fs.writeFileSync(file, JSON.stringify(backup, null, 2), 'utf8')
  return file
}

async function resetUserSocialCounters(client) {
  const result = await client.query(`
    select column_name
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'users'
      and column_name in ('followers_count', 'following_count', 'profile_view_count')
  `)

  const columns = result.rows.map((row) => row.column_name)
  if (columns.length === 0) return

  await client.query(`update public.users set ${columns.map((column) => `${quoteIdent(column)} = 0`).join(', ')}`)
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required.')
  }

  const client = new pg.Client({ connectionString: process.env.DATABASE_URL })
  await client.connect()

  try {
    const before = {}
    for (const table of TABLES) {
      if (!(await exists(client, 'table', table))) continue
      before[table] = await countRows(client, table)
    }

    if (!APPLY) {
      console.log(JSON.stringify({ apply: false, before }, null, 2))
      return
    }

    const backupFile = await exportBackup(client, TABLES)
    const deleted = {}
    const after = {}

    await client.query('begin')
    try {
      for (const table of TABLES) {
        if (!(await exists(client, 'table', table))) continue
        const result = await client.query(`delete from public.${quoteIdent(table)}`)
        deleted[table] = result.rowCount ?? 0
      }

      await resetUserSocialCounters(client)

      for (const sequence of SEQUENCES) {
        if (!(await exists(client, 'sequence', sequence))) continue
        await client.query(`alter sequence public.${quoteIdent(sequence)} restart with 1`)
      }

      for (const table of TABLES) {
        if (!(await exists(client, 'table', table))) continue
        after[table] = await countRows(client, table)
      }

      await client.query('commit')
    } catch (error) {
      await client.query('rollback')
      throw error
    }

    console.log(JSON.stringify({ apply: true, backupFile, before, deleted, after }, null, 2))
  } finally {
    await client.end()
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
