import assert from 'node:assert/strict'
import test from 'node:test'

import { validateGraphQLQuerySecurity } from '../src/lib/graphqlSecurity.ts'

test('validateGraphQLQuerySecurity rejects too many top-level selections', () => {
  const query = `
    query AliasFanout {
      a1: Media(id: 1) { id }
      a2: Media(id: 2) { id }
      a3: Media(id: 3) { id }
      a4: Media(id: 4) { id }
      a5: Media(id: 5) { id }
      a6: Media(id: 6) { id }
      a7: Media(id: 7) { id }
      a8: Media(id: 8) { id }
      a9: Media(id: 9) { id }
      a10: Media(id: 10) { id }
      a11: Media(id: 11) { id }
      a12: Media(id: 12) { id }
      a13: Media(id: 13) { id }
      a14: Media(id: 14) { id }
      a15: Media(id: 15) { id }
      a16: Media(id: 16) { id }
      a17: Media(id: 17) { id }
      a18: Media(id: 18) { id }
      a19: Media(id: 19) { id }
      a20: Media(id: 20) { id }
      a21: Media(id: 21) { id }
    }
  `

  const result = validateGraphQLQuerySecurity(query)

  assert.equal(result.ok, false)
  if (!result.ok) {
    assert.match(result.message, /top-level selection limit exceeded/i)
  }
})
