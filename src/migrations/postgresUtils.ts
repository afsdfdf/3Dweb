import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

type MigrationDB = MigrateUpArgs['db'] | MigrateDownArgs['db']

export type { MigrateDownArgs, MigrateUpArgs }
export { sql }

export async function executeStatement(db: MigrationDB, statement: string) {
  await db.execute(sql.raw(statement))
}

export async function executeStatements(db: MigrationDB, statements: readonly string[]) {
  for (const statement of statements) {
    await executeStatement(db, statement)
  }
}

export async function hasColumn(db: MigrationDB, table: string, column: string) {
  const result = await db.execute(sql`
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = ${table}
      AND column_name = ${column}
    LIMIT 1
  `)

  return (result.rows?.length ?? 0) > 0
}
