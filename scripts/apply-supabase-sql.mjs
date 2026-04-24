import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import pg from 'pg'

const { Client } = pg

function buildClientConfig(rawConnectionString) {
  const parsed = new URL(rawConnectionString)

  return {
    host: parsed.hostname,
    port: Number(parsed.port || 5432),
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: parsed.pathname.replace(/^\//, '') || 'postgres',
    ssl: { rejectUnauthorized: false },
  }
}

async function main() {
  const fileArg = process.argv[2]

  if (!fileArg) {
    throw new Error('Usage: node scripts/apply-supabase-sql.mjs <sql-file>')
  }

  const connectionString = process.env.POSTGRES_URL || process.env.POSTGRES_URL_NON_POOLING

  if (!connectionString) {
    throw new Error('POSTGRES_URL or POSTGRES_URL_NON_POOLING is required')
  }

  const sqlPath = path.resolve(process.cwd(), fileArg)
  const sql = await fs.readFile(sqlPath, 'utf8')

  const client = new Client(buildClientConfig(connectionString))

  try {
    await client.connect()
    await client.query(sql)
    console.log(`Applied SQL: ${sqlPath}`)
  } finally {
    await client.end().catch(() => {})
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
