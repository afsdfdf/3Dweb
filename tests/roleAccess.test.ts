import assert from 'node:assert/strict'
import test from 'node:test'

import { BillingSubscriptions } from '../src/collections/BillingSubscriptions.ts'
import { CreditTransactions } from '../src/collections/CreditTransactions.ts'
import { Credits } from '../src/collections/Credits.ts'
import { GenerationTasks } from '../src/collections/GenerationTasks.ts'
import { Models } from '../src/collections/Models.ts'
import { PrintOrders } from '../src/collections/PrintOrders.ts'
import { ShopifyPayments } from '../src/collections/ShopifyPayments.ts'
import { TaskEvents } from '../src/collections/TaskEvents.ts'
import { Users } from '../src/collections/Users.ts'
import { EmailSettings } from '../src/globals/EmailSettings.ts'
import { HomepageContent } from '../src/globals/HomepageContent.ts'
import { SiteSettings } from '../src/globals/SiteSettings.ts'

const createArgs = (role: 'admin' | 'customer' | 'operator') =>
  ({
    req: {
      user: {
        id: 1,
        role,
      },
    },
  }) as never

test('operator keeps admin panel access for operational collections and content', () => {
  assert.equal(Boolean(PrintOrders.access?.update?.(createArgs('operator'))), true)
  assert.equal(Boolean(HomepageContent.access?.update?.(createArgs('operator'))), true)
})

test('operator cannot update high-risk globals', () => {
  assert.equal(Boolean(SiteSettings.access?.update?.(createArgs('operator'))), false)
  assert.equal(Boolean(EmailSettings.access?.update?.(createArgs('operator'))), false)
})

test('operator cannot write high-sensitivity financial collections', () => {
  assert.equal(Boolean(Credits.access?.update?.(createArgs('operator'))), false)
  assert.equal(Boolean(CreditTransactions.access?.create?.(createArgs('operator'))), false)
  assert.equal(Boolean(BillingSubscriptions.access?.update?.(createArgs('operator'))), false)
  assert.equal(Boolean(ShopifyPayments.access?.update?.(createArgs('operator'))), false)
})

test('admin retains access to high-risk globals and financial writes', () => {
  assert.equal(Boolean(SiteSettings.access?.update?.(createArgs('admin'))), true)
  assert.equal(Boolean(EmailSettings.access?.update?.(createArgs('admin'))), true)
  assert.equal(Boolean(Credits.access?.update?.(createArgs('admin'))), true)
  assert.equal(Boolean(CreditTransactions.access?.create?.(createArgs('admin'))), true)
  assert.equal(Boolean(BillingSubscriptions.access?.update?.(createArgs('admin'))), true)
  assert.equal(Boolean(ShopifyPayments.access?.update?.(createArgs('admin'))), true)
})

test('customer direct REST writes are blocked for provider-owned workflow records', () => {
  assert.equal(Boolean(Models.access?.create?.(createArgs('customer'))), false)
  assert.equal(Boolean(GenerationTasks.access?.create?.(createArgs('customer'))), false)
  assert.equal(Boolean(GenerationTasks.access?.update?.(createArgs('customer'))), false)
  assert.equal(Boolean(TaskEvents.access?.create?.(createArgs('customer'))), false)
  assert.equal(Boolean(TaskEvents.access?.update?.(createArgs('customer'))), false)
  assert.equal(Boolean(TaskEvents.access?.delete?.(createArgs('customer'))), false)
  assert.equal(Boolean(PrintOrders.access?.create?.(createArgs('customer'))), false)

  assert.equal(Boolean(Models.access?.create?.(createArgs('operator'))), true)
  assert.equal(Boolean(GenerationTasks.access?.create?.(createArgs('operator'))), true)
  assert.equal(Boolean(GenerationTasks.access?.update?.(createArgs('operator'))), true)
  assert.equal(Boolean(TaskEvents.access?.create?.(createArgs('operator'))), true)
  assert.equal(Boolean(TaskEvents.access?.update?.(createArgs('operator'))), true)
  assert.equal(Boolean(TaskEvents.access?.delete?.(createArgs('operator'))), true)
  assert.equal(Boolean(PrintOrders.access?.create?.(createArgs('operator'))), true)
})

test('model proof and delivery fields are staff-writable only', () => {
  const fields = Models.fields as any[]
  const fieldByName = (name: string) => fields.find((field) => field.name === name)
  const formatsField = fieldByName('formats')
  const formatSubfieldByName = (name: string) => formatsField.fields.find((field: any) => field.name === name)
  const protectedFields = [
    fieldByName('viewerUrl'),
    fieldByName('viewCount'),
    fieldByName('commentsCount'),
    fieldByName('likesCount'),
    fieldByName('favoritesCount'),
    formatSubfieldByName('file'),
    formatSubfieldByName('downloadCredits'),
  ]

  for (const field of protectedFields) {
    assert.equal(Boolean(field.access.update(createArgs('customer'))), false)
    assert.equal(Boolean(field.access.update(createArgs('operator'))), true)
  }
})

test('creditsBalance remains admin-only on the users collection', () => {
  const creditsBalanceField = Users.fields.find((field: any) => field.name === 'creditsBalance') as any

  assert.equal(Boolean(creditsBalanceField.access.create(createArgs('operator'))), false)
  assert.equal(Boolean(creditsBalanceField.access.update(createArgs('operator'))), false)
  assert.equal(Boolean(creditsBalanceField.access.create(createArgs('admin'))), true)
  assert.equal(Boolean(creditsBalanceField.access.update(createArgs('admin'))), true)
})
