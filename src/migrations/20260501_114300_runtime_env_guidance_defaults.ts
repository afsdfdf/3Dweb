import { type MigrateDownArgs, type MigrateUpArgs, executeStatements } from '../lib/migrations/postgresUtils'

const currentCredentialsNotice =
  'Provider API keys should prefer environment variables or a secret manager. Meshy and image-generation keys may be stored here only when operators need backend-admin override; keys are never sent to the frontend.'

const previousCredentialsNotice =
  'Meshy API key, AI webhook secret, and Supabase service credentials are no longer stored in Payload globals. Configure them in your hosting environment or secret manager instead.'

const upStatements = [
  `ALTER TABLE runtime_deployment_settings ALTER COLUMN database_connection_mode SET DEFAULT 'database-url'`,
  `ALTER TABLE ai_provider_settings ALTER COLUMN credentials_notice SET DEFAULT '${currentCredentialsNotice.replace(/'/g, "''")}'`,
]

const downStatements = [
  `ALTER TABLE runtime_deployment_settings ALTER COLUMN database_connection_mode SET DEFAULT 'aws-rds-fields'`,
  `ALTER TABLE ai_provider_settings ALTER COLUMN credentials_notice SET DEFAULT '${previousCredentialsNotice.replace(/'/g, "''")}'`,
]

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await executeStatements(db, upStatements)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await executeStatements(db, downStatements)
}
