import assert from 'node:assert/strict'
import test from 'node:test'

import { CreditProducts } from '../src/collections/CreditProducts.ts'
import { SiteSettings } from '../src/globals/SiteSettings.ts'

type FieldLike = {
  fields?: FieldLike[]
  name?: string
  tabs?: Array<{ fields?: FieldLike[] }>
  type?: string
  validate?: (value: unknown, options?: Record<string, unknown>) => unknown
}

function findField(fields: FieldLike[], path: string[]): FieldLike {
  const [head, ...tail] = path

  for (const field of fields) {
    if (field.type === 'tabs' && Array.isArray(field.tabs)) {
      for (const tab of field.tabs) {
        const match = findField(tab.fields || [], path)
        if (match) return match
      }
    }

    if (field.name !== head) {
      continue
    }

    if (tail.length === 0) {
      return field
    }

    return findField(field.fields || [], tail)
  }

  return null as never
}

async function validateField(field: FieldLike, value: unknown, options: Record<string, unknown> = {}) {
  assert.equal(typeof field.validate, 'function')
  return field.validate(value, options)
}

test('subscription plan settings validate editable price and credit bounds', async () => {
  const monthlyPrice = findField(SiteSettings.fields as FieldLike[], ['subscriptionPlans', 'pro', 'monthlyPrice'])
  const yearlyPrice = findField(SiteSettings.fields as FieldLike[], ['subscriptionPlans', 'pro', 'yearlyPrice'])
  const creditsPerMonth = findField(SiteSettings.fields as FieldLike[], ['subscriptionPlans', 'pro', 'creditsPerMonth'])

  assert.equal(await validateField(monthlyPrice, 59), true)
  assert.equal(await validateField(yearlyPrice, 470.4), true)
  assert.equal(await validateField(creditsPerMonth, 760), true)

  assert.match(String(await validateField(monthlyPrice, 0)), /price/i)
  assert.match(String(await validateField(yearlyPrice, -1)), /price/i)
  assert.match(String(await validateField(creditsPerMonth, 0)), /credits/i)
})

test('credit top-up settings validate package economics and currency', async () => {
  const globalCredits = findField(SiteSettings.fields as FieldLike[], ['creditPackages', 'credits'])
  const globalPrice = findField(SiteSettings.fields as FieldLike[], ['creditPackages', 'price'])
  const globalCurrency = findField(SiteSettings.fields as FieldLike[], ['creditPackages', 'currency'])
  const productCredits = findField(CreditProducts.fields as FieldLike[], ['credits'])
  const productPrice = findField(CreditProducts.fields as FieldLike[], ['price'])
  const productCurrency = findField(CreditProducts.fields as FieldLike[], ['currency'])

  assert.equal(await validateField(globalCredits, 100), true)
  assert.equal(await validateField(globalPrice, 9.99), true)
  assert.equal(await validateField(globalCurrency, 'usd'), true)
  assert.equal(await validateField(productCredits, 100, { siblingData: { productType: 'credit-topup' } }), true)
  assert.equal(await validateField(productCredits, 0, { siblingData: { productType: 'print-package' } }), true)
  assert.equal(await validateField(productPrice, 9.99), true)
  assert.equal(await validateField(productCurrency, 'USD'), true)

  assert.match(String(await validateField(globalCredits, 0)), /credits/i)
  assert.match(String(await validateField(globalPrice, 0)), /price/i)
  assert.match(String(await validateField(globalCurrency, 'BTC')), /currency/i)
  assert.match(String(await validateField(productCredits, 0, { siblingData: { productType: 'credit-topup' } })), /credits/i)
  assert.match(String(await validateField(productPrice, 0)), /price/i)
  assert.match(String(await validateField(productCurrency, 'BTC')), /currency/i)
})

test('generation and model access pricing cannot be negative', async () => {
  const imageCredits = findField(SiteSettings.fields as FieldLike[], ['generationPricing', 'imageCredits'])
  const previewCredits = findField(SiteSettings.fields as FieldLike[], ['modelAccessPolicy', 'previewCredits'])
  const downloadCredits = findField(SiteSettings.fields as FieldLike[], ['modelAccessPolicy', 'downloadCredits'])

  assert.equal(await validateField(imageCredits, 2), true)
  assert.equal(await validateField(previewCredits, 0), true)
  assert.equal(await validateField(downloadCredits, 0), true)

  assert.match(String(await validateField(imageCredits, -1)), /credits/i)
  assert.match(String(await validateField(previewCredits, -1)), /credits/i)
  assert.match(String(await validateField(downloadCredits, -1)), /credits/i)
})
