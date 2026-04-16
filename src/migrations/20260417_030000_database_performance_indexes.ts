import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

const upStatements = [
  'CREATE INDEX IF NOT EXISTS users_stripe_customer_id_idx ON users(stripe_customer_id)',
  'CREATE INDEX IF NOT EXISTS generation_tasks_provider_task_id_idx ON generation_tasks(provider_task_id)',
  'CREATE INDEX IF NOT EXISTS shopify_payments_shopify_checkout_id_idx ON shopify_payments(shopify_checkout_id)',
  'CREATE INDEX IF NOT EXISTS billing_subscriptions_stripe_customer_id_idx ON billing_subscriptions(stripe_customer_id)',
]

const downStatements = [
  'DROP INDEX IF EXISTS users_stripe_customer_id_idx',
  'DROP INDEX IF EXISTS generation_tasks_provider_task_id_idx',
  'DROP INDEX IF EXISTS shopify_payments_shopify_checkout_id_idx',
  'DROP INDEX IF EXISTS billing_subscriptions_stripe_customer_id_idx',
]

async function runStatements(db: MigrateUpArgs['db'] | MigrateDownArgs['db'], statements: string[]) {
  for (const statement of statements) {
    await db.run(sql.raw(statement))
  }
}

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await runStatements(db, upStatements)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await runStatements(db, downStatements)
}
