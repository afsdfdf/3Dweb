import assert from 'node:assert/strict'
import test from 'node:test'

import {
  defaultGenerationPricing,
  defaultMeshyGenerationPricing,
  getTaskBillingSettingsForPayload,
  resolveMeshyGenerationCredits,
} from '../src/lib/taskBilling.ts'

test('resolveMeshyGenerationCredits prices text, single-image, and multi-image 3D separately', () => {
  assert.equal(
    resolveMeshyGenerationCredits({
      inputMode: 'text',
      pricing: defaultMeshyGenerationPricing,
    }),
    20,
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

test('default generation pricing charges 20 credits for generation paths', () => {
  assert.equal(defaultGenerationPricing.textCredits, 20)
  assert.equal(defaultGenerationPricing.imageCredits, 20)
  assert.equal(defaultGenerationPricing.hybridCredits, 20)
  assert.equal(defaultMeshyGenerationPricing.textTo3DCredits, 20)
  assert.equal(defaultMeshyGenerationPricing.imageTo3DCredits, 20)
  assert.equal(defaultMeshyGenerationPricing.multiImageTo3DCredits, 20)
})

test('task billing always requires submit reservation and ignores non-positive generation prices', async () => {
  const settings = await getTaskBillingSettingsForPayload({
    findGlobal: async ({ slug }: { slug: string }) => {
      if (slug === 'ai-provider-settings') {
        return {
          creditRules: {
            refundOnFailure: true,
            reserveOnSubmit: false,
          },
          meshy: {
            pricing: {
              imageTo3DCredits: 0,
              multiImageTo3DCredits: 0,
              textTo3DCredits: 0,
            },
          },
        }
      }

      return {
        generationPricing: {
          downloadCredits: 0,
          hybridCredits: 0,
          imageCredits: 0,
          textCredits: 0,
        },
      }
    },
  } as any)

  assert.equal(settings.creditRules.reserveOnSubmit, true)
  assert.equal(settings.generationPricing.textCredits, 20)
  assert.equal(settings.generationPricing.imageCredits, 20)
  assert.equal(settings.generationPricing.hybridCredits, 20)
  assert.equal(settings.meshyPricing.textTo3DCredits, 20)
  assert.equal(settings.meshyPricing.imageTo3DCredits, 20)
  assert.equal(settings.meshyPricing.multiImageTo3DCredits, 20)
})
