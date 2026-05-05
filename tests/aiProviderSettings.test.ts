import assert from 'node:assert/strict'
import test from 'node:test'

import { AIProviderSettings } from '../src/globals/AIProviderSettings.ts'

test('AI Provider Settings exposes provider, polling, credit, and image generation settings', () => {
  const fieldNames = AIProviderSettings.fields.map((field: any) => field.name).filter(Boolean)

  assert.ok(fieldNames.includes('defaultProvider'))
  assert.ok(fieldNames.includes('mockMode'))
  assert.ok(fieldNames.includes('polling'))
  assert.ok(fieldNames.includes('creditRules'))
  assert.ok(fieldNames.includes('meshy'))
  assert.ok(fieldNames.includes('providers'))
  assert.ok(fieldNames.includes('imageGeneration'))
})

test('AI Provider Settings keeps dedicated Meshy and image-generation groups', () => {
  const meshyField = AIProviderSettings.fields.find((field: any) => field.name === 'meshy') as any
  const imageGenerationField = AIProviderSettings.fields.find((field: any) => field.name === 'imageGeneration') as any
  const meshyNames = meshyField.fields.map((field: any) => field.name).filter(Boolean)
  const imageGenerationNames = imageGenerationField.fields.map((field: any) => field.name).filter(Boolean)
  const defaultProviderField = imageGenerationField.fields.find((field: any) => field.name === 'defaultProvider') as any
  const defaultProviderOptions = defaultProviderField.options.map((option: any) => option.value)

  assert.ok(meshyNames.includes('textTo3DAiModel'))
  assert.ok(meshyNames.includes('imageTo3DAiModel'))
  assert.ok(meshyNames.includes('apiKeyMode'))
  assert.ok(meshyNames.includes('apiKey'))
  assert.ok(meshyNames.includes('multiImageEnabled'))
  assert.ok(meshyNames.includes('pricing'))
  assert.ok(meshyNames.includes('targetFormats'))
  assert.ok(imageGenerationNames.includes('official'))
  assert.ok(imageGenerationNames.includes('thirdParty'))
  assert.ok(imageGenerationNames.includes('openAICompatible'))
  assert.ok(defaultProviderOptions.includes('openai-compatible'))
})
