import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'

import {
  printBaseMaterial,
  printBasePrice,
  printBaseServiceLabel,
  printBaseSize,
  printMaterialOptions,
  printSizeOptions,
} from '../src/app/(frontend)/_lib/printPricing.ts'

test('print base price equals the default size + material (Standard + Plastic)', () => {
  assert.equal(printBaseSize.key, 'standard')
  assert.equal(printBaseMaterial.key, 'plastic')
  assert.equal(printBasePrice, printSizeOptions[0].price + printMaterialOptions[0].price)
  assert.equal(printBasePrice, 39.9)
})

test('print base service label describes the configured base option', () => {
  assert.equal(printBaseServiceLabel, 'Standard · Plastic 3D print')
})

test('model detail cart no longer uses the hardcoded placeholder price', () => {
  const source = readFileSync(
    path.join(process.cwd(), 'src/app/(frontend)/model-detail/ModelDetailNative.tsx'),
    'utf8',
  )
  // The old placeholder ($25 / $22.50) must not reappear; the cart sources the
  // real base print price from the shared pricing module instead.
  assert.doesNotMatch(source, /discountedPrice:\s*22\.5/)
  assert.doesNotMatch(source, /originalPrice:\s*25\b/)
  assert.match(source, /discountedPrice:\s*printBasePrice/)
})
