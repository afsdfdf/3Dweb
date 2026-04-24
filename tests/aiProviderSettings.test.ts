import test from 'node:test'
import assert from 'node:assert/strict'

import { AIProviderSettings } from '../src/globals/AIProviderSettings.ts'

test('AI Provider Settings exposes tabs for general, 3D model API, image generation API, and LLM API', () => {
  const tabsField = AIProviderSettings.fields.find((field: any) => field.type === 'tabs') as any
  assert.ok(tabsField)
  assert.equal(tabsField.tabs.length, 4)
})

test('AI Provider Settings keeps dedicated groups for model, image, and llm providers', () => {
  const tabsField = AIProviderSettings.fields.find((field: any) => field.type === 'tabs') as any
  const tabFieldNames = tabsField.tabs.flatMap((tab: any) => tab.fields.map((field: any) => field.name)).filter(Boolean)

  assert.ok(tabFieldNames.includes('model3DAPI'))
  assert.ok(tabFieldNames.includes('imageGenerationAPI'))
  assert.ok(tabFieldNames.includes('llmAPI'))
})
