import test from 'node:test'
import assert from 'node:assert/strict'

import { Users } from '../src/collections/Users.ts'

test('Users collection keeps stripeCustomerId available and indexed for Stripe lookups', () => {
  const stripeCustomerField = Users.fields.find((field: any) => field.name === 'stripeCustomerId') as any

  assert.equal(stripeCustomerField?.type, 'text')
  assert.equal(stripeCustomerField?.index, true)
})

test('Users auth config still requires verification support', () => {
  assert.ok(Users.auth && typeof Users.auth === 'object')
  if (Users.auth && typeof Users.auth === 'object') {
    assert.ok(Users.auth.verify)
  }
})
