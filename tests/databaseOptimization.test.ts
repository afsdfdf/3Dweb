import test from 'node:test'
import assert from 'node:assert/strict'

import { BillingSubscriptions } from '../src/collections/BillingSubscriptions.ts'
import { GenerationTasks } from '../src/collections/GenerationTasks.ts'
import { ShopifyPayments } from '../src/collections/ShopifyPayments.ts'
import { Users } from '../src/collections/Users.ts'
import { readPostgresPoolConfig, resolveDatabaseRuntimeConfig } from '../src/lib/databaseRuntimeConfig.ts'
import { TASK_DETAIL_QUERY_DEPTH } from '../src/lib/queryDefaults.ts'

const withEnv = async (
  nextEnv: Record<string, string | undefined>,
  fn: () => Promise<void> | void,
) => {
  const previous = new Map<string, string | undefined>()

  for (const key of Object.keys(nextEnv)) {
    previous.set(key, process.env[key])
    const nextValue = nextEnv[key]

    if (nextValue === undefined) {
      delete process.env[key]
    } else {
      process.env[key] = nextValue
    }
  }

  try {
    await fn()
  } finally {
    for (const [key, value] of previous.entries()) {
      if (value === undefined) {
        delete process.env[key]
      } else {
        process.env[key] = value
      }
    }
  }
}

test('critical payment and webhook lookup fields are indexed in collection config', () => {
  const userStripeField = Users.fields.find((field: any) => field.name === 'stripeCustomerId') as any
  const providerTaskField = GenerationTasks.fields.find((field: any) => field.name === 'providerTaskId') as any
  const checkoutField = ShopifyPayments.fields.find((field: any) => field.name === 'shopifyCheckoutId') as any
  const subscriptionCustomerField = BillingSubscriptions.fields.find((field: any) => field.name === 'stripeCustomerId') as any

  assert.equal(userStripeField?.index, true)
  assert.equal(providerTaskField?.index, true)
  assert.equal(checkoutField?.index, true)
  assert.equal(subscriptionCustomerField?.index, true)
})

test('PostgreSQL pool config uses safe RDS defaults', () => {
  assert.deepEqual(readPostgresPoolConfig(), {
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    max: 20,
    min: 2,
  })
})

test('resolveDatabaseRuntimeConfig returns postgres mode with pool config when DATABASE_PROVIDER=postgres', async () => {
  await withEnv(
    {
      DATABASE_PROVIDER: 'postgres',
      DATABASE_URL: 'postgresql://user:pass@db.example.com:5432/app?sslmode=require',
      POSTGRES_POOL_CONNECTION_TIMEOUT_MS: '6000',
      POSTGRES_POOL_IDLE_TIMEOUT_MS: '45000',
      POSTGRES_POOL_MAX: '25',
      POSTGRES_POOL_MIN: '3',
    },
    async () => {
      const result = resolveDatabaseRuntimeConfig()

      assert.equal(result.provider, 'postgres')
      if (result.provider === 'postgres') {
        assert.equal(result.pool.connectionTimeoutMillis, 6000)
        assert.equal(result.pool.idleTimeoutMillis, 45000)
        assert.equal(result.pool.max, 25)
        assert.equal(result.pool.min, 3)
      }
    },
  )
})

test('task detail query depth is limited to direct relations only', () => {
  assert.equal(TASK_DETAIL_QUERY_DEPTH, 1)
})
