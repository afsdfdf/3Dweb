import { type MigrateDownArgs, type MigrateUpArgs, executeStatement } from './postgresUtils'

const ACTIVE_TASK_INDEX = `
  CREATE INDEX IF NOT EXISTS generation_tasks_active_by_user_idx
  ON generation_tasks(user_id, created_at DESC)
  WHERE status IN ('queued', 'processing')
`

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await executeStatement(db, ACTIVE_TASK_INDEX)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await executeStatement(db, 'DROP INDEX IF EXISTS generation_tasks_active_by_user_idx')
}
