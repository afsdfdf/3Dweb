/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
import config from '@payload-config'
import { GRAPHQL_POST, REST_OPTIONS } from '@payloadcms/next/routes'
import { containsGraphQLIntrospectionQuery, isGraphQLIntrospectionEnabled } from '@/lib/requestSecurity'
import { validateGraphQLQuerySecurity } from '@/lib/graphqlSecurity'

const graphQLPostHandler = GRAPHQL_POST(config)

export const POST = async (request: Request) => {
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
