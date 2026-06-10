/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
import config from '@payload-config'
import { GRAPHQL_POST, REST_OPTIONS } from '@payloadcms/next/routes'
import { containsGraphQLIntrospectionQuery, getRequestRateLimitKey, isGraphQLIntrospectionEnabled } from '@/lib/requestSecurity'
import { validateGraphQLQuerySecurity } from '@/lib/graphqlSecurity'
import { enforceRateLimit, getRateLimitConfig } from '@/lib/rateLimit'

const graphQLPostHandler = GRAPHQL_POST(config)

export const POST = async (request: Request) => {
  const rateLimitConfig = getRateLimitConfig({
    fallbackLimit: 120,
    fallbackWindowMs: 60 * 1000,
    limitEnv: 'GRAPHQL_RATE_LIMIT_MAX',
    windowEnv: 'GRAPHQL_RATE_LIMIT_WINDOW_MS',
  })
  const rateLimitResult = await enforceRateLimit({
    key: `endpoint:graphql:${getRequestRateLimitKey(request.headers)}`,
    limit: rateLimitConfig.limit,
    windowMs: rateLimitConfig.windowMs,
  })

  if (!rateLimitResult.allowed) {
    return Response.json(
      { message: 'Too many GraphQL requests. Please try again later.' },
      {
        headers: {
          'Retry-After': String(Math.max(1, Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000))),
        },
        status: 429,
      },
    )
  }

  const requestBody = await request.clone().text()

  if (!isGraphQLIntrospectionEnabled()) {
    if (containsGraphQLIntrospectionQuery(requestBody)) {
      return Response.json(
        {
          message: 'GraphQL introspection is disabled.',
        },
        { status: 403 },
      )
    }
  }

  if (process.env.NODE_ENV === 'production') {
    const validation = validateGraphQLQuerySecurity(requestBody)
    if (!validation.ok) {
      return Response.json(
        {
          message: validation.message,
        },
        { status: 400 },
      )
    }
  }

  return graphQLPostHandler(request)
}

export const OPTIONS = REST_OPTIONS(config)
