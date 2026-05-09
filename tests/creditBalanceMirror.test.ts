import assert from 'node:assert/strict'
import test from 'node:test'

import { Credits } from '../src/collections/Credits.ts'
import { syncCreditBalanceMirror } from '../src/hooks/syncCreditBalanceMirror.ts'

test('credits collection syncs the user credit balance mirror after admin edits', async () => {
  assert.ok(Credits.hooks?.afterChange?.includes(syncCreditBalanceMirror))

  const updates: unknown[] = []
  const req = {
    payload: {
      update: async (args: unknown) => {
        updates.push(args)
        return {}
      },
    },
  }

  await syncCreditBalanceMirror({
    doc: {
      balance: 1000,
      user: 42,
    },
    req,
  } as never)

  assert.deepEqual(updates, [
    {
      collection: 'users',
      data: {
        creditsBalance: 1000,
      },
      id: 42,
      overrideAccess: true,
      req,
    },
  ])
})
