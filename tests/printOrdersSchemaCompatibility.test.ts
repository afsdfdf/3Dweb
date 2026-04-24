import test from 'node:test'
import assert from 'node:assert/strict'

import { PrintOrders } from '../src/collections/PrintOrders.ts'

test('PrintOrders collection includes paymentStatus for payment and fulfillment separation', () => {
  const paymentStatusField = PrintOrders.fields.find((field: any) => field.name === 'paymentStatus') as any

  assert.equal(paymentStatusField?.type, 'select')
  assert.equal(paymentStatusField?.defaultValue, 'pending')
  assert.deepEqual(
    paymentStatusField?.options?.map((option: any) => option.value),
    ['pending', 'paid', 'failed', 'refunded'],
  )
})
