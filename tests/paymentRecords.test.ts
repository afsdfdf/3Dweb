import assert from 'node:assert/strict'
import test from 'node:test'

import {
  getPaymentCheckoutUrl,
  getPaymentCustomerReference,
  getPaymentOrderReference,
  getPaymentProviderLabel,
  getPaymentProviderKey,
  getPaymentSessionId,
  setPaymentLegacyFields,
} from '../src/lib/paymentRecords.ts'

test('paymentRecords normalizes neutral reads from legacy fields', () => {
  const carrier = {
    checkoutReference: 'checkout-ref-1',
    shopifyCheckoutId: 'session_123',
    shopifyCheckoutUrl: 'https://checkout.example.com/session_123',
    shopifyCustomerId: 'customer_legacy',
    shopifyOrderId: 'order_legacy',
  }

  assert.equal(getPaymentSessionId(carrier), 'session_123')
  assert.equal(getPaymentCheckoutUrl(carrier), 'https://checkout.example.com/session_123')
  assert.equal(getPaymentOrderReference(carrier), 'order_legacy')
  assert.equal(getPaymentCustomerReference(carrier), 'customer_legacy')
})

test('paymentRecords falls back to checkout reference and stripe customer reference when needed', () => {
  assert.equal(getPaymentSessionId({ checkoutReference: 'checkout-ref-2' }), 'checkout-ref-2')
  assert.equal(getPaymentCustomerReference({ stripeCustomerId: 'cus_stripe_123' }), 'cus_stripe_123')
})

test('paymentRecords derives provider key from webhook payload', () => {
  assert.equal(getPaymentProviderKey({ provider: 'shopify' }), 'shopify')
  assert.equal(getPaymentProviderKey({ provider: 'stripe' }), 'stripe')
  assert.equal(getPaymentProviderKey(undefined), 'stripe')
})

test('paymentRecords derives provider label for UI-safe display', () => {
  assert.equal(getPaymentProviderLabel({ provider: 'shopify' }), 'Shopify')
  assert.equal(getPaymentProviderLabel({ provider: 'stripe' }), 'Stripe')
  assert.equal(getPaymentProviderLabel({ provider: 'unknown' }), 'Stripe')
})

test('paymentRecords trims neutral values when mapping legacy fields', () => {
  assert.deepEqual(
    setPaymentLegacyFields({
      checkoutUrl: ' https://checkout.example.com/session_789 ',
      customerReference: ' customer_789 ',
      orderReference: ' order_789 ',
      sessionId: ' session_789 ',
    }),
    {
      shopifyCheckoutId: 'session_789',
      shopifyCheckoutUrl: 'https://checkout.example.com/session_789',
      shopifyCustomerId: 'customer_789',
      shopifyOrderId: 'order_789',
    },
  )
})

test('paymentRecords maps neutral patch fields back to legacy schema fields', () => {
  assert.deepEqual(
    setPaymentLegacyFields({
      checkoutUrl: 'https://checkout.example.com/session_456',
      customerReference: 'customer_456',
      orderReference: 'order_456',
      sessionId: 'session_456',
    }),
    {
      shopifyCheckoutId: 'session_456',
      shopifyCheckoutUrl: 'https://checkout.example.com/session_456',
      shopifyCustomerId: 'customer_456',
      shopifyOrderId: 'order_456',
    },
  )
})
