import config from '@payload-config'
import { createPayloadRequest, getAccessResults } from 'payload'

import { applySecurityHeaders, isPublicAccessEndpointEnabled } from '@/lib/requestSecurity'

function jsonResponse(body: unknown, init?: ResponseInit) {
  const response = Response.json(body, init)
  applySecurityHeaders(response.headers)
  return response
}

export const GET = async (request: Request) => {
  const req = await createPayloadRequest({
    config,
    request,
  })

  if (!req.user && !isPublicAccessEndpointEnabled()) {
    return jsonResponse(
      {
        message: 'Authentication required.',
      },
      { status: 401 },
    )
  }

  const response = jsonResponse(await getAccessResults({ req }))

  if (req.responseHeaders) {
    req.responseHeaders.forEach((value: string, key: string) => {
      response.headers.set(key, value)
    })
  }

  return response
}
