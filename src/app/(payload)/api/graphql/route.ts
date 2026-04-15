/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
import config from '@payload-config'
import { GRAPHQL_POST, REST_OPTIONS } from '@payloadcms/next/routes'
import { containsGraphQLIntrospectionQuery } from '@/lib/requestSecurity'

const graphQLPostHandler = GRAPHQL_POST(config)

export const POST = async (request: Request) => {
  if (process.env.NODE_ENV === 'production') {
    const requestBody = await request.clone().text()
    if (containsGraphQLIntrospectionQuery(requestBody)) {
      return Response.json(
        {
          message: 'GraphQL introspection is disabled in production.',
        },
        { status: 403 },
      )
    }
  }

  return graphQLPostHandler(request)
}

export const OPTIONS = REST_OPTIONS(config)
