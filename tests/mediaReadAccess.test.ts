import test from 'node:test'
import assert from 'node:assert/strict'

import { mediaReadAccess } from '../src/lib/mediaReadAccess.ts'

test('mediaReadAccess allows staff to read all media', async () => {
  const result = await mediaReadAccess({
    req: {
      user: {
        id: 1,
        role: 'admin',
      },
    },
  } as never)

  assert.equal(result, true)
})

test('mediaReadAccess limits anonymous access to preview media', async () => {
  const result = await mediaReadAccess({
    req: {},
  } as never)

  assert.deepEqual(result, {
    purpose: {
      equals: 'preview',
    },
  })
})

test('mediaReadAccess allows owners and public preview media for signed-in customers', async () => {
  const result = await mediaReadAccess({
    req: {
      user: {
        id: 7,
        role: 'customer',
      },
    },
  } as never)

  assert.deepEqual(result, {
    or: [
      {
        owner: {
          equals: 7,
        },
      },
      {
        purpose: {
          equals: 'preview',
        },
      },
    ],
  })
})

