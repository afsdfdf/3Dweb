import type { PayloadRequest } from 'payload'
import { generateExpiredPayloadCookie, logoutOperation } from 'payload'

import { extractRequestToken, rejectDisallowedMutationOrigin } from '@/lib/requestSecurity'
import { revokeToken } from '@/lib/tokenRevocation'

export const sessionLogoutEndpoint = {
  path: '/platform/session/logout',
  method: 'post' as const,
  handler: async (req: PayloadRequest) => {
    const blocked = await rejectDisallowedMutationOrigin(req)
    if (blocked) return blocked

    const collection = req.payload.collections.users
    const headers = new Headers()
    headers.set('Cache-Control', 'no-store')
    headers.set(
      'Set-Cookie',
      generateExpiredPayloadCookie({
        collectionAuthConfig: collection.config.auth,
        config: req.payload.config,
        cookiePrefix: req.payload.config.cookiePrefix,
      }),
    )

    if (!req.user || req.user.collection !== collection.config.slug) {
      return Response.json(
        {
          message: 'Session cleared',
        },
        {
          headers,
          status: 200,
        },
      )
    }

    const token = extractRequestToken(req.headers)
    if (token) {
      await revokeToken(token)
    }

    await logoutOperation({
      allSessions: String(req.query?.allSessions || '') === 'true',
      collection,
      req,
    })

    return Response.json(
      {
        message: 'Session cleared',
      },
      {
        headers,
        status: 200,
      },
    )
  },
}
