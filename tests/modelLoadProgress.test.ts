import assert from 'node:assert/strict'
import test from 'node:test'

import { getModelLoadPhaseDisplay } from '../src/lib/modelLoadProgress.ts'

test('model load progress keeps download below parse and ready phases', () => {
  const download = getModelLoadPhaseDisplay({ phase: 'download', progress: 76 })
  const cache = getModelLoadPhaseDisplay({ phase: 'cache', progress: 0 })
  const validate = getModelLoadPhaseDisplay({ phase: 'validate', progress: 20 })
  const parse = getModelLoadPhaseDisplay({ phase: 'parse', progress: 20 })
  const ready = getModelLoadPhaseDisplay({ phase: 'ready', progress: 100 })

  assert.equal(cache.stage, 'NETWORK')
  assert.equal(cache.progress, 6)
  assert.equal(download.stage, 'NETWORK')
  assert.equal(download.progress, 76)
  assert.equal(validate.stage, 'VERIFY')
  assert.equal(validate.progress, 84)
  assert.equal(parse.stage, 'PARSE')
  assert.equal(parse.progress, 92)
  assert.equal(ready.stage, 'READY')
  assert.equal(ready.progress, 100)
})

test('model load progress clamps non-terminal phases below complete', () => {
  const download = getModelLoadPhaseDisplay({ phase: 'download', progress: 120 })
  const parse = getModelLoadPhaseDisplay({ phase: 'parse', progress: 120 })

  assert.equal(download.progress, 99)
  assert.equal(parse.progress, 99)
})
