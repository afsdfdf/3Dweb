import assert from 'node:assert/strict'
import test from 'node:test'

import { defaultMeshyGenerationPricing, resolveMeshyGenerationCredits } from '../src/lib/taskBilling.ts'

test('resolveMeshyGenerationCredits prices text, single-image, and multi-image 3D separately', () => {
  assert.equal(
    resolveMeshyGenerationCredits({
      inputMode: 'text',
      pricing: defaultMeshyGenerationPricing,
    }),
    30,
  )

  assert.equal(
    resolveMeshyGenerationCredits({
      inputMode: 'hybrid',
      pricing: {
        imageTo3DCredits: 31,
        multiImageTo3DCredits: 42,
        textTo3DCredits: 29,
      },
      sourceImageAssets: [{ publicUrl: 'https://cdn.example/a.png' }],
    }),
    31,
  )

  assert.equal(
    resolveMeshyGenerationCredits({
      inputMode: 'hybrid',
      pricing: {
        imageTo3DCredits: 31,
        multiImageTo3DCredits: 42,
        textTo3DCredits: 29,
      },
      sourceImageAssets: [{ publicUrl: 'https://cdn.example/a.png' }, { publicUrl: 'https://cdn.example/b.png' }],
    }),
    42,
  )
})
