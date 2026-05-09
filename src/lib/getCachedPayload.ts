import config from '@payload-config'
import { getPayload } from 'payload'

let payloadPromise: ReturnType<typeof getPayload> | null = null

export function getCachedPayload(): ReturnType<typeof getPayload> {
  if (!payloadPromise) {
    payloadPromise = getPayload({ config }).catch((error) => {
      payloadPromise = null
      throw error
    })
  }

  return payloadPromise
}
